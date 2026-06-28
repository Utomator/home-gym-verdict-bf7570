import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook } from 'payload'
import { env } from '@/lib/env'
import { pingIndexNow } from '@/lib/indexnow'

const PATH_BY_COLLECTION: Record<string, (slug: string) => string> = {
  'blog-posts': (s) => `/blog/${s}`,
  pages: (s) => `/${s}`,
  // Leadgen archetype: a ServiceAreas doc's slug is the composite "service/city"
  // and its page lives at /<slug>. Mounted only under leadgen; on the affiliate
  // build this key is simply never hit. Including it here means the per-doc cache
  // tag (`service-areas:<slug>`) used by /[slug]/[city] is invalidated on publish.
  'service-areas': (s) => `/${s}`,
}

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
  collection,
  operation,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc
  const builder = PATH_BY_COLLECTION[collection.slug]
  if (!builder || typeof doc.slug !== 'string') return doc

  const path = builder(doc.slug)
  // Next.js 16's revalidateTag takes a CacheLifeConfig profile as a second arg.
  // We always invalidate immediately, so set expire: 0. Guard it: revalidateTag
  // throws outside a Next request scope (seed scripts, migrations, CLI/local-API
  // writes), and a cache hint must never fail the underlying content write.
  try {
    revalidateTag(`${collection.slug}:${doc.slug}`, { expire: 0 })
    revalidateTag('sitemap', { expire: 0 })
  } catch {
    // no request scope to revalidate (e.g. a seed/script) — safe to ignore.
  }

  if (doc._status === 'published') {
    await pingIndexNow([`${env().NEXT_PUBLIC_SERVER_URL}${path}`])
  }
  return doc
}
