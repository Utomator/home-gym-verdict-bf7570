import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { Stars } from '@/components/ui/Stars'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { FaqAccordion, type FaqItem } from '@/components/sections/FaqAccordion'
import { type Feature, FeatureGrid } from '@/components/sections/FeatureGrid'
import { HeroCentered } from '@/components/sections/HeroCentered'
import { HeroSplit } from '@/components/sections/HeroSplit'
import { LeadFormSection } from '@/components/sections/LeadFormSection'
import { SiteFooter, type FooterColumn, type FooterLink } from '@/components/sections/SiteFooter'
import { SiteHeader } from '@/components/sections/SiteHeader'
import { StatsBand, type Stat } from '@/components/sections/StatsBand'
import { Testimonial, type TestimonialProps } from '@/components/sections/Testimonial'

/**
 * LandingTemplate — single-page LEAD-FUNNEL archetype.
 *
 * Assembles one cohesive landing page from the shared design-block palette:
 *
 *   SiteHeader (anchor nav)
 *     → Hero (centered OR split)
 *     → FeatureGrid (#features)
 *     → StatsBand (optional proof band)
 *     → Testimonial (social proof)
 *     → FaqAccordion (#faq)
 *     → CtaBanner + LeadForm (#contact)
 *     → SiteFooter
 *
 * Everything is content-via-props (sourced from the Site Brief at the call
 * site) and token-driven, so a brand recolor at the @theme layer recolours the
 * whole funnel. Section-anchor nav points at #features / #faq / #contact.
 *
 * The lead form lives in the CLIENT <LeadFormSection> wrapper, which wires the
 * submit action (store + Slack + gated email) and the WhatsApp click-to-chat
 * CTA. Everything else renders as server components.
 */

export type LandingHero =
  | {
      variant?: 'centered'
      eyebrow?: string
      title: ReactNode
      lede?: ReactNode
      footnote?: ReactNode
      image?: never
    }
  | {
      variant: 'split'
      eyebrow?: string
      title: ReactNode
      lede?: ReactNode
      footnote?: ReactNode
      /** Media slot for the split hero (next/image, <img>, illustration…). */
      image?: ReactNode
    }

export type LandingTemplateProps = {
  /** Brand label shown in header + footer. */
  brandName: string
  /** Logo node (falls back to brandName text). */
  logo?: ReactNode

  hero: LandingHero
  /** Primary CTA label (anchors to #contact). From the brief's `landing.cta`. */
  ctaLabel: string

  features?: {
    eyebrow?: string
    heading: string
    description?: string
    items: Feature[]
    columns?: 2 | 3 | 4
  }

  stats?: {
    eyebrow?: string
    heading?: string
    items: Stat[]
  }

  testimonial?: TestimonialProps

  faq?: {
    eyebrow?: string
    heading?: string
    items: FaqItem[]
  }

  /** The closing CTA banner above the lead form. */
  closingCta?: {
    eyebrow?: string
    heading: string
    body?: string
  }

  /** Lead-capture block content + contact channels. */
  contact: {
    eyebrow?: string
    heading?: string
    description?: string
    submitLabel?: string
    /** WhatsApp number (international format) → renders the chat CTA. */
    whatsapp?: string
    /** Prefilled WhatsApp message. */
    whatsappText?: string
    footnote?: string
  }

  footer?: {
    description?: string
    columns?: FooterColumn[]
    legalLinks?: FooterLink[]
  }
}

const CONTACT_HASH = '#contact'

export function LandingTemplate({
  brandName,
  logo,
  hero,
  ctaLabel,
  features,
  stats,
  testimonial,
  faq,
  closingCta,
  contact,
  footer,
}: LandingTemplateProps) {
  // Anchor nav is built from the sections that are actually present.
  const navItems = [
    features ? { label: 'Features', href: '#features' } : null,
    faq ? { label: 'FAQ', href: '#faq' } : null,
    { label: 'Contact', href: CONTACT_HASH },
  ].filter((x): x is { label: string; href: string } => x !== null)

  const heroNode =
    hero.variant === 'split' ? (
      <HeroSplit
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        footnote={hero.footnote}
        image={hero.image}
        primaryCta={{ label: ctaLabel, href: CONTACT_HASH }}
        secondaryCta={features ? { label: 'See features', href: '#features' } : undefined}
      />
    ) : (
      <HeroCentered
        eyebrow={hero.eyebrow}
        title={hero.title}
        lede={hero.lede}
        footnote={hero.footnote}
        primaryCta={{ label: ctaLabel, href: CONTACT_HASH }}
        secondaryCta={features ? { label: 'See features', href: '#features' } : undefined}
      />
    )

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
        {heroNode}

        {features ? (
          <div id="features" className="scroll-mt-16">
            <FeatureGrid
              eyebrow={features.eyebrow}
              heading={features.heading}
              description={features.description}
              features={features.items}
              columns={features.columns ?? 3}
            />
          </div>
        ) : null}

        {stats ? (
          <StatsBand eyebrow={stats.eyebrow} heading={stats.heading} stats={stats.items} />
        ) : null}

        {testimonial ? (
          <section className="bg-background py-20 sm:py-28">
            <Container size="default">
              <div className="mx-auto max-w-3xl">
                <Testimonial {...testimonial} />
              </div>
            </Container>
          </section>
        ) : null}

        {faq ? (
          <section id="faq" className="scroll-mt-16 bg-muted/40 py-20 sm:py-28">
            <Container size="narrow">
              <div className="mx-auto max-w-2xl text-center">
                {faq.eyebrow ? (
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {faq.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {faq.heading ?? 'Frequently asked questions'}
                </h2>
              </div>
              <div className="mt-12">
                <FaqAccordion items={faq.items} />
              </div>
            </Container>
          </section>
        ) : null}

        <section id="contact" className="scroll-mt-16 bg-background">
          {closingCta ? (
            <section className="bg-background pt-20 sm:pt-24">
              <Container>
                <CtaBanner
                  eyebrow={closingCta.eyebrow}
                  heading={closingCta.heading}
                  body={closingCta.body}
                  primaryLabel={ctaLabel}
                  primaryHref={CONTACT_HASH}
                />
              </Container>
            </section>
          ) : null}

          <LeadFormSection
            eyebrow={contact.eyebrow}
            heading={contact.heading}
            description={contact.description}
            submitLabel={contact.submitLabel ?? ctaLabel}
            whatsapp={contact.whatsapp}
            whatsappText={contact.whatsappText}
            footnote={contact.footnote}
          />
        </section>
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
