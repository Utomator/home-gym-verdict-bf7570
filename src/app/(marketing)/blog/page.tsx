import { collectionPageSchema, ogImages, seoMeta } from '@p51/engine'
import { Card, EmptyState } from '@/components/marketing/Card'
import { Container } from '@/components/marketing/Container'
import { JsonLd } from '@/components/marketing/JsonLd'
import { PageHeader } from '@/components/marketing/PageHeader'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

// On-demand render (no-DB build stays green); the post list below is served from
// the tag-invalidated data cache, refreshed on publish via revalidateTag.
export const dynamic = 'force-dynamic'

type MediaLike = { url?: string | null }
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

export async function generateMetadata() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  return seoMeta({
    canonical: '/blog',
    title: 'Blog',
    description: "What we've learned shipping agents, models, and AI infrastructure.",
    siteName,
    images: ogImages(base, undefined, asMedia(settings.defaultMeta?.image)?.url, siteName),
  })
}

export default async function BlogIndex() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const docs = await cachedRead(
    async () => {
      const res = await payload.find({
        collection: 'blog-posts',
        limit: 50,
        sort: '-publishedAt',
        where: { _status: { equals: 'published' } },
      })
      return res.docs
    },
    ['blog-index', 'blog-posts'],
    [collectionListTag('blog-posts'), 'sitemap'],
  )

  const collectionPage = collectionPageSchema(base, {
    name: 'Blog',
    url: `${base}/blog`,
    description: "What we've learned shipping agents, models, and AI infrastructure.",
    items: docs.map((post) => ({ name: post.title, url: `${base}/blog/${post.slug}` })),
  })

  return (
    <>
      <JsonLd data={[collectionPage]} />
      <PageHeader
        eyebrow="Blog"
        title="Field notes"
        lede="What we've learned shipping agents, models, and AI infrastructure."
      />
      <section className="bg-background pb-20 sm:pb-28">
        <Container>
          {docs.length === 0 ? (
            <EmptyState message="Posts will appear here once they're published in the admin." />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((post) => (
                <li key={post.id}>
                  <Card
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
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
