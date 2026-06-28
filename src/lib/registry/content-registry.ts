import type { CollectionSlug, Payload } from 'payload'

/**
 * CONTENT REGISTRY
 * ----------------
 * One typed, declarative source of truth for every content type the SEO /
 * "machine" surfaces emit (sitemap.xml, feed.xml, llms.txt, llms-full.txt, md,
 * robots.txt). Each route today hardcodes an enumeration of collections
 * (`blog-posts`, `pages`, `people`) plus the taxonomy / author hub paths. This
 * registry captures that knowledge ONCE so the same base can power any
 * archetype (affiliate / lead-gen / landing) by simply mounting different
 * collections — an entry whose `collection` is not mounted in this app's
 * `payload.config` is automatically absent from `getActiveContentTypes`, with
 * no per-app flags or branching.
 *
 * This module is intentionally pure and side-effect free: it declares behavior
 * and exposes the active subset. It does NOT query Payload, build XML, or
 * fetch documents — the routes keep doing that, reading their per-type policy
 * from here instead of from inline literals. Wiring the routes to it is a
 * separate, later step; the contract below is shaped to fit them exactly.
 */

/**
 * Stable identity for a content type. Distinct from the Payload collection
 * `slug` so future entries can be virtual / derived (e.g. a taxonomy hub that
 * has no collection of its own) without colliding with a real collection.
 */
export type ContentTypeKey =
  | 'blog-posts'
  | 'pages'
  | 'people'
  // Reserved for future archetypes — declare an entry and it lights up the
  // moment its collection is mounted. Listed here so the union stays the single
  // place new types are introduced.
  | 'reviews'
  | 'comparisons'
  | 'service-areas'
  | 'products'
  | 'listings'

/** A minimal published document shape every entry's path builder can rely on. */
export type ContentDocLike = {
  slug?: string | null
}

/** Per-surface inclusion + tuning for the sitemap.xml route. */
export type SitemapPolicy = {
  /** Whether this type's documents appear in sitemap.xml at all. */
  include: boolean
  /**
   * Optional `<changefreq>` hint. Omitted today by every current type (output
   * parity), but declarable per type/archetype without touching the route.
   */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  /** Optional `<priority>` (0.0–1.0). Omitted today by every current type. */
  priority?: number
  /**
   * Static "hub" / index paths that exist because this type is present, e.g.
   * `/authors` for people or `/blog` for posts. Emitted alongside the per-doc
   * URLs. Kept here so mounting a type also contributes its index page.
   */
  staticPaths?: readonly string[]
  /**
   * Whether this type contributes the taxonomy hub URLs
   * (`/blog/category/<v>`, `/blog/tag/<v>`) derived from its docs' array
   * fields. Only blog-posts does today. See `taxonomy` below for the field
   * names + path builders.
   */
  includeTaxonomyHubs?: boolean
}

/** Per-surface inclusion for the RSS feed.xml route. */
export type FeedPolicy = {
  /** Whether this type's documents appear as <item>s in feed.xml. */
  include: boolean
}

/** Per-surface inclusion + section heading for the llms.txt index route. */
export type LlmsPolicy = {
  /** Whether this type appears in the llms.txt link index. */
  include: boolean
  /**
   * Section heading under which this type's links are grouped, e.g. "Authors",
   * "Recent posts", "Pages". Drives the `## <title>` line in llms.txt.
   */
  sectionTitle: string
  /**
   * Relative order of this type's section within llms.txt (ascending). Lets a
   * landing app drop blog-posts and still render Pages first without reshuffle.
   */
  sectionOrder: number
}

/** Per-surface inclusion for the llms-full.txt + /md full-content mirror. */
export type MdMirrorPolicy = {
  /**
   * Whether this type's documents are serialized to Markdown in the full
   * mirror (llms-full.txt). `people` are included but rendered from a bespoke
   * bio template rather than `fetchAndSerialize` — see `mdMirror.via`.
   */
  include: boolean
  /**
   * How the full Markdown body is produced for this type:
   *  - 'serialize'  → `fetchAndSerialize(collection, slug)` (lexical/blocks body)
   *  - 'profile'    → bespoke author/profile template (name/role/bio)
   * The route switches on this instead of hardcoding `people` as a special case.
   */
  via: 'serialize' | 'profile'
}

