import { seoMeta } from '@p51/engine'
import type { Metadata } from 'next'
import { Card, EmptyState } from '@/components/marketing/Card'
import { Container } from '@/components/marketing/Container'
import { PageHeader } from '@/components/marketing/PageHeader'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { getPayloadClient } from '@/lib/payload'

// Dynamic by nature (reads the ?q= param). The per-query read is cached so
// repeated searches don't re-hit the DB; the blog-posts list tag refreshes
// results when posts change.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  return {
    ...seoMeta({
      canonical: '/search',
      title: 'Search',
      description: 'Search the blog.',
      siteName,
    }),
    // Search result pages add no unique indexable value and risk crawl-budget waste.
    robots: { index: false },
  }
}

async function search(q: string) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'blog-posts',
        limit: 50,
        sort: '-publishedAt',
        where: {
          _status: { equals: 'published' },
          or: [{ title: { like: q } }, { excerpt: { like: q } }],
        },
      })
      return docs
    },
    ['search', q],
    [collectionListTag('blog-posts'), 'sitemap'],
  )
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()
  const docs = query ? await search(query) : []

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for “${query}”` : 'Search'}
        lede={query ? undefined : 'Enter a search term to find blog posts.'}
      />
      <section>
        <Container size="wide">
          <form action="/search" method="get">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" type="search" defaultValue={query} placeholder="Search posts…" />
          </form>
          {!query ? null : docs.length === 0 ? (
            <EmptyState message={`No posts found for “${query}”.`} />
          ) : (
            <div>
              {docs.map((post) => (
                <Card
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  body={post.excerpt ?? undefined}
                  meta={
                    post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
