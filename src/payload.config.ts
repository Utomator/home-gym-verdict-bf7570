import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { LinkFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'
import { buildConfig } from 'payload'
import { BlogPosts } from '@/collections/BlogPosts'
import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { People } from '@/collections/People'
import { Products } from '@/collections/Products'
import { ServiceAreas } from '@/collections/ServiceAreas'
import { Submissions } from '@/collections/Submissions'
import { Users } from '@/collections/Users'
import { WebhookEvents } from '@/collections/WebhookEvents'
import { Navigation } from '@/globals/Navigation'
import { SiteSettings } from '@/globals/SiteSettings'
import { env } from '@/lib/env'
import { r2Storage } from '@/lib/storage'
import siteConfig from '@/site.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// CONDITIONAL MOUNT — archetype-specific collections are mounted ONLY when the
// Site Brief declares the matching `archetype`. The lead-gen archetype mounts
// ServiceAreas; the affiliate archetype mounts Products (first-class, reusable
// product entities referenced by blog posts). The default brief leaves both OUT,
// so the baseline schema is unchanged and needs no new migration. When present,
// the content-registry's reserved entry (`service-areas` / `products`) lights up
// automatically (sitemap.xml / llms.txt) because the registry keys off which
// collections are actually mounted here. The 3 live sites are unaffected until
// they re-provision.
const archetypeCollections: CollectionConfig[] =
  siteConfig.archetype === 'leadgen'
    ? [ServiceAreas]
    : siteConfig.archetype === 'affiliate'
      ? [Products]
      : []

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
  },
  collections: [
    Users,
    Media,
    People,
    BlogPosts,
    Categories,
    Pages,
    Submissions,
    WebhookEvents,
    ...archetypeCollections,
  ],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor({
    // Replace the default link feature with one that lets authors declare SEO
    // attribution per-link (rel). Stored inside the lexical JSON — no DB migration.
    // The RichText renderer reads fields.linkRel; unflagged outbound links stay
    // FOLLOWED (editorial), only 'sponsored' adds rel="sponsored nofollow".
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((f) => f.key !== 'link'),
      LinkFeature({
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'linkRel',
            type: 'select',
            label: 'SEO attribution (rel)',
            admin: {
              description:
                'How search engines should treat this link. Follow = genuine editorial citation (default). Sponsored = paid/affiliate. UGC = user-generated. Nofollow = no endorsement.',
            },
            options: [
              { label: 'Follow (editorial citation)', value: 'follow' },
              { label: 'Sponsored (paid / affiliate)', value: 'sponsored' },
              { label: 'UGC (user-generated)', value: 'ugc' },
              { label: 'Nofollow (no endorsement)', value: 'nofollow' },
            ],
          },
        ],
      }),
    ],
  }),
  secret: env().PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    // DATABASE_URL must be the Neon POOLED (`-pooler`) host on Vercel; each
    // serverless instance keeps its own small pg pool, and Neon's PgBouncer
    // multiplexes across instances. Keep `max` low so many warm instances don't
    // exhaust Neon's connection limit. Migrations use DATABASE_URL_DIRECT instead.
    pool: {
      connectionString: env().DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
    },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  // Media storage: Cloudflare R2 (S3-compatible) when R2_BUCKET is set; otherwise
  // a no-op and media falls back to local disk via Media.upload.staticDir.
  plugins: [r2Storage],
  sharp: undefined, // optional image transforms; defer enabling until needed
})
