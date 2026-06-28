# Deploying Project51 Marketing Site to Railway

Phase I of the implementation plan. The code is complete and tested; this document is the manual runbook to provision Railway and ship the site live.

## Prerequisites

1. A Railway account.
2. A Railway API token. Get it at https://railway.com/account/tokens, or pre-set `RAILWAY_TOKEN` in your shell.
3. (Optional) A Railway persistent volume mounted at `./media` if you want admin-uploaded media to survive redeploys (see "Persistent media" below).

## One-time Railway provisioning

```bash
# Install the CLI
npm install -g @railway/cli

# Authenticate (browser-based; pastes a code)
railway login

# Initialize from this repo's root
cd /path/to/project51-web
railway init
# Choose: Create a new project; name it "project51-web".
```

This generates a `.railway/` directory locally — already gitignored.

## Configure environment variables

Use the Railway dashboard (Project → Variables) to set these. Do NOT paste secrets into your shell or commit them anywhere.

### Required

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string for the production branch |
| `DATABASE_URL_DIRECT` | Neon **direct** (non-pooler) hostname; same db |
| `PAYLOAD_SECRET` | A new 32-byte hex string (do NOT reuse local). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SERVER_URL` | The Railway temp domain at first launch (e.g. `https://project51-production-xxxx.up.railway.app`); cut over to `https://project51.ai` later |
| `SITE_INDEXABLE` | `false` — keep until DNS cutover so the temp domain doesn't accrue index signals |
| `MEDIA_DIR` | `media` (the relative path Payload writes to; matches the persistent volume mount path) |
| `NODE_ENV` | `production` |

### Optional / phase-2

| Variable | Required for |
|---|---|
| `CALENDLY_WEBHOOK_SECRET` | `/webhooks/calendly` HMAC verification |
| `CALENDLY_BOOKING_URL` | The `book_discovery_call` MCP tool |
| `SLACK_WEBHOOK_URL` | Outbound notifications from contact form & webhooks |
| `INDEXNOW_KEY` | Bing/Yandex IndexNow push (post-DNS-cutover) |
| `SENTRY_DSN` | Error monitoring |

Skip these at first deploy if not yet configured. `notifySlack`, `pingIndexNow`, and the Calendly route all degrade silently when their env vars are unset.

## Build / start / health

These are already set in `railway.toml` at the repo root:

- **Build:** `pnpm install --frozen-lockfile && pnpm build`
- **Start:** `pnpm payload migrate && pnpm start`
- **Health:** `/api/health` (30 s timeout, `ON_FAILURE` restart policy)

Migrations run on every boot and are idempotent — applying nothing if up-to-date.

## First deploy

```bash
# Deploys the current local working tree
railway up

# Or push to main and let Railway auto-deploy:
git push origin main
```

Watch the build:

```bash
railway logs --build
railway logs   # runtime, after the build completes
```

Get the temp domain:

```bash
railway domain
```

Then set `NEXT_PUBLIC_SERVER_URL` to that URL in the Railway dashboard and trigger a redeploy.

## Smoke-test against the temp domain

```bash
TEMP=https://<your-temp-domain>.up.railway.app

curl -sf $TEMP/api/health
# → {"ok":true}

curl -s $TEMP/robots.txt
# SITE_INDEXABLE=false → "User-agent: * / Disallow: /"

curl -s $TEMP/                                           | head -c 200
curl -s $TEMP/admin                                      | head -c 200
curl -sf $TEMP/.well-known/api-catalog                   > /dev/null
curl -sf $TEMP/.well-known/mcp/server-card.json          > /dev/null
curl -sf $TEMP/.well-known/agent-skills/index.json       > /dev/null
curl -sf $TEMP/sitemap.xml                               > /dev/null
curl -sf $TEMP/feed.xml                                  > /dev/null
curl -sf $TEMP/llms.txt                                  > /dev/null

# MCP round-trip
curl -sS -X POST $TEMP/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 400

# Markdown content negotiation (after creating + publishing one post)
curl -s -H 'Accept: text/markdown' $TEMP/blog/<slug> | head
```

Then visit `$TEMP/admin` in a browser and create the first admin user.

## Persistent media (recommended)

Railway's container filesystem is ephemeral. Without a persistent volume, media uploaded via the admin panel are wiped on every redeploy.

In the Railway dashboard:
1. Project → Service → Volumes → New Volume
2. Mount path: `/app/media`
3. Save

Then redeploy. Subsequent uploads land on the volume and survive container replacements.

If you want the volume mount path to differ from `media`, set the `MEDIA_DIR` env var to match.

## Domain cutover (project51.ai)

When you're ready to flip the live domain:

1. Configure custom domain `project51.ai` (and `www.project51.ai`) on the Railway service.
2. Configure DNS at the registrar (or Cloudflare): point both records to Railway via CNAME.
3. Wait for SSL certificate provisioning (usually ≤5 min).
4. Update Railway env: `NEXT_PUBLIC_SERVER_URL=https://project51.ai`.
5. Update Railway env: `SITE_INDEXABLE=true`.
6. Trigger a redeploy.
7. (If using IndexNow) the key file is now served at `https://project51.ai/.well-known/indexnow/<INDEXNOW_KEY>.txt`.
8. Verify the new domain in Google Search Console + Bing Webmaster Tools, submit `/sitemap.xml` in both.
9. Walk through the smoke-test commands above against `https://project51.ai`.
10. Verify the MCP round-trip, the `Accept: text/markdown` negotiation, and JSON-LD rendering on a representative content page.

## CI/CD already wired

- `.github/workflows/ci.yml` — typecheck + lint + test + build on PR and push to main. Uses dummy env vars at build time (Zod parse needs the shape, not real DB).
- `.github/workflows/e2e.yml` — workflow_dispatch only; activate after a Railway preview URL is available by changing `on:` to `pull_request:` and setting `E2E_BASE_URL` from a Railway preview output.
- `.github/workflows/indexnow.yml` — pings IndexNow on every successful production `deployment_status` (skips silently if no key).

## Cost notes

- Railway: pay-per-resource. The marketing site at MVP traffic should fit comfortably under their starter usage budgets.
- Neon: free tier covers the early stage; consider promoting to a paid plan when production traffic justifies it.
