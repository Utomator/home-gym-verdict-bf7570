# Cloudflare R2 media for Project51

Project51 serves admin-uploaded media from **Cloudflare R2** (S3-compatible) over a CDN
domain. This is wired in code and gated by env: when `R2_BUCKET` is unset, media falls
back to local disk (`MEDIA_DIR`) — fine for local dev/tests, NOT viable on Vercel.

Code touch-points:
- `src/lib/storage.ts` — the `s3Storage` plugin config (R2-specific: `region:'auto'`,
  `forcePathStyle:true`, `disablePayloadAccessControl`, `generateFileURL`).
- `src/payload.config.ts` — `plugins: [r2Storage]`.
- `src/lib/env.ts` / `.env.example` — the `R2_*` vars.
- `next.config.ts` — allow-lists `R2_PUBLIC_URL`'s host for `next/image`.

The reusable, generalized version of this is the `r2-media` skill at
`.claude/skills/r2-media/SKILL.md`.

## Provisioning runbook (GATED — operator performs)

1. **Create a bucket** (Cloudflare dashboard → R2 → Create bucket), e.g. `project51-media`.
2. **Create an R2 API token** (R2 → Manage R2 API Tokens → Create) with **Object Read &
   Write**, scoped to the bucket. Copy:
   - Access Key ID → `R2_ACCESS_KEY_ID`
   - Secret Access Key → `R2_SECRET_ACCESS_KEY`
3. **S3 API endpoint**: `https://<accountId>.r2.cloudflarestorage.com` → `R2_ENDPOINT`.
   (`<accountId>` is shown in the R2 overview / token page.)
4. **Public serving** — pick one:
   - **r2.dev subdomain** (quick): enable public access on the bucket → URL like
     `https://pub-xxxx.r2.dev`. Use that as `R2_PUBLIC_URL`.
   - **Custom domain** (production, recommended): connect e.g. `media.project51.ai` to the
     bucket (R2 → bucket → Settings → Custom Domains). Use `https://media.project51.ai`
     as `R2_PUBLIC_URL`. Cloudflare proxies + caches it (the SEO/perf win).
5. Set `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_PUBLIC_URL` in the Vercel project env (all environments that serve media).

## Verify after deploy

Upload an image in `/admin` (Media collection), then confirm its URL is
`${R2_PUBLIC_URL}/<filename>` (NOT the app origin, NOT `/api/media/...`). The generated
image sizes (`thumbnail`, `card`, `feature`) also resolve under the same CDN base.

## Notes

- `region` MUST be `auto`; `forcePathStyle` MUST be `true` — both already set in
  `src/lib/storage.ts`. Do not change them.
- `R2_ENDPOINT` is for **uploads only**; serving always goes through `R2_PUBLIC_URL`.
- ~4.5MB Vercel function upload cap applies to server-side uploads. For larger media,
  set `clientUploads: true` in `src/lib/storage.ts` (browser→R2 direct uploads).
- Existing local-disk media (if any) is NOT migrated automatically — re-upload or run a
  one-off copy into the bucket.
