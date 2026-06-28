import { Award } from 'lucide-react'
import type { ReactNode } from 'react'
import { ComparisonTable } from '@/components/sections/ComparisonTable'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { HeroCentered } from '@/components/sections/HeroCentered'
import { SiteHeader } from '@/components/sections/SiteHeader'
import { Container } from '@/components/ui/Container'
import { Stars } from '@/components/ui/Stars'
import {
  googleFontsHref,
  resolveBrandTokens,
  tokensToCss,
  fontTokensCss,
} from '@/lib/branding/brand-tokens'
import { generateBrand, selectPreset } from '@/lib/branding/generate-brand'
import type { Brand } from '@/site.config'

/**
 * DB-FREE BRAND PROOF.
 *
 * Renders the SAME sample section stack THREE times, each wrapped in a different
 * GENERATED brand's token-override scope. The point is to prove that one brand
 * config — produced by `generateBrand({ niche, vibe })` — recolors AND retypes
 * the entire shared component palette with zero component edits, and that the
 * three results are visibly DISTINCT yet each still mature.
 *
 * Theming mechanism: for each brand we resolve its token overrides + font vars
 * and emit them scoped to a unique wrapper class (e.g. `.brand-cyber-sky`). The
 * scope wins over the layout's :root defaults, so each block is independently
 * themed on the same page. Brand fonts load via per-brand Google Fonts <link>s.
 */

export const metadata = {
  title: 'Brand Proof · project51',
  robots: { index: false, follow: false },
}

type BrandBlock = {
  /** Stable scope id (also the visible label). */
  scope: string
  /** Human-readable creative direction this brand was generated from. */
  vibeLabel: string
  brand: Brand
  brandName: string
  presetId: string
}

/* Three DISTINCT creative directions, each run through the real generator so the
   proof exercises generateBrand (not hand-authored tokens). */
const BRIEFS: { niche: string; vibe: string; vibeLabel: string; brandName: string }[] = [
  {
    niche: 'saas developer api platform',
    vibe: 'bold techy innovative futuristic',
    vibeLabel: 'Bold tech / SaaS',
    brandName: 'Hyperscale',
  },
  {
    niche: 'healthcare community realestate local services',
    vibe: 'calm approachable trustworthy friendly',
    vibeLabel: 'Warm local-services',
    brandName: 'Harborview',
  },
  {
    niche: 'magazine writing lifestyle publishing',
    vibe: 'elegant sophisticated literary refined',
    vibeLabel: 'Premium editorial',
    brandName: 'The Lantern',
  },
]

const BLOCKS: BrandBlock[] = BRIEFS.map(({ niche, vibe, vibeLabel, brandName }) => {
  const preset = selectPreset({ niche, vibe })
  return {
    scope: `brand-${preset.id}`,
    vibeLabel,
    brand: generateBrand({ niche, vibe }),
    brandName,
    presetId: preset.id,
  }
})

/** Per-brand scoped CSS: token overrides + font vars under the wrapper class. */
function scopedBrandCss(scope: string, brand: Brand): string {
  const selector = `.${scope}`
  const tokens = tokensToCss(resolveBrandTokens(brand), selector)
  const fonts = fontTokensCss(brand, selector)
  // Re-assert the document reset inside each scope so headings pick up the
  // display font and body the text font (mirrors the design preview scope).
  const localReset = `${selector}{font-family:var(--font-sans);color:var(--foreground);background:var(--background);}${selector} a{text-decoration:none;}`
  return tokens + fonts + localReset
}

