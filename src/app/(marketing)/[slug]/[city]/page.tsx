import {
  faqPageSchema,
  lexicalToPlainText,
  localBusinessSchema,
  ogImages,
  seoMeta,
  serviceSchema,
} from '@p51/engine'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { notFound } from 'next/navigation'
import type { CollectionSlug } from 'payload'
import { JsonLd } from '@/components/marketing/JsonLd'
import { RichText } from '@/components/marketing/RichText'
import { ServiceAreaTemplate } from '@/components/templates/ServiceAreaTemplate'
import { cachedRead, docTag } from '@/lib/cache'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import siteConfig from '@/site.config'

/**
 * PROGRAMMATIC LEAD-GEN ROUTE — /[slug]/[city] (service in a city).
 *
 * One route renders every "service in a city" page from the ServiceAreas
 * collection. `force-dynamic` so the build NEVER queries the DB at build time
 * (the collection only exists under the leadgen archetype; the affiliate build
 * compiles this file but never executes it). It NESTS under the single-segment
 * `[slug]` Pages catch-all (sharing the first-segment param name `slug`), which
 * is why it does not trip Next's "different slug names for the same dynamic
 * path" rule. The first segment is read as the service, the second as the city.
 *
 * The lookup is by the doc's canonical `slug` = "<service>/<city>", which the
 * provisioner writes URL-safe. SEO: seoMeta canonical = /[slug]/[city];
 * JSON-LD emits a Service (the offering) + a LocalBusiness (the local entity),
 * plus an FAQPage when the doc carries AEO FAQs.
 */

export const dynamic = 'force-dynamic'

// The ServiceAreas collection is only mounted under the leadgen archetype, so
// it is absent from the affiliate-generated payload-types `CollectionSlug`
// union. This local shape + a narrow cast lets the file typecheck against the
// DEFAULT (affiliate) types while still resolving the real doc at runtime when
// the collection IS mounted.
type ServiceAreaDoc = {
  id: number | string
  service: string
  city: string
  region?: string | null
  slug: string
  intro?: string | null
  body?: SerializedEditorState | null
  highlights?: { value: string; id?: string | null }[] | null
  aeo?: {
    answerSummary?: string | null
    faq?: { question: string; answer: unknown; id?: string | null }[] | null
  } | null
}

const SERVICE_AREAS = 'service-areas' as CollectionSlug

const sectionToSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function findServiceArea(service: string, city: string): Promise<ServiceAreaDoc | null> {
  // Compose the canonical slug from the two path segments. Already URL-safe in a
  // real URL, but normalise defensively so "/Emergency-Plumbing/Austin" resolves.
  const slug = `${sectionToSlug(service)}/${sectionToSlug(city)}`
  const payload = await getPayloadClient()
  // Cached + tagged `service-areas:<slug>`; the revalidate hook now maps
  // service-areas (see revalidate-after-change.ts) so publishing a service-area
  // invalidates exactly this page.
  return cachedRead(
    async () => {
      const { docs } = await payload.find({
        collection: SERVICE_AREAS,
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        limit: 1,
        depth: 1,
      })
      return (docs[0] as unknown as ServiceAreaDoc | undefined) ?? null
    },
    ['service-area', slug],
    [docTag('service-areas', slug)],
  )
}

type RouteParams = { params: Promise<{ slug: string; city: string }> }

export async function generateMetadata({ params }: RouteParams) {
  // Guard: this route only serves data under the leadgen archetype.
  if (siteConfig.archetype !== 'leadgen') return {}
  const { slug: service, city } = await params
  const doc = await findServiceArea(service, city)
  if (!doc) return {}

  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const siteName = settings.organization?.name ?? siteConfig.business.name
  const title = `${doc.service} in ${doc.city}`
  const description = doc.intro ?? doc.aeo?.answerSummary ?? undefined

  return seoMeta({
    canonical: `/${doc.slug}`,
    title,
    description,
    siteName,
    images: ogImages(base, undefined, undefined, title),
    type: 'website',
  })
}

export default async function ServiceAreaPage({ params }: RouteParams) {
  if (siteConfig.archetype !== 'leadgen') notFound()

  const { slug: service, city } = await params
  const doc = await findServiceArea(service, city)
  if (!doc) notFound()

  const base = env().NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const { business } = siteConfig
  const brandName = settings.organization?.name ?? business.name

  const title = `${doc.service} in ${doc.city}`
  const summary = doc.intro ?? doc.aeo?.answerSummary ?? undefined

  // Google Maps embed from the business location + the page's city/region.
  const place = [doc.city, doc.region, business.location].filter(Boolean).join(' ')
  const mapEmbedSrc = place
    ? `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`
    : undefined
  const mapUrl = place
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
    : undefined

  const highlights =
    doc.highlights && doc.highlights.length > 0
      ? {
          items: doc.highlights.map((h) => ({ title: h.value, description: '' })),
        }
      : undefined

  const faqItems =
    doc.aeo?.faq && doc.aeo.faq.length > 0
      ? doc.aeo.faq.map((q) => ({
          question: q.question,
          answer: lexicalToPlainText(q.answer),
        }))
      : undefined

  // JSON-LD: the offered Service + the LocalBusiness entity (+ FAQ when present).
  const ld: object[] = [
    serviceSchema(base, {
      title,
      slug: doc.slug,
      summary,
      providerName: brandName,
    }),
    localBusinessSchema(base, {
      name: brandName,
      url: base,
      telephone: business.phone,
      email: business.email,
      city: doc.city,
      region: doc.region ?? undefined,
      description: title,
      mapUrl,
    }),
  ]
  if (doc.aeo?.faq && doc.aeo.faq.length > 0) {
    ld.push(
      faqPageSchema(
        doc.aeo.faq.map((q) => ({
          question: q.question,
          answerText: lexicalToPlainText(q.answer),
        })),
      ),
    )
  }

  const contactFootnote = [
    business.phone ? `Call ${business.phone}` : null,
    business.email ?? null,
    business.location ?? null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <JsonLd data={ld} />
      <ServiceAreaTemplate
        brandName={brandName}
        service={doc.service}
        city={doc.city}
        eyebrow={business.tagline ?? undefined}
        intro={summary}
        body={doc.body ? <RichText data={doc.body} /> : undefined}
        ctaLabel={siteConfig.landing?.cta ?? 'Get a free quote'}
        highlights={highlights}
        contact={{
          phone: business.phone,
          whatsapp: business.whatsapp,
          whatsappText: `Hi ${brandName}, I'd like a quote for ${doc.service} in ${doc.city}.`,
          email: business.email,
          address: business.location,
          mapEmbedSrc,
        }}
        leadForm={{ footnote: contactFootnote || undefined }}
        faq={faqItems}
        footer={{ description: business.tagline ?? undefined }}
      />
    </>
  )
}