/**
 * Notes for taxonomy- and author-aware behavior. Declarative metadata the
 * routes read; not executable. Captures the array-field names and the hub path
 * builders so taxonomy handling is no longer inlined in two routes.
 */
export type TaxonomyHandling = {
  /** Array fields on the doc whose `{ value }` items become hub pages. */
  fields: readonly {
    /** Doc field name, e.g. 'categories' | 'tags'. */
    field: string
    /** Human label for the llms.txt section, e.g. 'Topics' | 'Tags'. */
    sectionTitle: string
    /** Builds the hub path for a single taxonomy value (already URL-safe input). */
    pathFor: (value: string) => string
  }[]
}

/** Marks an entry as the author/profile type (used for `/authors/<slug>`). */
export type AuthorHandling = {
  /** Field on the doc used as the display name (People uses `name`, not `title`). */
  titleField: string
}

/**
 * A single content type's full declaration. `pathFor` is the canonical detail
 * URL builder for a document of this type; every surface uses it so there is
 * exactly one place the URL shape lives.
 */
export type ContentType = {
  /** Stable identity. */
  key: ContentTypeKey
  /** Payload collection slug. Used to detect mounting + to query/serialize. */
  collection: CollectionSlug
  /** Human label (admin / docs / debugging). */
  label: string
  /** Canonical detail path for a document, e.g. `/blog/<slug>` or `/<slug>`. */
  pathFor: (doc: ContentDocLike) => string
  sitemap: SitemapPolicy
  feed: FeedPolicy
  llms: LlmsPolicy
  mdMirror: MdMirrorPolicy
  /** Present only on types that contribute taxonomy hub URLs (blog-posts). */
  taxonomy?: TaxonomyHandling
  /** Present only on the author/profile type (people). */
  author?: AuthorHandling
}

const slugOf = (doc: ContentDocLike): string => doc.slug ?? ''

/**
 * THE REGISTRY. Declaration order is the canonical processing order. Add a new
 * archetype's type by appending an entry — no route edits, no flags. Values
 * here are tuned so the affiliate app's current output is byte-identical once
 * the routes consume the registry.
 */
