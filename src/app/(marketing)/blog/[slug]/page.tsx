import {
  absUrl,
  articleSchema,
  bodyHasSponsoredLink,
  breadcrumbList,
  extractHeadings,
  faqPageSchema,
  lexicalToPlainText,
  ogImages,
  productRoundupSchema,
  type RoundupItem as SchemaRoundupItem,
  seoMeta,
} from '@p51/engine'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnswerCapsule } from '@/components/marketing/AnswerCapsule'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { CodeGenHero } from '@/components/marketing/CodeGenHero'
import { Container } from '@/components/marketing/Container'
import { AffiliateDisclosure } from '@/components/marketing/Disclosure'
import { EmailCapture } from '@/components/marketing/EmailCapture'
import { ExitIntentModal } from '@/components/marketing/ExitIntentModal'
import { InlineCta } from '@/components/marketing/InlineCta'
import { JsonLd } from '@/components/marketing/JsonLd'
import { KeyTakeaways } from '@/components/marketing/KeyTakeaways'
import { ReadingProgress } from '@/components/marketing/ReadingProgress'
import { type ProductDoc, RecommendedProducts } from '@/components/marketing/RecommendedProducts'
import { RelatedPosts } from '@/components/marketing/RelatedPosts'
import { RichText } from '@/components/marketing/RichText'
import { ShareButtons } from '@/components/marketing/ShareButtons'
import { StickyCta } from '@/components/marketing/StickyCta'
import { TableOfContents } from '@/components/marketing/TableOfContents'
import { cachedRead, collectionListTag, docTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import siteConfig from '@/site.config'

type MediaLike = {
  url?: string | null
  width?: number | null
  height?: number | null
  alt?: string | null
}
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined
const authorNameOf = (v: unknown): string | undefined =>
  typeof v === 'object' && v !== null && 'name' in v ? (v as { name?: string }).name : undefined
const authorSlugOf = (v: unknown): string | undefined =>
  typeof v === 'object' && v !== null && 'slug' in v
    ? ((v as { slug?: string | null }).slug ?? undefined)
    : undefined

// Cache the per-post read, tagged `blog-posts:<slug>` so the publish hook's
// revalidateTag(`${collection}:${slug}`) invalidates exactly this post on update.
// No generateStaticParams → the route is on-demand (no build-time DB read); the
// first request renders, then subsequent ones serve from the cache until publish.
async function getPost(slug: string, depth: number) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        limit: 1,
        depth,
      })
      return docs[0] ?? null
    },
    ['blog-post', String(depth), slug],
    [docTag('blog-posts', slug)],
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug, 1)
  if (!post) return {}
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const description = post.aeo?.answerSummary ?? post.excerpt ?? undefined
  const hero = asMedia(post.heroImage)
  const defaultImg = asMedia(settings.defaultMeta?.image)
  const authorName = authorNameOf(post.author)
  const tags = (post.tags ?? []).map((t) => t.value).filter((v): v is string => Boolean(v))
  return seoMeta({
    canonical: `/blog/${slug}`,
    title: post.title,
    description,
    siteName,
    images: ogImages(base, hero?.url, defaultImg?.url, hero?.alt ?? post.title),
    type: 'article',
    article: {
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.aeo?.lastReviewedAt ?? post.updatedAt ?? undefined,
      authors: authorName ? [authorName] : undefined,
      section: post.categories?.[0]?.value ?? undefined,
      tags,
    },
  })
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug, 2)
  if (!post) notFound()

  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const orgLogo = asMedia(settings.organization?.logo)?.url

  const authorName = authorNameOf(post.author)
  const authorSlug = authorSlugOf(post.author)
  const hero = asMedia(post.heroImage)
  const wordCount = lexicalToPlainText(post.body).split(/\s+/).filter(Boolean).length
  const section = post.categories?.[0]?.value ?? undefined
  const keywords =
    (post.tags ?? [])
      .map((t) => t.value)
      .filter(Boolean)
      .join(', ') || undefined

  const ld: object[] = [
    articleSchema(base, {
      title: post.title,
      slug: post.slug,
      type: 'BlogPosting',
      publishedAt: post.publishedAt,
      updatedAt: post.aeo?.lastReviewedAt ?? post.updatedAt,
      authorName,
      authorUrl: authorSlug ? `${base}/authors/${authorSlug}` : undefined,
      heroImageUrl: absUrl(base, hero?.url),
      imageWidth: hero?.width ?? undefined,
      imageHeight: hero?.height ?? undefined,
      imageCaption: hero?.alt ?? undefined,
      description: post.aeo?.answerSummary ?? post.excerpt ?? undefined,
      wordCount,
      section,
      keywords,
      publisher: { name: siteName, logoUrl: absUrl(base, orgLogo) },
    }),
    breadcrumbList([
      { name: 'Home', url: base },
      { name: 'Blog', url: `${base}/blog` },
      { name: post.title, url: `${base}/blog/${post.slug}` },
    ]),
  ]
  if (post.aeo?.faq && post.aeo.faq.length > 0) {
    ld.push(
      faqPageSchema(
        post.aeo.faq.map((q) => ({
          question: q.question,
          answerText: lexicalToPlainText(q.answer),
        })),
      ),
    )
  }

  const categoryValues = (post.categories ?? [])
    .map((c) => c.value)
    .filter((v): v is string => Boolean(v))
  // Related posts depend on this post's categories + the wider published set, so
  // tag the cached read with both this post's tag and the collection list tag
  // (any publish refreshes it).
  const relatedDocs = await cachedRead(
    async () => {
      const relatedQuery = categoryValues.length
        ? await payload.find({
            collection: 'blog-posts',
            where: {
              and: [
                { 'categories.value': { in: categoryValues } },
                { slug: { not_equals: slug } },
                { _status: { equals: 'published' } },
              ],
            },
            limit: 3,
            depth: 0,
            sort: '-publishedAt',
          })
        : await payload.find({
            collection: 'blog-posts',
            where: {
              and: [{ slug: { not_equals: slug } }, { _status: { equals: 'published' } }],
            },
            limit: 3,
            depth: 0,
            sort: '-publishedAt',
          })
      return relatedQuery.docs
    },
    ['related-posts', slug, categoryValues.join(',')],
    [docTag('blog-posts', slug), collectionListTag('blog-posts'), 'sitemap'],
  )
  const relatedPosts = relatedDocs.map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
  }))

  const tagValues = (post.tags ?? []).map((t) => t.value).filter((v): v is string => Boolean(v))

  // Recommended products (affiliate archetype). The relationship is absent on
  // leadgen/landing posts and empty on every existing post, so this is [] there.
  // Resolved at depth 2 (the route already reads depth 2), so each entry is a doc.
  const recommendedProducts: ProductDoc[] = (
    ((post as { recommendedProducts?: unknown }).recommendedProducts as
      | (ProductDoc | number | string | null)[]
      | null
      | undefined) ?? []
  ).filter((p): p is ProductDoc => typeof p === 'object' && p !== null && Boolean(p.name?.trim()))
  const hasRecommended = recommendedProducts.length > 0
  // A present recommendation also gates the FTC AffiliateDisclosure (reuses the
  // exact existing component + gate — no new compliance surface).
  const hasSponsored = bodyHasSponsoredLink(post.body) || hasRecommended

  // Per-product JSON-LD ItemList from the resolved relationship docs, each Product
  // with a STABLE name/@id from the product doc (not the page title). Mirrors the
  // marketing page's inline-block mapping, sourced from product docs instead.
  if (hasRecommended) {
    const items: SchemaRoundupItem[] = recommendedProducts.map((p) => ({
      name: p.name ?? 'Product',
      affiliateUrl: p.affiliateUrl ?? undefined,
      imageUrl:
        (p.image && typeof p.image === 'object' ? p.image.url : undefined) ??
        p.imageUrl ??
        undefined,
      rating: p.rating,
      price: p.price,
      pros: (p.pros ?? []).map((pr) => pr?.value).filter((v): v is string => Boolean(v)),
      cons: (p.cons ?? []).map((c) => c?.value).filter((v): v is string => Boolean(v)),
      badge: p.badge ?? undefined,
    }))
    ld.push(
      productRoundupSchema(base, {
        name: `Recommended products: ${post.title}`,
        url: `${base}/blog/${post.slug}`,
        items,
        publisherName: siteName,
      }),
    )
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  // When the author is linkable, render the full "Author · Date" byline as a real
  // <Link> below PageHeader, and let PageHeader's text eyebrow fall back to "Blog"
  // (avoids a duplicate date). Otherwise keep the original eyebrow string unchanged.
  const linkAuthor = Boolean(authorName && authorSlug)
  const eyebrow = linkAuthor ? '' : [authorName, formattedDate].filter(Boolean).join(' · ')

  // ENGAGEMENT layer config. The canonical post URL drives ShareButtons; the
  // brand CTA target + headline drive the sticky bar / inline CTA / exit modal.
  // A configured business name personalises the copy; the CTA points at /contact
  // (always present in the template) unless a landing brief overrides intent.
  const shareUrl = `${base}/blog/${post.slug}`
  const ctaHref = '/contact'
  const businessName = siteConfig.business.name
  const ctaHeadline =
    businessName && businessName !== 'My Website'
      ? `Work with ${businessName}`
      : 'Ready to take the next step?'

  return (
    <>
      <ReadingProgress />
      <JsonLd data={ld} />

      {/* Header zone — breadcrumbs, eyebrow, title, lede, byline */}
      <Container>
        <header className="pt-8 sm:pt-12">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Blog', href: '/blog' },
              { name: post.title, href: `/blog/${post.slug}` },
            ]}
          />
          <div className="mt-8 border-b border-border pb-8 sm:mt-10 sm:pb-10">
            {eyebrow || section ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {eyebrow || section}
              </p>
            ) : null}
            <h1 className="mt-3 text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            ) : null}
            {linkAuthor ? (
              <p className="mt-6 text-sm text-muted-foreground">
                <Link
                  href={`/authors/${authorSlug}`}
                  className="font-medium text-foreground no-underline transition-colors hover:text-primary"
                >
                  {authorName}
                </Link>
                {formattedDate ? <span> · {formattedDate}</span> : null}
              </p>
            ) : null}
            <div className="mt-6">
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>
        </header>
      </Container>

      <Container>
        <div className="py-10 sm:py-12">
          {hero?.url ? (
            <figure className="mb-10 overflow-hidden rounded-xl border border-border bg-muted shadow-md sm:mb-12">
              <Image
                src={hero.url}
                alt={hero.alt ?? post.title}
                width={hero.width ?? 1200}
                height={hero.height ?? 630}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full"
              />
            </figure>
          ) : (
            // HERO FALLBACK: no uploaded heroImage ⇒ render the Tier-1 code-generated
            // branded hero so every post ships a real, on-brand visual.
            <CodeGenHero
              title={post.title}
              subtitle={post.excerpt ?? post.aeo?.answerSummary ?? undefined}
              className="mb-10 sm:mb-12"
            />
          )}

          {/* Lead-in blocks: answer capsule, takeaways, ToC, disclosure */}
          <div className="space-y-6">
            <AnswerCapsule text={post.aeo?.answerSummary} />
            <KeyTakeaways items={post.aeo?.keyTakeaways} />
            <TableOfContents headings={extractHeadings(post.body)} />
            {hasSponsored ? <AffiliateDisclosure /> : null}
          </div>

          <article className="article-prose mt-10 sm:mt-12">
            <RichText data={post.body} />
            <InlineCta
              heading={ctaHeadline}
              body="Have a project in mind? Let's talk about how we can help."
              ctaLabel="Get in touch"
              ctaHref={ctaHref}
              variant="subtle"
            />
            {post.aeo?.faq && post.aeo.faq.length > 0 ? (
              <section className="mt-12 border-t border-border pt-10">
                <h2>Frequently asked questions</h2>
                <dl className="mt-6 divide-y divide-border">
                  {post.aeo.faq.map((qa) => (
                    <div key={qa.id} className="py-5 first:pt-0">
                      <dt className="text-base font-semibold text-foreground">{qa.question}</dt>
                      <dd className="mt-2 text-muted-foreground [&>*]:mt-0">
                        <RichText data={qa.answer} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </article>

          {/* Dynamic recommendation block — reads referenced Products docs (single
              source of truth), not inline data. Renders nothing when empty. */}
          <RecommendedProducts products={recommendedProducts} />

          {/* Taxonomy chips */}
          {categoryValues.length > 0 || tagValues.length > 0 ? (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-8">
              {categoryValues.map((c) => (
                <Link
                  key={`cat-${c}`}
                  href={`/blog/category/${encodeURIComponent(c)}`}
                  className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary no-underline transition-colors hover:bg-primary/20"
                >
                  {c}
                </Link>
              ))}
              {tagValues.map((t) => (
                <Link
                  key={`tag-${t}`}
                  href={`/blog/tag/${encodeURIComponent(t)}`}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground no-underline transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  #{t}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Email-capture section — newsletter sign-up near the end of the read,
              where intent is highest. Tagged source: blog-footer. */}
          <div className="mt-16">
            <EmailCapture variant="section" source="blog-footer" />
          </div>

          {relatedPosts.length > 0 ? (
            <div className="mt-16 border-t border-border pt-12">
              <RelatedPosts posts={relatedPosts} />
            </div>
          ) : null}
        </div>
      </Container>

      {/* Dismissible sticky CTA (show-after-scroll + localStorage) and a
          once-per-session exit-intent capture. Both client-only. */}
      <StickyCta headline={ctaHeadline} ctaLabel="Get in touch" ctaHref={ctaHref} />
      <ExitIntentModal source="exit-intent" />
    </>
  )
}
