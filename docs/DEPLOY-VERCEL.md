# Deploying Project51 to Vercel (with Cloudflare R2 media)

This is the **Vercel + R2** runbook for the per-website workspace slice. It supersedes
`DEPLOY.md` (Railway/local-disk) for the new hosting target. It is **runbook only** —
nothing here is executed by the implementation. No `vercel deploy`, no R2 provisioning,
no DNS changes are performed automatically. The operator runs these steps.

## What changed from the Railway shape

| Concern | Railway (old) | Vercel + R2 (new) |
|---|---|---|
| Host | Railway (persistent container) | Vercel (serverless functions) |
| Media | Local disk (`MEDIA_DIR`, persistent volume) | Cloudflare R2 via `@payloadcms/storage-s3`, served from a CDN domain |
| DB pool | Long-lived process | Small per-instance `pg` pool against the Neon **pooled** host |
| Build | `railway.toml` | `vercel.json` (`framework: nextjs`) |
| Migrations | Run on every boot (`startCommand`) | Run manually / in a release step against `DATABASE_URL_DIRECT` |

> There is **no persistent filesystem on Vercel.** Media MUST go to R2 in production.
> When `R2_BUCKET` is unset the app falls back to local disk (dev/test only) — that
> fallback is not viable on Vercel.

## 1. Provision Cloudflare R2 (GATED — operator does this)

See `docs/R2-MEDIA.md` for the detailed R2 + skill steps. Summary:

1. Create an R2 bucket (e.g. `project51-media`).
2. Create an R2 **API token** (Account → R2 → Manage API Tokens) with Object Read & Write
   scoped to that bucket. Record the Access Key ID + Secret Access Key.
3. Note your **S3 API endpoint**: `https://<accountId>.r2.cloudflarestorage.com`.
4. Enable public access for serving:
   - Quick: enable the bucket's **r2.dev** public subdomain, OR
   - Production: connect a **custom domain** (e.g. `media.project51.ai`) for a clean,
     cacheable CDN URL (the SEO win).
   This domain is your `R2_PUBLIC_URL`.

## 2. Required Vercel environment variables

Set these in the Vercel project (Settings → Environment Variables). Do NOT commit secrets.

### Required

| Variable | Value / notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** (`-pooler`) connection string |
| `DATABASE_URL_DIRECT` | Neon **direct** (non-pooler) host; used for migrations |
| `DATABASE_POOL_MAX` | `5` (keep low on serverless; optional, defaults to 5) |
| `PAYLOAD_SECRET` | New 32-byte hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `NEXT_PUBLIC_SERVER_URL` | The Vercel domain at first deploy; cut over to the real domain later |
| `SITE_INDEXABLE` | `false` until DNS cutover |
| `R2_BUCKET` | e.g. `project51-media` |
| `R2_ENDPOINT` | `https://<accountId>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | from step 1 |
| `R2_SECRET_ACCESS_KEY` | from step 1 |
| `R2_PUBLIC_URL` | CDN base, e.g. `https://media.project51.ai` (no trailing slash) |
| `NODE_ENV` | `production` (Vercel sets this automatically) |

### Required only if this deployment is a publishing target

| Variable | Required for |
|---|---|
| `SITE_AUTHORING_TOKEN` | The privileged `/mcp/authoring` endpoint. The platform spawn handler injects the same value into the spawned Claude's env. The route is **fail-closed**: unset ⇒ every authoring request returns 401. |

### Optional / phase-2

`CALENDLY_WEBHOOK_SECRET`, `CALENDLY_BOOKING_URL`, `SLACK_WEBHOOK_URL`, `INDEXNOW_KEY`,
`SENTRY_DSN` — same as `DEPLOY.md`; all degrade silently when unset.

## 3. Build configuration

`vercel.json` (committed) sets:

- `framework: nextjs`
- `installCommand: pnpm install --frozen-lockfile`
- `buildCommand: pnpm payload generate:importmap && pnpm payload generate:types && pnpm build`
  - `generate:importmap` is **required** so the Payload admin resolves the storage
    plugin's components at runtime; skipping it breaks the admin panel.
- `functions`: 1024MB / extended `maxDuration` for the Payload API route and both MCP
  routes (Lexical conversion + DB writes can exceed the 10s Hobby default; the authoring
  route also sets `export const maxDuration = 60` inline as a belt-and-braces measure).

## 4. Database migrations (run manually — not on boot)

Vercel has no persistent boot step, so do NOT rely on a start command. Run migrations
from your machine or a CI release step against the **direct** host:

```bash
# .env.local must have DATABASE_URL_DIRECT pointing at the Neon direct host
pnpm payload migrate
```

Apply the platform-side `published_blogs` migration on the PLATFORM database separately
(that is a different repo/DB; see the platform runbook).

## 5. First deploy (GATED — operator runs `vercel`)

```bash
npm i -g vercel
vercel link            # link this folder to a Vercel project
vercel pull            # pull env locally (optional)
vercel                 # preview deploy
vercel --prod          # production deploy
```

Set `NEXT_PUBLIC_SERVER_URL` to the assigned domain, then redeploy.

## 6. Smoke test

```bash
BASE=https://<your-vercel-domain>

curl -sf $BASE/api/health                                  # {"ok":true}
curl -sf $BASE/.well-known/mcp/server-card.json   > /dev/null

# Public MCP (unauthenticated, read-only) — tools/list must NOT include create_blog_post
curl -sS -X POST $BASE/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 600

# Authoring MCP — must 401 without the token
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/mcp/authoring \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# → 401

# Authoring MCP — tools/list WITH the token must include create_blog_post
curl -sS -X POST $BASE/mcp/authoring \
  -H "authorization: Bearer $SITE_AUTHORING_TOKEN" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 600
```

After creating + publishing one post, confirm any uploaded media URL points at
`R2_PUBLIC_URL` (not the app origin).

## 7. Domain cutover

Same as `DEPLOY.md` §"Domain cutover", but on Vercel (Settings → Domains): attach the
domain, wait for SSL, set `NEXT_PUBLIC_SERVER_URL` + `SITE_INDEXABLE=true`, redeploy.

## Notes / gotchas

- **4.5MB upload limit:** server-side uploads through a Vercel Function cap at ~4.5MB.
  For larger media, set `clientUploads: true` on the R2 plugin (in `src/lib/storage.ts`)
  to upload browser→R2 directly. Left off for the slice (small media).
- **Pooled host is mandatory:** using the Neon **direct** host as `DATABASE_URL` will
  exhaust connections under serverless burst. Always use the `-pooler` host.
- `railway.toml` is left in the repo for reference but is unused on Vercel.
