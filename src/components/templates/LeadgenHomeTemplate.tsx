import Link from 'next/link'
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
 * LeadgenHomeTemplate — the lead-gen archetype's HOME page.
 *
 *   SiteHeader
 *     → Hero
 *     → FeatureGrid (why-us)
 *     → Services × Areas grid (links to /[service]/[city] programmatic pages)
 *     → ContactBlock (phone + WhatsApp + map)
 *     → CtaBanner + LeadForm (#contact)
 *     → FaqAccordion (#faq)
 *     → SiteFooter
 *
 * Content-via-props + token-driven + DB-free, so it renders both the live
 * (marketing) home and the (preview) sample. The areas grid is built from a
 * flat list of `{ service, city, href }` so the home links straight into the
 * ServiceAreas detail pages.
 */

export type ServiceAreaLink = { service: string; city: string; href: string }

export type LeadgenHomeTemplateProps = {
  brandName: string
  logo?: ReactNode

  hero: {
    eyebrow?: string
    title: ReactNode
    lede?: ReactNode
    footnote?: ReactNode
  }
  ctaLabel?: string

  highlights?: { items: Feature[]; eyebrow?: string; heading?: string; description?: string }

  areas?: {
    eyebrow?: string
    heading?: string
    description?: string
    items: ServiceAreaLink[]
  }

  contact: {
    phone?: string
    whatsapp?: string
    whatsappText?: string
    email?: string
    address?: string
    mapEmbedSrc?: string
  }

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

function AreasGrid({ items }: { items: ServiceAreaLink[] }) {
  return (
    <ul className="mt-12 grid list-none grid-cols-1 gap-4 pl-0 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 no-underline shadow-sm transition-colors hover:border-primary/40"
          >
            <span className="text-base font-semibold text-card-foreground">{a.service}</span>
            <span className="mt-1 text-sm text-muted-foreground">
              in <span className="text-primary">{a.city}</span>
            </span>
            <span className="mt-4 text-sm font-medium text-primary">
              View details<span aria-hidden="true"> →</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function LeadgenHomeTemplate({
  brandName,
  logo,
  hero,
  ctaLabel = 'Get a free quote',
  highlights,
  areas,
  contact,
  leadForm,
  faq,
  footer,
}: LeadgenHomeTemplateProps) {
  const navItems: NavItem[] = [
    highlights ? { label: 'Why us', href: '#highlights' } : null,
    areas && areas.items.length > 0 ? { label: 'Service areas', href: '#areas' } : null,
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
          eyebrow={hero.eyebrow}
          title={hero.title}
          lede={hero.lede}
          footnote={hero.footnote}
          primaryCta={{ label: ctaLabel, href: CONTACT_HASH }}
          secondaryCta={
            areas && areas.items.length > 0 ? { label: 'See service areas', href: '#areas' } : undefined
          }
        />

        {highlights && highlights.items.length > 0 ? (
          <div id="highlights" className="scroll-mt-16">
            <FeatureGrid
              eyebrow={highlights.eyebrow ?? `Why ${brandName}`}
              heading={highlights.heading ?? 'Work done right the first time'}
              description={highlights.description}
              features={highlights.items}
              columns={3}
            />
          </div>
        ) : null}

        {areas && areas.items.length > 0 ? (
          <section id="areas" className="scroll-mt-16 bg-muted/40 py-20 sm:py-28">
            <Container>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {areas.eyebrow ?? 'Where we work'}
                </p>
                <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {areas.heading ?? 'Services & areas we cover'}
                </h2>
                {areas.description ? (
                  <p className="mx-auto mt-4 max-w-prose text-pretty text-lg leading-relaxed text-muted-foreground">
                    {areas.description}
                  </p>
                ) : null}
              </div>
              <AreasGrid items={areas.items} />
            </Container>
          </section>
        ) : null}

        <ContactBlock
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
                heading="Get your free, no-obligation quote"
                body="Tell us what you need and we will get back to you fast — usually within the hour during business hours."
                primaryLabel={ctaLabel}
                primaryHref={CONTACT_HASH}
              />
            </Container>
          </section>

          <LeadFormSection
            eyebrow={leadForm?.eyebrow ?? 'Request a quote'}
            heading={leadForm?.heading ?? 'Tell us about the job'}
            description={
              leadForm?.description ??
              'Share a few details and the best number to reach you. We will reply within one business day — or right away on WhatsApp.'
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
