import { s3Storage } from '@payloadcms/storage-s3'
import { env } from '@/lib/env'

/**
 * Cloudflare R2 media storage (S3-compatible) via @payloadcms/storage-s3.
 *
 * Gated by R2_BUCKET: when it is unset the plugin is `enabled: false`, which is a
 * no-op — the `media` collection keeps writing to local disk via
 * `Media.upload.staticDir`. This keeps local dev and the test suite green with no
 * R2 credentials. When R2_BUCKET is set, the plugin automatically sets
 * `disableLocalStorage: true` for the `media` collection, so no FS writes happen.
 *
 * R2 specifics (verified against Payload v3 docs):
 *   - region MUST be 'auto' (standard AWS regions are rejected by R2).
 *   - forcePathStyle MUST be true (R2 uses path-style addressing).
 *   - `endpoint` is the S3 API endpoint, used for UPLOADS only.
 *   - Files are SERVED from `R2_PUBLIC_URL` (a *.r2.dev subdomain or a custom CDN
 *     domain), wired via `generateFileURL` + `disablePayloadAccessControl: true`
 *     so URLs point straight at the CDN (the SEO win: stable, cacheable URLs
 *     decoupled from the app origin).
 *
 * NOTE (Vercel): server-side uploads through a Vercel Function are limited to
 * ~4.5MB request bodies. For larger media, enable `clientUploads: true` (direct
 * browser->R2 uploads). Left off here because slice media is small; documented in
 * the R2 runbook.
 */
export const r2Storage = s3Storage({
  enabled: Boolean(env().R2_BUCKET),
  collections: {
    media: {
      disablePayloadAccessControl: true,
      generateFileURL: ({ filename, prefix }) => {
        const base = env().R2_PUBLIC_URL ?? ''
        const key = prefix ? `${prefix}/${filename}` : filename
        return `${base}/${key}`
      },
    },
  },
  // Non-null assertions are safe: when R2_BUCKET is unset `enabled` is false and
  // the plugin never reads these. When set, the operator supplies the full set
  // (documented in .env.example + the R2 runbook).
  bucket: env().R2_BUCKET ?? '',
  config: {
    region: 'auto',
    endpoint: env().R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env().R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: env().R2_SECRET_ACCESS_KEY ?? '',
    },
  },
})
