import {
  blocksHaveAffiliateRoundup,
  breadcrumbList,
  faqPageSchema,
  lexicalToPlainText,
  ogImages,
  productRoundupSchema,
  type RoundupItem,
  seoMeta,
} from '@p51/engine'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnswerCapsule } from '@/components/marketing/AnswerCapsule'
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs'
import { ChartBlock } from '@/components/marketing/ChartBlock'
import { CodeGenHero } from '@/components/marketing/CodeGenHero'
import { Container } from '@/components/marketing/Container'
import { AffiliateDisclosure } from '@/components/marketing/Disclosure'
import { EmailCapture } from '@/components/marketing/EmailCapture'
import { JsonLd } from '@/components/marketing/JsonLd'
import { KeyTakeaways } from '@/components/marketing/KeyTakeaways'
import { PageHeader } from '@/components/marketing/PageHeader'
import { ProductRoundup } from '@/components/marketing/ProductRoundup'
import { RichText } from '@/components/marketing/RichText'
import { ShareButtons } from '@/components/marketing/ShareButtons'
import { cachedRead, docTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

const RESERVED = ['blog', 'contact']

// Cache a single published Page by slug, tagged `pages:<slug>` so the publish
// hook's revalidateTag(`pages:${slug}`) invalidates exactly this page. depth is
// part of the key so the metadata (depth 1) and body (depth 2) reads cache
// independently. Returns null when absent (callers branch to notFound / {}).
async function getPageBySlug(slug: string, depth: number) {
  const payload = await getPayloadClient()
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        limit: 1,
        depth,
      })
      return docs[0] ?? null
    },
    ['page', String(depth), slug],
    [docTag('pages', slug)],
  )
}

type MediaLike = {
  url?: string | null
  width?: number | null
  height?: number | null
  alt?: string | null
}
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (RESERVED.includes(slug)) return {}

  const payload = await getPayloadClient()
  const page = await getPageBySlug(slug, 1)
  if (!page) return {}
  const base = env().NEXT_PUBLIC_SERVER_URL
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const title = page.meta?.title ?? page.title
  const description = page.meta?.description ?? page.aeo?.answerSummary ?? undefined
  const hero = asMedia(page.meta?.image)
  const defaultImg = asMedia(settings.defaultMeta?.image)
  return seoMeta({
    canonical: `/${slug}`,
    title,
    description,
    siteName,
    images: ogImages(base, hero?.url, defaultImg?.url, hero?.alt ?? title),
    type: 'website',
  })
}

export default async function PageBySlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (RESERVED.includes(slug)) {
    notFound()
  }

  const page = await getPageBySlug(slug, 2)
  if (!page) notFound()

  const baseUrl = env().NEXT_PUBLIC_SERVER_URL
  const ld: object[] = [
    breadcrumbList([
      { name: 'Home', url: baseUrl },
      { name: page.title, url: `${baseUrl}/${page.slug}` },
    ]),
  ]
  if (page.aeo?.faq && page.aeo.faq.length > 0) {
    ld.push(
      faqPageSchema(
        page.aeo.faq.map((q) => ({
          question: q.question,
          answerText: lexicalToPlainText(q.answer),
        })),
      ),
    )
  }

  // Affiliate roundup: if any productRoundup block carries a resolved affiliate
  // link, (a) emit an ItemList of Product/Review/AggregateRating JSON-LD, and (b)
  // render the FTC AffiliateDisclosure near the top (same conspicuous-disclosure
  // rule as a sponsored body link).
  const hasRoundup = blocksHaveAffiliateRoundup(page.body)
  if (hasRoundup) {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const publisherName = settings.organization?.name ?? 'My Website'
    for (const block of page.body ?? []) {
      if (block.blockType !== 'productRoundup') continue
      const items: RoundupItem[] = (block.items ?? []).map((it) => ({
        name: it.name,
        affiliateUrl: it.affiliateUrl,
        imageUrl: it.imageUrl ?? undefined,
        rating: it.rating,
        price: it.price,
        pros: (it.pros ?? []).map((p) => p.value).filter((v): v is string => Boolean(v)),
        cons: (it.cons ?? []).map((c) => c.value).filter((v): v is string => Boolean(v)),
        description: lexicalToPlainText(it.blurb) || undefined,
        badge: it.badge ?? undefined,
      }))
      ld.push(
        productRoundupSchema(baseUrl, {
          name: page.title,
          url: `${baseUrl}/${page.slug}`,
          items,
          publisherName,
        }),
      )
    }
  }

  // HERO FALLBACK: when the page has no uploaded meta image, render the Tier-1
  // code-generated branded hero so every page ships a real, on-brand visual.
  const hero = asMedia(page.meta?.image)

  return (
    <>
      <JsonLd data={ld} />
      <Container size="narrow">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: page.title, href: `/${page.slug}` },
          ]}
        />
      </Container>
      <PageHeader title={page.title} />
      <section>
        <Container size="narrow">
          <article>
            {hero?.url ? null : (
              <CodeGenHero
                title={page.title}
                subtitle={page.meta?.description ?? page.aeo?.answerSummary ?? undefined}
                className="mb-8 sm:mb-10"
              />
            )}
            <AnswerCapsule text={page.aeo?.answerSummary} />
            {hasRoundup ? <AffiliateDisclosure /> : null}
            <KeyTakeaways items={page.aeo?.keyTakeaways} />
            {page.body?.map((block, i) => {
              const key = block.id ?? `${block.blockType}-${i}`
              if (block.blockType === 'richText') {
                return <RichText key={key} data={block.content} />
              }
              if (block.blockType === 'cta') {
                return (
                  <section key={key}>
                    <h2>{block.heading}</h2>
                    {block.subheading ? <p>{block.subheading}</p> : null}
                    <Link href={block.buttonHref}>{block.buttonLabel}</Link>
                  </section>
                )
              }
              if (block.blockType === 'mediaWithText') {
                return (
                  <section key={key}>
                    <RichText data={block.content} />
                  </section>
                )
              }
              if (block.blockType === 'productRoundup') {
                return <ProductRoundup key={key} block={block} />
              }
              if (block.blockType === 'dataChart') {
                return <ChartBlock key={key} block={block} />
              }
              return null
            })}
            {page.aeo?.faq && page.aeo.faq.length > 0 ? (
              <section>
                <h2>Frequently asked questions</h2>
                <dl>
                  {page.aeo.faq.map((qa) => (
                    <div key={qa.id}>
                      <dt>{qa.question}</dt>
                      <dd>
                        <RichText data={qa.answer} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <div className="mt-10">
              <ShareButtons url={`${baseUrl}/${page.slug}`} title={page.title} />
            </div>
          </article>

          {/* Email-capture section — newsletter sign-up. source: page-section. */}
          <div className="mt-12">
            <EmailCapture variant="section" source="page-section" />
          </div>
        </Container>
      </section>
    </>
  )
}