export const CONTENT_TYPES: readonly ContentType[] = [
  {
    key: 'blog-posts',
    collection: 'blog-posts',
    label: 'Blog posts',
    pathFor: (d) => `/blog/${slugOf(d)}`,
    sitemap: {
      include: true,
      staticPaths: ['/blog'],
      includeTaxonomyHubs: true,
    },
    feed: { include: true },
    llms: { include: true, sectionTitle: 'Recent posts', sectionOrder: 40 },
    mdMirror: { include: true, via: 'serialize' },
    taxonomy: {
      fields: [
        {
          field: 'categories',
          sectionTitle: 'Topics',
          pathFor: (v) => `/blog/category/${encodeURIComponent(v)}`,
        },
        {
          field: 'tags',
          sectionTitle: 'Tags',
          pathFor: (v) => `/blog/tag/${encodeURIComponent(v)}`,
        },
      ],
    },
  },
  {
    key: 'pages',
    collection: 'pages',
    label: 'Pages',
    pathFor: (d) => `/${slugOf(d)}`,
    sitemap: { include: true },
    feed: { include: false },
    llms: { include: true, sectionTitle: 'Pages', sectionOrder: 10 },
    mdMirror: { include: true, via: 'serialize' },
  },
  {
    key: 'people',
    collection: 'people',
    label: 'Authors',
    pathFor: (d) => `/authors/${slugOf(d)}`,
    sitemap: { include: true, staticPaths: ['/authors'] },
    feed: { include: false },
    llms: { include: true, sectionTitle: 'Authors', sectionOrder: 30 },
    mdMirror: { include: true, via: 'profile' },
    author: { titleField: 'name' },
  },
  {
    // LEAD-GEN archetype — programmatic "service in a city" pages at
    // /[service]/[city]. The collection's `slug` is already the
    // "<service>/<city>" path, so `pathFor` simply prefixes a leading slash.
    // Absent from the affiliate app (collection not mounted) → automatically
    // excluded from every surface; lights up the moment leadgen mounts it.
    key: 'service-areas',
    // Cast: 'service-areas' is only present in CollectionSlug under the leadgen
    // archetype (the affiliate-generated types omit it). The registry declares
    // entries for not-yet-mounted collections by design — `getActiveContentTypes`
    // filters by runtime mount, so this stays inert until leadgen mounts it.
    collection: 'service-areas' as CollectionSlug,
    label: 'Service areas',
    pathFor: (d) => `/${slugOf(d)}`,
    sitemap: { include: true },
    feed: { include: false },
    llms: { include: true, sectionTitle: 'Service areas', sectionOrder: 20 },
    mdMirror: { include: true, via: 'serialize' },
  },
  {
    // AFFILIATE archetype — reusable product entities at /products/<slug>. Absent
    // from leadgen/landing (collection not mounted) → excluded from every surface;
    // lights up the moment the affiliate archetype mounts Products. The `products`
    // slug is only present in CollectionSlug under the affiliate archetype, so the
    // cast mirrors the not-yet-mounted `service-areas` entry above.
    key: 'products',
    collection: 'products' as CollectionSlug,
    label: 'Products',
    pathFor: (d) => `/products/${slugOf(d)}`,
    sitemap: { include: true, staticPaths: ['/products'] },
    feed: { include: false },
    llms: { include: true, sectionTitle: 'Products', sectionOrder: 15 },
    mdMirror: { include: true, via: 'serialize' },
  },
]

/** Index for O(1) lookups by stable key. */
const BY_KEY: ReadonlyMap<ContentTypeKey, ContentType> = new Map(
  CONTENT_TYPES.map((t) => [t.key, t]),
)

/** Look up a declared content type by its stable key (mounted or not). */
export function getContentType(key: ContentTypeKey): ContentType | undefined {
  return BY_KEY.get(key)
}

/**
 * Detect whether a collection slug is actually mounted in this Payload app.
 * `payload.collections` is keyed by collection slug, so membership there is the
 * source of truth for "this archetype mounts this collection".
 */
export function isCollectionMounted(payload: Payload, slug: CollectionSlug): boolean {
  return Object.hasOwn(payload.collections, slug)
}

/**
 * The active subset: only content types whose `collection` is mounted in this
 * app's payload.config. A landing app that mounts only `Pages` yields just the
 * pages entry; an affiliate app that mounts blog-posts/pages/people yields all
 * three in declaration order. No flags — absence == not mounted.
 */
export function getActiveContentTypes(payload: Payload): readonly ContentType[] {
  return CONTENT_TYPES.filter((t) => isCollectionMounted(payload, t.collection))
}

/** Active types that opt into sitemap.xml, in declaration order. */
export function getSitemapContentTypes(payload: Payload): readonly ContentType[] {
  return getActiveContentTypes(payload).filter((t) => t.sitemap.include)
}

/** Active types that opt into feed.xml, in declaration order. */
export function getFeedContentTypes(payload: Payload): readonly ContentType[] {
  return getActiveContentTypes(payload).filter((t) => t.feed.include)
}

/** Active types that opt into llms.txt, sorted by their declared sectionOrder. */
export function getLlmsContentTypes(payload: Payload): readonly ContentType[] {
  return getActiveContentTypes(payload)
    .filter((t) => t.llms.include)
    .sort((a, b) => a.llms.sectionOrder - b.llms.sectionOrder)
}

/** Active types that opt into the llms-full.txt / md mirror, in declaration order. */
export function getMdMirrorContentTypes(payload: Payload): readonly ContentType[] {
  return getActiveContentTypes(payload).filter((t) => t.mdMirror.include)
}
