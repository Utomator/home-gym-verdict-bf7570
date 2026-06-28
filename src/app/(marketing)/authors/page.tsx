import { collectionPageSchema, seoMeta } from '@p51/engine'
import { Card, EmptyState } from '@/components/marketing/Card'
import { Container } from '@/components/marketing/Container'
import { JsonLd } from '@/components/marketing/JsonLd'
import { PageHeader } from '@/components/marketing/PageHeader'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

// On-demand render (no-DB build stays green); the authors list + per-author post
// counts are served from the tag-invalidated data cache. Tagged with both the
// people and blog-posts list tags + 'sitemap', so publishing a person OR a post
// (which changes the counts) refreshes the page.
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  return seoMeta({
    canonical: '/authors',
    title: 'Authors',
    description: 'The people behind our writing and research.',
    siteName,
  })
}

export default async function AuthorsIndex() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()

  const { docs, counts } = await cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'people',
        limit: 100,
        sort: 'name',
        where: { _status: { equals: 'published' } },
      })

      // Published post counts per author, in parallel.
      const counts = await Promise.all(
        docs.map((author) =>
          payload
            .count({
              collection: 'blog-posts',
              where: {
                _status: { equals: 'published' },
                author: { equals: author.id },
              },
            })
            .then((r) => r.totalDocs),
        ),
      )
      return { docs, counts }
    },
    ['authors-index'],
    [collectionListTag('people'), collectionListTag('blog-posts'), 'sitemap'],
  )

  const ld = collectionPageSchema(base, {
    name: 'Authors',
    url: `${base}/authors`,
    description: 'The people behind our writing and research.',
    items: docs.map((author) => ({
      name: author.name,
      url: `${base}/authors/${author.slug}`,
    })),
  })

  return (
    <>
      <JsonLd data={ld} />
      <PageHeader
        eyebrow="Authors"
        title="The people behind the work"
        lede="The people behind our writing and research."
      />
      <section className="bg-background pb-20 sm:pb-28">
        <Container size="wide">
          {docs.length === 0 ? (
            <EmptyState message="Authors will appear here once people are published in the admin." />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((author, i) => (
                <li key={author.id}>
                  <Card
                    href={`/authors/${author.slug}`}
                    eyebrow={author.role ?? undefined}
                    title={author.name}
                    meta={counts[i] === 1 ? '1 post' : `${counts[i]} posts`}
                  />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
