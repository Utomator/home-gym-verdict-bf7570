import { collectionPageSchema, ogImages, seoMeta } from '@p51/engine'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { Card, EmptyState } from '@/components/marketing/Card'
import { Container } from '@/components/marketing/Container'
import { JsonLd } from '@/components/marketing/JsonLd'
import { PageHeader } from '@/components/marketing/PageHeader'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

// Dynamic [value] route: on-demand (no generateStaticParams → no build-time DB
// read) with the per-category read cached + tagged so any blog publish refreshes it.
export const dynamic = 'force-dynamic'

type MediaLike = { url?: string | null }
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

// Next.js hands the dynamic [value] segment URL-ENCODED (e.g. "Home%20Energy").
// Decode it for the Payload query + visible display; re-encode for emitted URLs.
const decodeParam = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

async function getPostsByCategory(value: string) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'blog-posts',
        limit: 50,
        sort: '-publishedAt',
        where: {
          _status: { equals: 'published' },
          'categories.value': { equals: value },
        },
      })
      return docs
    },
    ['category-archive', value],
    [collectionListTag('blog-posts'), 'sitemap'],
  )
}

export async function generateMetadata({ params }: { params: Promise<{ value: string }> }) {
  const { value: rawValue } = await params
  const value = decodeParam(rawValue)
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  return seoMeta({
    canonical: `/blog/category/${encodeURIComponent(value)}`,
    title: `${value} — Blog`,
    description: `Posts in the ${value} category.`,
    siteName,
    images: ogImages(base, undefined, asMedia(settings.defaultMeta?.image)?.url, siteName),
  })
}

export default async function CategoryArchive({ params }: { params: Promise<{ value: string }> }) {
  const { value: rawValue } = await params
  const value = decodeParam(rawValue)
  const base = env().NEXT_PUBLIC_SERVER_URL
  const docs = await getPostsByCategory(value)

  const collectionPage = collectionPageSchema(base, {
    name: `${value} — Blog`,
    url: `${base}/blog/category/${encodeURIComponent(value)}`,
    description: `Posts in the ${value} category.`,
    items: docs.map((post) => ({ name: post.title, url: `${base}/blog/${post.slug}` })),
  })

  return (
    <>
      <JsonLd data={[collectionPage]} />
      <Container>
        <div className="pt-8 sm:pt-10">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Blog', href: '/blog' },
              { name: value, href: `/blog/category/${encodeURIComponent(value)}` },
            ]}
          />
        </div>
      </Container>
      <PageHeader eyebrow="Category" title={value} lede={`Posts in the ${value} category.`} />
      <section className="bg-background pb-20 sm:pb-28">
        <Container>
          {docs.length === 0 ? (
            <EmptyState message="No posts in this category yet." />
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
