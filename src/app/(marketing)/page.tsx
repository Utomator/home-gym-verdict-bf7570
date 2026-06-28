import { itemListSchema, ogImages, seoMeta, webPageSchema } from '@p51/engine'
import type { CollectionSlug } from 'payload'
import { Card, EmptyState } from '@/components/marketing/Card'
import { AffiliateDisclosure } from '@/components/marketing/Disclosure'
import { JsonLd } from '@/components/marketing/JsonLd'
import { RecommendedProducts, type ProductDoc } from '@/components/marketing/RecommendedProducts'
import { Section } from '@/components/marketing/Section'
import { Container } from '@/components/marketing/Container'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { FaqAccordion } from '@/components/sections/FaqAccordion'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { HeroVerdict } from '@/components/sections/HeroVerdict'
import { ScoringRubric } from '@/components/sections/ScoringRubric'
import { TrustBar } from '@/components/sections/TrustBar'
import { LandingTemplate } from '@/components/templates/LandingTemplate'
import {
  LeadgenHomeTemplate,
  type ServiceAreaLink,
} from '@/components/templates/LeadgenHomeTemplate'
import { cachedRead, collectionListTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import siteConfig from '@/site.config'

// On-demand render (no-DB build stays green); the recent-posts read below is
// served from the tag-invalidated data cache, refreshed on publish.
export const dynamic = 'force-dynamic'

// ServiceAreas is only mounted under the leadgen archetype (absent from the
// affiliate-generated CollectionSlug union), so query it through a narrow cast.
const SERVICE_AREAS = 'service-areas' as CollectionSlug
type ServiceAreaListDoc = { service: string; city: string; slug: string }

/** Hero headline for the leadgen home: the brief's headline, else a brand default. */
const landingHeadline = (headline: string | undefined, brandName: string) =>
  headline ?? `Trusted local service from ${brandName}`

type MediaLike = { url?: string | null }
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

// Art-directed hero image (generate_image, purpose=hero, 16:9) — the real
// platform-stored asset, served from R2. Rendered with a plain <img> so it works
// regardless of the runtime R2 remotePatterns config.
const HERO_IMAGE = {
  url: 'https://pub-b85948f790d74236ab6175f243dc1784.r2.dev/media/9f832ef2-1e9f-45f9-a9d7-0e6cff77e396/2026/06/71bd1ed9-22e3-4c2e-8487-f1288cbce15b.png',
  alt: 'A compact home gym — adjustable dumbbells, a folding rack and resistance bands — set up in the corner of a small urban apartment.',
}

// Static brand scaffolding for the homepage sections (DESIGN.md §5). This is
// design/landing copy, NOT CMS content — blog posts and products are filled by
// the separate content pipeline.
const VALUE_PROPS = [
  {
    icon: 'Ruler' as const,
    title: 'Space-first, always',
    description:
      'We measure folded-away and in-use footprints in real apartments — not on a showroom floor.',
  },
  {
    icon: 'ShieldCheck' as const,
    title: 'No paid verdicts',
    description: 'Rankings can’t be bought. Affiliate links never nudge a score, up or down.',
  },
  {
    icon: 'Wallet' as const,
    title: 'Value over hype',
    description: 'We weigh dollars-per-feature, so a $200 rack can absolutely beat a $900 one.',
  },
  {
    icon: 'Volume2' as const,
    title: 'Neighbor-proof',
    description: 'Noise and floor impact tested for shared walls and the people living below you.',
  },
  {
    icon: 'Wrench' as const,
    title: 'Tested under load',
    description: 'Every pick earns real reps — wobble, welds and wear — not a tidy unboxing video.',
  },
  {
    icon: 'RefreshCw' as const,
    title: 'Kept current',
    description: 'We re-check prices and stock so the verdict still holds the day you actually buy.',
  },
]

const FAQS = [
  {
    question: 'Do you actually test the equipment?',
    answer:
      'Yes. Gear we recommend is set up and trained on in genuinely small spaces — typically under eight square feet of footprint — and scored on a fixed seven-point rubric. We never rank from spec sheets alone.',
  },
  {
    question: 'How does Home Gym Verdict make money?',
    answer:
      'Some links are affiliate links — if you buy through them we may earn a small commission at no extra cost to you. That revenue never changes a score or a ranking; the verdict is decided before any link is added.',
  },
  {
    question: 'What counts as a “small space”?',
    answer:
      'We design our tests around studios, one-bedrooms and shared apartments: equipment that folds flat, stows under a bed or doubles up, and that won’t shake a downstairs neighbor’s ceiling.',
  },
  {
    question: 'How often are reviews updated?',
    answer:
      'Prices, stock and model availability are re-checked regularly, and verdicts are revisited when a product changes or a better small-space option arrives.',
  },
]

export async function generateMetadata() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const description =
    settings.organization?.tagline ?? settings.defaultMeta?.description ?? undefined
  const meta = seoMeta({
    canonical: '/',
    title: siteName,
    description,
    siteName,
    images: ogImages(base, undefined, asMedia(settings.defaultMeta?.image)?.url, siteName),
  })
  // The layout sets a `%s · Org` title template; emit the org name as an absolute
  // title so the home <title> stays "Org" rather than becoming "Org · Org".
  // (OpenGraph/Twitter titles in `meta` already carry the plain org-name string.)
  return { ...meta, title: { absolute: siteName } }
}

