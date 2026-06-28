import { Award } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ComparisonTable } from '@/components/sections/ComparisonTable'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { FaqAccordion } from '@/components/sections/FaqAccordion'
import { FeatureGrid } from '@/components/sections/FeatureGrid'
import { HeroSplit } from '@/components/sections/HeroSplit'
import { ProductCard } from '@/components/sections/ProductCard'
import { SiteFooter } from '@/components/sections/SiteFooter'
import { SiteHeader } from '@/components/sections/SiteHeader'
import { StatsBand } from '@/components/sections/StatsBand'
import { Stars } from '@/components/ui/Stars'
import { Testimonial } from '@/components/sections/Testimonial'

/**
 * Standalone DESIGN PROOF — a realistic affiliate landing page ("Best Robot
 * Vacuums 2026") assembled from the section blocks with hardcoded sample
 * content. No database, no CMS, no env. Renders under the (preview) root layout.
 *
 * A sample BRAND THEME is applied at the preview scope via the token vars
 * (one teal accent + the Space Grotesk / Inter pairing wired in the layout), so
 * the whole token cascade recolors the entire page from one place — proving the
 * everything-themeable claim.
 */

const BRAND = 'VacuumVerdict'

const NAV = [
  { label: 'Reviews', href: '#reviews' },
  { label: 'Comparison', href: '#comparison' },
  { label: 'Buying Guide', href: '#guide' },
  { label: 'FAQ', href: '#faq' },
]

// A neutral product mock served as inline SVG so the proof needs zero network.
const heroImage = (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='38%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%23e7f6f1'/%3E%3Cstop offset='100%25' stop-color='%23d2ece4'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='300' r='150' fill='%231a1a1f' opacity='0.92'/%3E%3Ccircle cx='400' cy='300' r='150' fill='none' stroke='%230d9488' stroke-width='10'/%3E%3Ccircle cx='400' cy='300' r='52' fill='%230d9488'/%3E%3Ccircle cx='400' cy='300' r='22' fill='%23e7f6f1'/%3E%3Crect x='250' y='150' width='110' height='14' rx='7' fill='%231a1a1f' opacity='0.18'/%3E%3C/svg%3E"
    alt="Flagship robot vacuum, top-down product render"
    className="aspect-[4/3] w-full object-cover"
  />
)

// Self-contained inline-SVG product mock (top-down robot vacuum) so the proof
// renders identically with zero network. `tone` shifts the body shade per card.
function productImage(tone: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450'><rect width='600' height='450' fill='%23eef6f3'/><circle cx='300' cy='225' r='118' fill='${tone}'/><circle cx='300' cy='225' r='118' fill='none' stroke='%230d9488' stroke-width='8'/><circle cx='300' cy='225' r='40' fill='%230d9488'/><circle cx='300' cy='225' r='16' fill='%23eef6f3'/><rect x='196' y='120' width='84' height='10' rx='5' fill='%231c1c22' opacity='0.14'/></svg>`
  return `data:image/svg+xml;utf8,${svg}`
}

