import { buildSitemapXml, type SitemapEntry } from '@p51/engine'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { type ContentType, getSitemapContentTypes } from '@/lib/registry/content-registry'

// Render on-demand (no build-time prerender → no-DB build stays green), but the
// Payload reads below are served from the tag-invalidated data cache, so this
// route no longer hits the DB on every crawl. The publish hook's
// revalidateTag('sitemap') refreshes it instantly. See src/lib/cache.ts.
export const dynamic = 'force-dynamic'

// App-shell paths that exist regardless of which content collections are mounted
// (site root + the contact page). Per-type hub paths like /blog and /authors are
// declared on their content type's `sitemap.staticPaths` in the registry.
const STATIC_PATHS = ['/', '/blog', '/contact']

/** A published doc as returned by payload.find with the fields the sitemap reads. */
type SitemapDoc = {
  slug?: string | null
  updatedAt?: string | null
}

/** One value of a taxonomy array field, e.g. `{ value: 'guides' }`. */
type TaxonomyItem = { value?: string | null }

const fmt = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : undefined)

// Read a taxonomy array field off a doc by name without assuming the doc's
// concrete collection type (the registry processes types generically).
const taxonomyItems = (doc: SitemapDoc, field: string): readonly TaxonomyItem[] => {
  const raw = (doc as Record<string, unknown>)[field]
  return Array.isArray(raw) ? (raw as TaxonomyItem[]) : []
}

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()

  // Only content types whose collection is mounted AND that opt into the
  // sitemap, in registry declaration order (blog-posts, pages, people today).
  const types = getSitemapContentTypes(payload)

  // Fetch every active type's published docs in parallel, preserving order. Each
  // read is cached and tagged with the collection's list tag + 'sitemap' so the
  // publish hook (revalidateTag('sitemap')) invalidates the whole sitemap on any
  // content change.
  const docsByType = await Promise.all(
    types.map(async (t) => {
      const docs = await cachedRead(
        async () => {
          const res = await payload.find({
            collection: t.collection,
            where: { _status: { equals: 'published' } },
            limit: 1000,
            depth: 0,
          })
          return res.docs as SitemapDoc[]
        },
        ['sitemap', 'docs', t.collection],
        [collectionListTag(t.collection), 'sitemap'],
      )
      return { type: t, docs }
    }),
  )

  // When the site is not indexable we serve noindex everywhere; advertising URLs
  // here would send mixed crawler signals, so return an empty urlset instead.
  let entries: SitemapEntry[] = []

  if (e.SITE_INDEXABLE) {
    // Track emitted hub paths so a type's registry staticPaths never duplicate an
    // app-shell path (e.g. blog-posts declares /blog, already in STATIC_PATHS).
    const seenStaticPaths = new Set<string>(STATIC_PATHS)
    const docEntries: SitemapEntry[] = []
    const taxonomyEntries: SitemapEntry[] = []

    for (const { type, docs } of docsByType) {
      // Per-type hub/index paths (e.g. /authors) emitted before the type's docs.
      for (const path of type.sitemap.staticPaths ?? []) {
        if (seenStaticPaths.has(path)) continue
        seenStaticPaths.add(path)
        docEntries.push(applyPolicy(type, { path }))
      }

      for (const doc of docs) {
        docEntries.push(applyPolicy(type, { path: type.pathFor(doc), lastmod: fmt(doc.updatedAt) }))
      }

      // Taxonomy hub URLs (/blog/category|tag/<value>) derived from this type's
      // docs, collected and appended after all per-doc URLs to match prior output.
      if (type.sitemap.includeTaxonomyHubs && type.taxonomy) {
        for (const taxField of type.taxonomy.fields) {
          const values = new Set<string>()
          for (const doc of docs) {
            for (const item of taxonomyItems(doc, taxField.field)) {
              if (item.value) values.add(item.value)
            }
          }
          for (const value of values) {
            taxonomyEntries.push(applyPolicy(type, { path: taxField.pathFor(value) }))
          }
        }
      }
    }

    entries = [...STATIC_PATHS.map((p) => ({ path: p })), ...docEntries, ...taxonomyEntries]
  }

  return new Response(buildSitemapXml(e.NEXT_PUBLIC_SERVER_URL, entries), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

// Layer a content type's optional changefreq/priority onto an entry. Both are
// unset for every current type, so output is byte-identical for the affiliate
// app, while staying declarable per archetype without route edits.
function applyPolicy(type: ContentType, entry: SitemapEntry): SitemapEntry {
  const { changefreq, priority } = type.sitemap
  if (changefreq === undefined && priority === undefined) return entry
  return {
    ...entry,
    ...(changefreq !== undefined ? { changefreq } : {}),
    ...(priority !== undefined ? { priority } : {}),
  }
}
