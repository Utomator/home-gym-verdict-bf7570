import { z } from 'zod'

const boolFromString = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))

// Optional URL that treats a present-but-empty value ("") as unset. Useful for
// env files (and Vercel) where a declared-but-blank var arrives as "" rather than
// undefined — so `R2_ENDPOINT=` doesn't fail .url() validation.
const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url().optional())

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DIRECT: z.string().url(),

  // Payload
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 chars'),

  // Public URL + indexability
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
  SITE_INDEXABLE: boolFromString.default(false),

  // Media storage: local filesystem fallback (used only when R2 is not configured).
  // Optional override path.
  MEDIA_DIR: z.string().default('media'),

  // Media storage: Cloudflare R2 (S3-compatible) via @payloadcms/storage-s3.
  // All optional: when R2_BUCKET is unset the storage plugin stays disabled and
  // media falls back to local disk (keeps local dev + tests green with no R2).
  R2_BUCKET: z.string().optional(),
  // R2 S3 API endpoint, e.g. https://<accountId>.r2.cloudflarestorage.com (uploads only).
  R2_ENDPOINT: optionalUrl,
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  // Public CDN base URL for serving media, e.g. https://pub-<hash>.r2.dev
  // (the *.r2.dev subdomain or a connected custom domain). Used by generateFileURL.
  R2_PUBLIC_URL: optionalUrl,

  // Website authoring MCP endpoint bearer token (gates /mcp/authoring).
  // Optional so non-publishing deployments / local dev don't require it; the
  // authoring route returns 401 when it is unset (fail-closed).
  SITE_AUTHORING_TOKEN: z.string().optional(),

  // Optional / prod-only
  CALENDLY_WEBHOOK_SECRET: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  INDEXNOW_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  CALENDLY_BOOKING_URL: z.string().url().optional(),

  // Misc
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),
  RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(input: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  return result.data
}

let cached: Env | undefined
export function env(): Env {
  if (!cached) cached = parseEnv()
  return cached
}
