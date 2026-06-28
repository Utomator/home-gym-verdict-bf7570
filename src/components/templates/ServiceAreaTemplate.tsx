import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { ContactBlock } from '@/components/sections/ContactBlock'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { FaqAccordion, type FaqItem } from '@/components/sections/FaqAccordion'
import { type Feature, FeatureGrid } from '@/components/sections/FeatureGrid'
import { HeroCentered } from '@/components/sections/HeroCentered'
import { LeadFormSection } from '@/components/sections/LeadFormSection'
import { SiteFooter, type FooterColumn, type FooterLink } from '@/components/sections/SiteFooter'
import { SiteHeader, type NavItem } from '@/components/sections/SiteHeader'

/**
 * ServiceAreaTemplate — the LEAD-GEN "service in a city" page, assembled from
 * the shared design-block palette:
 *
 *   SiteHeader
 *     → Hero (service + city)
 *     → FeatureGrid (highlights / why-us)
 *     → ContactBlock (phone + WhatsApp + Google Map embed)
 *     → CtaBanner
 *     → LeadForm (wired to the submitLead server action via LeadFormSection)
 *     → FaqAccordion
 *     → SiteFooter
 *
 * Content-via-props (sourced from a ServiceAreas doc + the Site Brief's
 * business block at the call site), token-driven, and DB-free — so the same
 * template renders the live route AND the (preview) sample with zero
 * infrastructure. Everything is a server component except the LeadFormSection
 * client island.
 */

export type ServiceAreaTemplateProps = {
  brandName: string
  logo?: ReactNode

  service: string
  city: string
  /** Hero eyebrow (e.g. "Licensed · Insured · Same-day"). */
  eyebrow?: string
  /** Hero lede / intro sentence. */
  intro?: ReactNode
  /** Optional rich body rendered between hero and highlights. */
  body?: ReactNode

  /** Primary CTA label (anchors to #contact). */
  ctaLabel?: string

  /** Why-us highlight cards. */
  highlights?: { items: Feature[]; eyebrow?: string; heading?: string; description?: string }

  /** Direct-contact channels. */
  contact: {
    phone?: string
    whatsapp?: string
    whatsappText?: string
    email?: string
    /** Display address shown beside the map. */
    address?: string
    /** Google Maps embed iframe `src`. */
    mapEmbedSrc?: string
  }

  /** Lead-form copy. */
  leadForm?: {
    eyebrow?: string
    heading?: string
    description?: string
    footnote?: string
  }

  faq?: FaqItem[]

  footer?: {
    description?: string
    columns?: FooterColumn[]
    legalLinks?: FooterLink[]
  }
}

const CONTACT_HASH = '#contact'

export function ServiceAreaTemplate({
  brandName,
  logo,
  service,
  city,
  eyebrow,
  intro,
  body,
  ctaLabel = 'Get a free quote',
  highlights,
  contact,
  leadForm,
  faq,
  footer,
}: ServiceAreaTemplateProps) {
  const title = `${service} in ${city}`

  const navItems: NavItem[] = [
    highlights ? { label: 'Why us', href: '#highlights' } : null,
    faq && faq.length > 0 ? { label: 'FAQ', href: '#faq' } : null,
    { label: 'Contact', href: CONTACT_HASH },
  ].filter((x): x is NavItem => x !== null)

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SiteHeader
        brandName={brandName}
        logo={logo}
        homeHref="/"
        navItems={navItems}
        cta={{ label: ctaLabel, href: CONTACT_HASH }}
      />

      <main>
        <HeroCentered
          eyebrow={eyebrow}
          title={
            <>
              {service} in <span className="text-primary">{city}</span>
            </>
          }
          lede={intro}
          primaryCta={{ label: ctaLabel, href: CONTACT_HASH }}
          secondaryCta={highlights ? { label: 'Why choose us', href: '#highlights' } : undefined}
        />

        {body ? (
          <section className="bg-background pb-4">
            <Container size="narrow">
              <div className="prose-sm max-w-none text-muted-foreground [&_a]:text-primary [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-4 [&_p]:leading-relaxed">
                {body}
              </div>
            </Container>
          </section>
        ) : null}

        {highlights && highlights.items.length > 0 ? (
          <div id="highlights" className="scroll-mt-16">
            <FeatureGrid
              eyebrow={highlights.eyebrow ?? `Why ${brandName}`}
              heading={highlights.heading ?? `${service} done right in ${city}`}
              description={highlights.description}
              features={highlights.items}
              columns={3}
            />
          </div>
        ) : null}

        <ContactBlock
          eyebrow="Local & reachable"
          heading={`Serving ${city}`}
          description={`Reach our ${city} team however is easiest — we usually reply the same day.`}
          phone={contact.phone}
          email={contact.email}
          whatsapp={contact.whatsapp}
          whatsappMessage={contact.whatsappText}
          address={contact.address}
          mapEmbedSrc={contact.mapEmbedSrc}
        />

        <section id="contact" className="scroll-mt-16 bg-background">
          <section className="bg-background pt-20 sm:pt-24">
            <Container>
              <CtaBanner
                eyebrow="Ready when you are"
                heading={`Get your free ${service.toLowerCase()} quote in ${city}`}
                body="Tell us what you need and we will get back to you fast — usually within the hour during business hours."
                primaryLabel={ctaLabel}
                primaryHref={CONTACT_HASH}
              />
            </Container>
          </section>

          <LeadFormSection
            eyebrow={leadForm?.eyebrow ?? 'Request a quote'}
            heading={leadForm?.heading ?? `Book ${service} in ${city}`}
            description={
              leadForm?.description ??
              `Share a few details about the job and the best number to reach you. We will reply within one business day — or right away on WhatsApp.`
            }
            submitLabel={ctaLabel}
            whatsapp={contact.whatsapp}
            whatsappText={contact.whatsappText}
            footnote={leadForm?.footnote}
          />
        </section>

        {faq && faq.length > 0 ? (
          <section id="faq" className="scroll-mt-16 bg-muted/40 py-20 sm:py-28">
            <Container size="narrow">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Good to know
                </p>
                <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Common questions
                </h2>
              </div>
              <div className="mt-12">
                <FaqAccordion items={faq} />
              </div>
            </Container>
          </section>
        ) : null}
      </main>

      <SiteFooter
        brandName={brandName}
        logo={logo}
        description={footer?.description}
        homeHref="/"
        columns={footer?.columns}
        legalLinks={footer?.legalLinks}
      />
    </div>
  )
}
