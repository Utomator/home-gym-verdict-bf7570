import { buildRssXml, lexicalToHtml } from '@p51/engine'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { getFeedContentTypes } from '@/lib/registry/content-registry'

// On-demand render (keeps the no-DB build green) with the Payload read served
// from the tag-invalidated data cache. revalidateTag('sitemap') on publish
// refreshes the feed instantly. See src/lib/cache.ts.
export const dynamic = 'force-dynamic'

/** A published doc as returned by payload.find with the fields the feed reads. */
type FeedDoc = {
  title: string
  slug?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  // Lexical body field → serialized into <content:encoded> (full-article syndication).
  body?: unknown
  // Populated author relationship (depth ≥ 1) → <dc:creator>.
  author?: unknown
}

const authorNameOf = (v: unknown): string | undefined =>
  typeof v === 'object' && v !== null && 'name' in v
    ? ((v as { name?: string | null }).name ?? undefined)
    : undefined

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'

  // The feed is the chronological post stream: drive it from whichever mounted
  // content type opts into feed.xml (only blog-posts today). The first such type
  // is the feed's subject; absence of any → an empty (but valid) feed.
  const feedType = getFeedContentTypes(payload)[0]

  // depth: 1 so the `author` relationship is populated (→ <dc:creator>) and the
  // lexical `body` is available to serialize into <content:encoded>. Cached +
  // tagged with the feed collection's list tag and 'sitemap' so any publish
  // refreshes the feed.
  const docs: FeedDoc[] = feedType
    ? await cachedRead(
        async () => {
          const res = await payload.find({
            collection: feedType.collection,
            where: { _status: { equals: 'published' } },
            sort: '-publishedAt',
            limit: 50,
            depth: 1,
          })
          return res.docs as FeedDoc[]
        },
        ['feed', 'docs', feedType.collection],
        [collectionListTag(feedType.collection), 'sitemap'],
      )
    : []

  const xml = buildRssXml({
    title: `${orgName} Blog`,
    link: `${e.NEXT_PUBLIC_SERVER_URL}/blog`,
    description: `${orgName} blog`,
    selfLink: `${e.NEXT_PUBLIC_SERVER_URL}/feed.xml`,
    language: 'en',
    // Aggregators may cache for an hour before refetching (the publish hook also
    // revalidates this route's tag, so subscribers still see fresh posts promptly).
    ttlMinutes: 60,
    items: docs.map((d) => {
      const path = feedType ? feedType.pathFor(d) : `/blog/${d.slug}`
      const contentHtml = lexicalToHtml(d.body) || undefined
      return {
        title: d.title,
        link: `${e.NEXT_PUBLIC_SERVER_URL}${path}`,
        guid: `${e.NEXT_PUBLIC_SERVER_URL}${path}`,
        pubDate: new Date(d.publishedAt ?? d.updatedAt ?? Date.now()),
        description: d.excerpt ?? undefined,
        author: authorNameOf(d.author),
        contentHtml,
      }
    }),
  })
  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  })
}