export default async function Home() {
  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? 'My Website'
  const description =
    settings.organization?.tagline ?? settings.defaultMeta?.description ?? undefined

  // ── LANDING archetype branch ──────────────────────────────────────────────
  // When the Site Brief declares the 'landing' archetype, render the single-page
  // lead funnel from the brief + SiteSettings. The (marketing) layout suppresses
  // its content-hub chrome for this archetype (see layout.tsx), so the template
  // owns the full page (header / main / footer). Affiliate behaviour below is
  // untouched.
  if (siteConfig.archetype === 'landing' && siteConfig.landing) {
    const { business, landing } = siteConfig
    const brandName = business.name || siteName
    const waText = `Hi ${brandName}, I'd like to know more.`

    const footerColumns =
      business.socials && business.socials.length > 0
        ? [
            {
              title: 'Follow',
              links: business.socials.map((s) => ({
                label: s.platform,
                href: s.url,
              })),
            },
          ]
        : undefined

    const contactFootnote = [
      business.phone ? `Call ${business.phone}` : null,
      business.email ?? null,
      business.location ?? null,
    ]
      .filter(Boolean)
      .join(' · ')

    return (
      <>
        <JsonLd data={[webPageSchema(base, { name: brandName, url: base, description })]} />
        <LandingTemplate
          brandName={brandName}
          hero={{
            variant: 'centered',
            eyebrow: business.tagline ?? undefined,
            title: landing.headline,
            lede: landing.subhead,
          }}
          ctaLabel={landing.cta}
          contact={{
            heading: 'Get in touch',
            description: 'Tell us what you need and we will reply within one business day.',
            submitLabel: landing.cta,
            whatsapp: business.whatsapp,
            whatsappText: waText,
            footnote: contactFootnote || undefined,
          }}
          footer={{
            description: business.tagline ?? undefined,
            columns: footerColumns,
          }}
        />
      </>
    )
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── LEADGEN archetype branch ──────────────────────────────────────────────
  // Renders the lead-gen home (hero + services/areas grid → /[service]/[city] +
  // ContactBlock + LeadForm + FAQ + CTA) from the brief + the ServiceAreas
  // collection. The (marketing) layout suppresses its content-hub chrome for
  // this archetype, so the template owns the full page. Affiliate is untouched.
  if (siteConfig.archetype === 'leadgen') {
    const { business } = siteConfig
    const brandName = business.name || siteName
    const waText = `Hi ${brandName}, I'd like a quote.`

    // Pull published service-area pages for the home grid (best-effort; empty
    // when none exist yet). Cast: collection absent from the affiliate types.
    const areas = await payload.find({
      collection: SERVICE_AREAS,
      where: { _status: { equals: 'published' } },
      sort: 'slug',
      limit: 24,
      depth: 0,
    })
    const areaLinks: ServiceAreaLink[] = (areas.docs as unknown as ServiceAreaListDoc[]).map(
      (d) => ({
        service: d.service,
        city: d.city,
        href: `/${d.slug}`,
      }),
    )

    const place = business.location
    const mapEmbedSrc = place
      ? `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`
      : undefined

    const contactFootnote = [
      business.phone ? `Call ${business.phone}` : null,
      business.email ?? null,
      business.location ?? null,
    ]
      .filter(Boolean)
      .join(' · ')

    const footerColumns =
      business.socials && business.socials.length > 0
        ? [
            {
              title: 'Follow',
              links: business.socials.map((s) => ({ label: s.platform, href: s.url })),
            },
          ]
        : undefined

    return (
      <>
        <JsonLd data={[webPageSchema(base, { name: brandName, url: base, description })]} />
        <LeadgenHomeTemplate
          brandName={brandName}
          hero={{
            eyebrow: business.tagline ?? undefined,
            title: landingHeadline(siteConfig.landing?.headline, brandName),
            lede:
              siteConfig.landing?.subhead ??
              description ??
              'Fast, fair-priced local service. Get in touch and we will get back to you the same day.',
          }}
          ctaLabel={siteConfig.landing?.cta ?? 'Get a free quote'}
          areas={
            areaLinks.length > 0
              ? {
                  description: 'Pick your service and city to see details and request a quote.',
                  items: areaLinks,
                }
              : undefined
          }
          contact={{
            phone: business.phone,
            whatsapp: business.whatsapp,
            whatsappText: waText,
            email: business.email,
            address: business.location,
            mapEmbedSrc,
          }}
          leadForm={{ footnote: contactFootnote || undefined }}
          footer={{ description: business.tagline ?? undefined, columns: footerColumns }}
        />
      </>
    )
  }
  // ──────────────────────────────────────────────────────────────────────────

  const postDocs = await cachedRead(
    async () => {
      const res = await payload.find({
        collection: 'blog-posts',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 6,
        depth: 0,
      })
      return res.docs
    },
    ['home-recent', 'blog-posts'],
    [collectionListTag('blog-posts'), 'sitemap'],
  )

  // Featured products for the "recommended-products" band. Empty until the
  // content pipeline upserts products; the section degrades to an EmptyState.
  const productDocs = (await cachedRead(
    async () => {
      const res = await payload.find({
        collection: 'products' as CollectionSlug,
        where: { _status: { equals: 'published' } },
        sort: '-updatedAt',
        limit: 3,
        depth: 1,
      })
      return res.docs
    },
    ['home-products', 'products'],
    [collectionListTag('products' as CollectionSlug)],
  )) as unknown as ProductDoc[]

  // Page-level JSON-LD: a WebPage node for the homepage (anchored to the
  // site-wide WebSite/Organization emitted by the layout) plus an ItemList of the
  // recent posts the page actually renders.
  const ld = [
    webPageSchema(base, { name: siteName, url: base, description }),
    itemListSchema(postDocs.map((p) => ({ name: p.title, url: `${base}/blog/${p.slug}` }))),
  ]

  const hasProducts = productDocs.length > 0

  return (
    <>
      <JsonLd data={ld} />

      {/* hero */}
      <HeroVerdict
        eyebrow="Small-space fitness, tested"
        title="Your apartment is the gym now."
        highlight="the gym"
        lede="Honest, space-obsessed reviews of compact home gym gear — so you build real strength without sacrificing your living room."
        primaryCta={{ label: 'Read the reviews', href: '/blog' }}
        secondaryCta={{ label: 'How we score', href: '#how-we-score' }}
        image={HERO_IMAGE}
      />

      {/* trust-bar */}
      <TrustBar />

      {/* value-props */}
      <FeatureGrid
        eyebrow="Why Home Gym Verdict"
        heading="Built for four walls and a budget."
        description="A general review site grades the gym. We grade your gym — the one that has to fit, fold and stay quiet in a real apartment."
        features={VALUE_PROPS}
        columns={3}
      />

      {/* recommended-products */}
      <Section
        variant="soft"
        eyebrow="Top picks"
        heading="The gear we’d actually put in our own flat."
        lede="Hand-picked, space-first recommendations — updated as new compact contenders land."
        ctaLabel="All reviews"
        ctaHref="/blog"
      >
        {hasProducts ? (
          <>
            <Container size="wide" className="mb-8 px-0">
              <AffiliateDisclosure />
            </Container>
            <RecommendedProducts products={productDocs} heading="" />
          </>
        ) : (
          <EmptyState message="Our first round of small-space verdicts is on the rack — top picks land here soon." />
        )}
      </Section>

      {/* comparison-data */}
      <ScoringRubric />

      {/* guide-grid */}
      <Section
        eyebrow="The guides"
        heading="Fresh from the rack."
        lede="Deep-dives, head-to-heads and setup guides for tiny-footprint training."
        ctaLabel="All posts"
        ctaHref="/blog"
      >
        {postDocs.length === 0 ? (
          <EmptyState message="Guides and reviews will appear here once published." />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2 lg:grid-cols-3">
            {postDocs.map((p) => (
              <li key={p.id}>
                <Card
                  href={`/blog/${p.slug}`}
                  eyebrow="Review"
                  title={p.title}
                  body={p.excerpt ?? undefined}
                  meta={
                    p.publishedAt
                      ? new Date(p.publishedAt).toLocaleDateString('en-US', {
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
      </Section>

      {/* FAQ */}
      <Section variant="soft" eyebrow="Questions" heading="Before you buy.">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion items={FAQS} />
        </div>
      </Section>

      {/* CTA */}
      <Container size="wide" className="pb-24">
        <CtaBanner
          eyebrow="Skip the buyer’s remorse"
          heading="Stop guessing. Get the verdict."
          body="Real tests, space-first scores and no sponsored fluff — find the compact gear that actually fits your life."
          primaryLabel="Browse all reviews"
          primaryHref="/blog"
          secondaryLabel="How we score"
          secondaryHref="#how-we-score"
        />
      </Container>
    </>
  )
}
