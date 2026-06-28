import { itemListSchema, ogImages, seoMeta, webPageSchema } from '@p51/engine'
import type { CollectionSlug } from 'payload'
import { Card, EmptyState } from '@/components/marketing/Card'
import { JsonLd } from '@/components/marketing/JsonLd'
import { Section } from '@/components/marketing/Section'
import { HeroCentered } from '@/components/sections/HeroCentered'
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
        limit: 12,
        depth: 0,
      })
      return res.docs
    },
    ['home-recent', 'blog-posts'],
    [collectionListTag('blog-posts'), 'sitemap'],
  )

  // Page-level JSON-LD: a WebPage node for the homepage (anchored to the
  // site-wide WebSite/Organization emitted by the layout) plus an ItemList of the
  // recent posts the page actually renders.
  const ld = [
    webPageSchema(base, { name: siteName, url: base, description }),
    itemListSchema(postDocs.map((p) => ({ name: p.title, url: `${base}/blog/${p.slug}` }))),
  ]

  return (
    <>
      <JsonLd data={ld} />
      <HeroCentered
        title={siteName}
        lede={description}
        primaryCta={{ label: 'Read the blog', href: '/blog' }}
      />

      <Section eyebrow="Latest" heading="From the blog" ctaLabel="All posts" ctaHref="/blog">
        {postDocs.length === 0 ? (
          <EmptyState message="Posts will appear here once published." />
        ) : (
          <ul className="grid list-none grid-cols-1 gap-6 pl-0 sm:grid-cols-2 lg:grid-cols-3">
            {postDocs.map((p) => (
              <li key={p.id}>
                <Card
                  href={`/blog/${p.slug}`}
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
    </>
  )
}