const NAV = [
  { label: 'Product', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Customers', href: '#' },
  { label: 'Resources', href: '#' },
]

function SampleStack({ brandName }: { brandName: string }) {
  return (
    <>
      <SiteHeader
        brandName={brandName}
        navItems={NAV}
        cta={{ label: 'Get started', href: '#' }}
      />

      <main>
        <HeroCentered
          eyebrow="New · 2026 release"
          title={
            <>
              One brand config recolors the <span className="text-primary">whole site</span>
            </>
          }
          lede="The same component palette, themed three different ways. Accent, neutral ramp, corner radius, and the display/text font pairing all flow from a single generated brand object — no component edits."
          primaryCta={{ label: 'Start free', href: '#' }}
          secondaryCta={{ label: 'Book a demo', href: '#' }}
          footnote={
            <div className="flex items-center justify-center gap-3">
              <Stars rating={4.9} size={16} showValue />
              <span>Loved by 12,000+ teams</span>
            </div>
          }
        />

        <FeatureGrid
          eyebrow="Why teams switch"
          heading="Everything themeable, nothing hardcoded"
          description="Each capability below is a shared block. Drop in a new brand and every surface — buttons, badges, focus rings, type — retints in one pass."
          columns={3}
          features={[
            {
              icon: 'Wind',
              title: 'One token layer',
              description:
                'Accent, neutrals, radius and fonts resolve to CSS variables that cascade through every component.',
            },
            {
              icon: 'Map',
              title: 'Curated presets',
              description:
                'generateBrand only ever emits hand-vetted identities, so output is mature by construction.',
            },
            {
              icon: 'Bot',
              title: 'Deterministic',
              description:
                'Same niche and vibe in, same brand out — no random, no drift between builds.',
            },
            {
              icon: 'BatteryCharging',
              title: 'AA contrast',
              description:
                'Foreground colors are luminance-derived, so accent text stays legible on any palette.',
            },
            {
              icon: 'Volume2',
              title: 'Type personality',
              description:
                'Each brand pairs a display and text family, shifting the whole voice from geometric to literary.',
            },
            {
              icon: 'ShieldCheck',
              title: 'Zero component edits',
              description:
                'Nothing here knows the brand. Rebranding is a config change, not a refactor.',
            },
          ]}
        />

        <ComparisonTable
          eyebrow="At a glance"
          heading="How the plans compare"
          description="The same comparison block, retinted by the active brand. Featured column, checks, and pricing all track the accent."
          columns={[
            { name: 'Scale', subtitle: '$99/mo', featured: true, badge: 'Most popular' },
            { name: 'Team', subtitle: '$49/mo' },
            { name: 'Starter', subtitle: 'Free' },
          ]}
          rows={[
            { label: 'Seats included', values: ['Unlimited', '10', '2'] },
            { label: 'Custom domains', values: [true, true, false] },
            { label: 'Brand presets', values: [true, true, true] },
            { label: 'Priority support', values: [true, false, false] },
            { label: 'SSO & SAML', values: [true, false, false] },
            { label: 'Audit log', values: [true, true, false] },
          ]}
        />

        <section className="bg-background py-16 sm:py-20">
          <Container>
            <CtaBanner
              eyebrow="Ready when you are"
              heading="Ship a fully-branded site in minutes"
              body="Pick a niche and a vibe, and the generator hands back a mature identity that paints the entire page."
              primaryLabel="Generate my brand"
              primaryHref="#"
              secondaryLabel="See the presets"
              secondaryHref="#"
            />
          </Container>
        </section>
      </main>
    </>
  )
}

function BrandLabel({ block }: { block: BrandBlock }): ReactNode {
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-5">
      <Award className="size-5 text-primary" strokeWidth={2} aria-hidden="true" />
      <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">
        {block.scope}
      </span>
      <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
        {block.vibeLabel}
      </span>
      <span className="text-sm text-muted-foreground">
        accent {block.brand.palette.primary} · {block.brand.fonts?.display} / {block.brand.fonts?.text} ·
        radius {block.brand.radius}rem · neutral {block.brand.palette.neutral}
      </span>
    </div>
  )
}

export default function BrandsProofPage() {
  // De-dupe and assemble all brand font hrefs so every scope's fonts load.
  const fontHrefs = Array.from(
    new Set(BLOCKS.map((b) => googleFontsHref(b.brand)).filter((h): h is string => Boolean(h))),
  )
  const css = BLOCKS.map((b) => scopedBrandCss(b.scope, b.brand)).join('')

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {fontHrefs.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="bg-background">
        {BLOCKS.map((block) => (
          <section key={block.scope} className={block.scope}>
            <div className="border-y border-border bg-muted/60">
              <BrandLabel block={block} />
            </div>
            <div className="bg-background text-foreground antialiased">
              <SampleStack brandName={block.brandName} />
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
