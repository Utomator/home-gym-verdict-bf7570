import {
  absUrl,
  breadcrumbList,
  collectionPageSchema,
  lexicalToPlainText,
  ogImages,
  personSchema,
  profilePageSchema,
  seoMeta,
} from '@p51/engine'
import { notFound } from 'next/navigation'
import { AuthorMeta } from '@/components/marketing/AuthorMeta'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { Card, EmptyState } from '@/components/marketing/Card'
import { Container } from '@/components/marketing/Container'
import { JsonLd } from '@/components/marketing/JsonLd'
import { PageHeader } from '@/components/marketing/PageHeader'
import { RichText } from '@/components/marketing/RichText'
import { cachedRead, collectionListTag, docTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

type MediaLike = { url?: string | null }
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

// On-demand dynamic route; cached read tagged `people:<slug>` so editing this
// person invalidates exactly their page.
async function getAuthor(slug: string) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'people',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      })
      return docs[0] ?? null
    },
    ['author', slug],
    [docTag('people', slug)],
  )
}

async function getAuthorPosts(slug: string, authorId: string | number) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'blog-posts',
        limit: 50,
        sort: '-publishedAt',
        where: {
          _status: { equals: 'published' },
          author: { equals: authorId },
        },
      })
      return docs
    },
    ['author-posts', slug, String(authorId)],
    [docTag('people', slug), collectionListTag('blog-posts'), 'sitemap'],
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) return {}
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const description = author.bio ? lexicalToPlainText(author.bio) || undefined : undefined
  const photoUrl = asMedia(author.photo)?.url
  return seoMeta({
    canonical: `/authors/${slug}`,
    title: author.name,
    description,
    siteName,
    type: 'website',
    images: ogImages(base, photoUrl, asMedia(settings.defaultMeta?.image)?.url, author.name),
  })
}

export default async function AuthorProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) notFound()

  const base = env().NEXT_PUBLIC_SERVER_URL
  const posts = await getAuthorPosts(slug, author.id)

  const bioText = author.bio ? lexicalToPlainText(author.bio) || undefined : undefined
  const sameAs = (author.socials ?? []).map((s) => s.url).filter((u): u is string => Boolean(u))
  const imageUrl = absUrl(base, asMedia(author.photo)?.url)
  const knowsAbout = (author.expertise ?? [])
    .map((e) => e.value)
    .filter((v): v is string => Boolean(v))
  const credentials = (author.credentials ?? [])
    .map((c) => c.value)
    .filter((v): v is string => Boolean(v))

  const person = personSchema(base, {
    name: author.name,
    slug,
    bio: bioText,
    sameAs: sameAs.length ? sameAs : undefined,
    imageUrl,
    jobTitle: author.role ?? undefined,
    knowsAbout: knowsAbout.length ? knowsAbout : undefined,
    credentials: credentials.length ? credentials : undefined,
  })

  const ld: object[] = [
    profilePageSchema(person),
    breadcrumbList([
      { name: 'Home', url: base },
      { name: 'Authors', url: `${base}/authors/${slug}` },
      { name: author.name, url: `${base}/authors/${slug}` },
    ]),
  ]

  if (posts.length) {
    ld.push(
      collectionPageSchema(base, {
        name: `Posts by ${author.name}`,
        url: `${base}/authors/${slug}`,
        items: posts.map((post) => ({ name: post.title, url: `${base}/blog/${post.slug}` })),
      }),
    )
  }

  return (
    <>
      <JsonLd data={ld} />
      <Container size="narrow">
        <div className="pt-8 sm:pt-10">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: author.name, href: `/authors/${slug}` },
            ]}
          />
        </div>
      </Container>
      <PageHeader eyebrow={author.role ?? 'Author'} title={author.name} lede={bioText} />
      <section className="bg-background pb-20 sm:pb-28">
        <Container size="narrow">
          {author.bio ? (
            <article className="max-w-prose text-pretty leading-relaxed text-muted-foreground">
              <RichText data={author.bio} />
            </article>
          ) : null}
          {/* Visible E-E-A-T trust block backing the Person schema's
              knowsAbout / hasCredential / sameAs with on-page content. */}
          <AuthorMeta
            expertise={author.expertise}
            credentials={author.credentials}
            socials={author.socials}
          />
          <h2 className="mt-12 mb-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Posts by {author.name}
          </h2>
          {posts.length === 0 ? (
            <EmptyState message="No published posts yet." />
          ) : (
            <ul className="grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2">
              {posts.map((post) => (
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
