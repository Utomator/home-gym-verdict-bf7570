import { ArrowRight, Ruler, Wallet, Wrench } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * HeroVerdict — the bespoke, art-directed hero for Home Gym Verdict.
 *
 * Realizes DESIGN.md §2/§6 (Anti-Polish / Raw Aesthetic): a charcoal-inked,
 * hard-shadowed image frame with a rotated burnt-orange "VERDICT" seal stamped
 * over the corner, a stamp-label eyebrow, a marker-highlighted display headline,
 * and a stamp-press primary CTA. Two-column on desktop, stacked on mobile.
 * Server component; all content via props.
 */
export type HeroVerdictProps = {
  eyebrow?: string
  title: string
  /** The word(s) in the title to wrap in the marker highlight. */
  highlight?: string
  lede?: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  image?: { url: string; alt: string }
  className?: string
}

const TRUST = [
  { icon: Ruler, label: 'Measured for square footage' },
  { icon: Wallet, label: 'Priced against the budget' },
  { icon: Wrench, label: 'Tested, not just unboxed' },
]

function withMarker(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) return title
  const [before, after] = title.split(highlight)
  return (
    <>
      {before}
      <span className="marker">{highlight}</span>
      {after}
    </>
  )
}

export function HeroVerdict({
  eyebrow,
  title,
  highlight,
  lede,
  primaryCta,
  secondaryCta,
  image,
  className,
}: HeroVerdictProps) {
  return (
    <section className={cn('relative isolate overflow-hidden border-b-2 border-ink', className)}>
      {/* tinted graph-paper backdrop, top portion only */}
      <div className="grid-paper absolute inset-x-0 top-0 -z-10 h-2/3" aria-hidden="true" />

      <Container size="wide" className="py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ── copy column ── */}
          <div>
            {eyebrow ? <span className="stamp-label">{eyebrow}</span> : null}

            <h1
              className={cn(
                'font-[family-name:var(--font-display)] font-bold tracking-tight text-ink',
                'text-5xl leading-[1.02] sm:text-6xl lg:text-7xl',
                eyebrow ? 'mt-6' : '',
              )}
            >
              {withMarker(title, highlight)}
            </h1>

            {lede ? (
              <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">{lede}</p>
            ) : null}

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={primaryCta.href}
                className={cn(
                  'btn-stamp inline-flex h-13 items-center justify-center gap-2 rounded border-2 border-ink',
                  'bg-seal px-7 font-[family-name:var(--font-display)] text-lg font-bold text-white no-underline',
                )}
              >
                {primaryCta.label}
                <ArrowRight className="size-5" strokeWidth={2.5} aria-hidden="true" />
              </a>
              {secondaryCta ? (
                <a
                  href={secondaryCta.href}
                  className={cn(
                    'inline-flex h-13 items-center justify-center rounded border-2 border-ink bg-background',
                    'px-7 font-[family-name:var(--font-display)] text-lg font-bold text-ink no-underline',
                    'transition-colors hover:bg-paper',
                  )}
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>

            {/* trust microcopy */}
            <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <span className="grid size-7 place-items-center rounded-full border-2 border-ink bg-brand-tint text-brand-deep">
                    <Icon className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ── image column ── */}
          <div className="relative">
            {image ? (
              <div className="raw-card relative overflow-hidden p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  width={1344}
                  height={756}
                  className="block aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : (
              <div className="raw-card grid aspect-[16/9] place-items-center bg-paper">
                <span className="font-[family-name:var(--font-display)] text-2xl text-ink-soft">
                  Home Gym Verdict
                </span>
              </div>
            )}

            {/* the stamped verdict seal */}
            <div className="verdict-seal absolute -bottom-7 -left-6 shadow-[var(--shadow-md)] sm:-left-8">
              <div>
                <span className="block text-[0.6rem] font-bold uppercase tracking-widest">
                  Honest
                </span>
                <span className="block text-xl font-bold leading-none">VERDICT</span>
                <span className="block text-[0.6rem] font-bold uppercase tracking-widest">
                  No fluff
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