export default function DesignPreviewPage() {
  return (
    <>
      {/* Sample brand theme: override the token layer at the preview scope.
          One teal accent on a warm-neutral foundation, AA-contrast, plus the
          font pairing wired to the display/text token vars. */}
      <style>{`
        .preview-root {
          /* reset the clean-slate document defaults from globals.css */
          max-width: none;
          margin: 0;
          padding: 0;
          font-family: var(--font-sans);
          line-height: 1.5;
          color: var(--foreground);
          background: var(--background);
        }
        /* globals.css applies a raw "a { text-decoration: underline }" after the
           Tailwind utilities in source order, so it beats no-underline. Re-assert
           the component intent inside the preview scope: links style their own
           decoration via utilities, default to none. */
        .preview-root a {
          text-decoration: none;
        }
        .preview-theme {
          --background: #ffffff;
          --foreground: #1c1c22;

          --card: #ffffff;
          --card-foreground: #1c1c22;

          --muted: #f3f5f4;
          --muted-foreground: #5b6360;

          --accent: #eef6f3;
          --accent-foreground: #14342c;

          /* ONE brand accent — deep teal (Radix teal-style ramp anchor). */
          --primary: #0d9488;
          --primary-foreground: #ffffff;

          --secondary: #f0f3f2;
          --secondary-foreground: #283231;

          --border: #e4e8e6;
          --input: #e4e8e6;
          --ring: #0d9488;

          --radius: 0.75rem;

          --shadow-sm: 0 1px 2px 0 rgb(20 52 44 / 0.05);
          --shadow-md: 0 6px 18px -4px rgb(20 52 44 / 0.10);
          --shadow-lg: 0 18px 40px -12px rgb(20 52 44 / 0.16);

          --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
          --font-display: var(--font-space-grotesk), var(--font-inter), ui-sans-serif, sans-serif;
          font-family: var(--font-sans);
        }
      `}</style>

      <div className="preview-theme min-h-screen bg-background text-foreground antialiased">
        <SiteHeader
          brandName={BRAND}
          navItems={NAV}
          cta={{ label: 'See Top Pick', href: '#reviews' }}
        />

        <main>
          <HeroSplit
            eyebrow="Updated June 2026 · 140 hours tested"
            title={
              <>
                The Best Robot Vacuums of <span className="text-primary">2026</span>
              </>
            }
            lede="We bought and ran 23 robot vacuums across hardwood, tile, and high-pile rugs for six weeks straight — measuring suction, mapping accuracy, and how well they actually empty themselves. These five earned the buy."
            primaryCta={{ label: 'See our #1 pick', href: '#reviews' }}
            secondaryCta={{ label: 'Compare all five', href: '#comparison' }}
            footnote={
              <div className="flex items-center gap-3">
                <Stars rating={4.8} size={16} showValue />
                <span>Trusted by 80,000+ readers this year</span>
              </div>
            }
            image={heroImage}
          />

          <StatsBand
            stats={[
              { value: '23', label: 'Models bought & tested' },
              { value: '140+', label: 'Hours of real runtime' },
              { value: '6', label: 'Floor types measured' },
              { value: '4.9/5', label: 'Average reader rating' },
            ]}
          />

          <section id="comparison">
            <ComparisonTable
              eyebrow="At a glance"
              heading="How the top picks compare"
              description="Every model we recommend, side by side. The features that actually move the needle on day-to-day cleaning — not spec-sheet padding."
              columns={[
                { name: 'RoboVac Omni X', subtitle: '$899', featured: true, badge: 'Best overall' },
                { name: 'CleanPath Pro', subtitle: '$549' },
                { name: 'BudgetBot S2', subtitle: '$279' },
              ]}
              rows={[
                { label: 'Suction power', values: ['8,000 Pa', '5,200 Pa', '2,700 Pa'] },
                { label: 'LiDAR room mapping', values: [true, true, false] },
                { label: 'Self-emptying base', values: [true, true, false] },
                { label: 'Mopping included', values: [true, false, false] },
                { label: 'Obstacle avoidance', values: [true, true, false] },
                { label: 'App scheduling', values: [true, true, true] },
                { label: 'Battery (minutes)', values: ['180', '150', '110'] },
              ]}
            />
          </section>

          <div id="guide">
          <FeatureGrid
            eyebrow="Buying guide"
            heading="What we actually tested for"
            description="Marketing specs lie. These are the six things that separated the winners from the gadgets that ended up back in the box."
            columns={3}
            features={[
              {
                icon: 'Wind',
                title: 'Real suction, on real dirt',
                description:
                  'We weighed flour, oats, and pet hair before and after each pass instead of trusting the Pascal rating on the label.',
              },
              {
                icon: 'Map',
                title: 'Mapping accuracy',
                description:
                  'LiDAR units that built a clean floor plan in one run beat camera-only bots that bumped their way around for weeks.',
              },
              {
                icon: 'Bot',
                title: 'Obstacle avoidance',
                description:
                  'We left cables, socks, and (fake) pet messes out. The best models routed around all three without a smear.',
              },
              {
                icon: 'BatteryCharging',
                title: 'Battery & recharge-resume',
                description:
                  'Large homes need a bot that recharges mid-clean and picks up exactly where it left off. Most do not.',
              },
              {
                icon: 'Volume2',
                title: 'Noise level',
                description:
                  'Measured in dB at three feet. Anything you can run while on a call without muting scored highest here.',
              },
              {
                icon: 'ShieldCheck',
                title: 'Self-emptying reliability',
                description:
                  'A dock that clogs is worse than no dock. We ran 30 empty cycles per model and logged every jam.',
              },
            ]}
          />
          </div>

          <section id="reviews" className="bg-muted/40 py-20 sm:py-28">
            <Container>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Our top picks
                </p>
                <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Three vacuums worth your money
                </h2>
                <p className="mx-auto mt-4 max-w-prose text-pretty text-lg leading-relaxed text-muted-foreground">
                  Whatever your budget and floor plan, one of these three is the right call. Prices verified this week.
                </p>
              </div>

              <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                <ProductCard
                  name="RoboVac Omni X — best overall"
                  href="#"
                  rating={4.8}
                  reviewCount={3140}
                  summary="Flawless LiDAR mapping, an 8,000 Pa motor, and a self-emptying mop dock. The one to beat in 2026."
                  price="$899"
                  imageUrl={productImage('%231c1c22')}
                  imageAlt="RoboVac Omni X on hardwood"
                  badge="Editor's choice"
                  ctaLabel="Check price"
                />
                <ProductCard
                  name="CleanPath Pro — best value"
                  href="#"
                  rating={4.6}
                  reviewCount={1820}
                  summary="90% of the flagship experience for $350 less. Skips the mop, nails everything else that matters."
                  price="$549"
                  imageUrl={productImage('%232a2a31')}
                  imageAlt="CleanPath Pro docked"
                  badge="Best value"
                  ctaLabel="Check price"
                />
                <ProductCard
                  name="BudgetBot S2 — best under $300"
                  href="#"
                  rating={4.3}
                  reviewCount={4205}
                  summary="No mapping, no dock — but quiet, reliable, and genuinely good on bare floors for the money."
                  price="$279"
                  imageUrl={productImage('%23474750')}
                  imageAlt="BudgetBot S2 on tile"
                  ctaLabel="Check price"
                />
              </div>
            </Container>
          </section>

          <section className="bg-background py-20 sm:py-28">
            <Container size="default">
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1 text-sm font-medium text-foreground">
                  <Award className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
                  Reader story
                </span>
              </div>
              <div className="mx-auto mt-10 max-w-3xl">
                <Testimonial
                  quote="I'd returned two vacuums before finding this guide. Bought the CleanPath Pro on their recommendation and it's the first one my dog hasn't defeated. The mapping is genuinely uncanny."
                  authorName="Dana Whitfield"
                  authorRole="Verified buyer · Austin, TX"
                  rating={5}
                />
              </div>
            </Container>
          </section>

          <section id="faq" className="bg-muted/40 py-20 sm:py-28">
            <Container size="narrow">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</p>
                <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Before you buy
                </h2>
              </div>
              <div className="mt-12">
                <FaqAccordion
                  items={[
                    {
                      question: 'Do I really need the self-emptying dock?',
                      answer:
                        'If you have pets or run the vacuum daily, yes — it turns a daily chore into a monthly one. For a small apartment cleaned twice a week, you can skip it and save around $200.',
                    },
                    {
                      question: 'Is LiDAR mapping worth paying extra for?',
                      answer:
                        'For anything larger than a one-bedroom, absolutely. LiDAR bots map your home in a single run and clean in efficient straight lines, while cheaper camera bots bounce around and miss spots.',
                    },
                    {
                      question: 'How do these handle pet hair on rugs?',
                      answer:
                        'Our top two picks use anti-tangle rubber rollers that cleared long hair from high-pile rugs without wrapping. The BudgetBot needed a manual cleanout every few runs.',
                    },
                    {
                      question: 'How do you make money from this guide?',
                      answer:
                        'We earn a commission if you buy through our links, at no extra cost to you. We buy every unit we test with our own money and never accept payment for a ranking.',
                    },
                  ]}
                />
              </div>
            </Container>
          </section>

          <section className="bg-background py-20 sm:py-24">
            <Container>
              <CtaBanner
                eyebrow="Ready to decide?"
                heading="Get our #1 pick at this week's price"
                body="The RoboVac Omni X is on sale right now. We track the price daily so you don't overpay — tap through to today's verified deal."
                primaryLabel="See today's price"
                primaryHref="#"
                secondaryLabel="Read the full review"
                secondaryHref="#reviews"
              />
            </Container>
          </section>
        </main>

        <SiteFooter
          brandName={BRAND}
          description="Independent, hands-on reviews of home cleaning tech. We buy what we test."
          columns={[
            {
              title: 'Reviews',
              links: [
                { label: 'Robot vacuums', href: '#' },
                { label: 'Cordless vacuums', href: '#' },
                { label: 'Air purifiers', href: '#' },
              ],
            },
            {
              title: 'Guides',
              links: [
                { label: 'Buying guide', href: '#guide' },
                { label: 'How we test', href: '#' },
                { label: 'Deals', href: '#' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '#' },
                { label: 'Editorial policy', href: '#' },
                { label: 'Contact', href: '#' },
              ],
            },
          ]}
          legalLinks={[
            { label: 'Privacy', href: '#' },
            { label: 'Affiliate disclosure', href: '#' },
            { label: 'Terms', href: '#' },
          ]}
        />
      </div>
    </>
  )
}
