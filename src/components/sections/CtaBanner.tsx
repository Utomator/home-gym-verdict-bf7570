import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ButtonReview } from '@/components/ui/ButtonReview'

/**
 * Conversion-focused call-to-action banner. A single, high-contrast block with
 * one clear primary action (and an optional secondary link). Two surface
 * variants — `solid` (brand primary) and `subtle` (muted) — both driven
 * entirely by the @theme token layer, so recoloring the brand recolors the
 * banner. Self-contained and responsive.
 */

export type CtaBannerProps = {
  heading: string
  body?: string
  eyebrow?: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  variant?: 'solid' | 'subtle'
  className?: string
}

export function CtaBanner({
  heading,
  body,
  eyebrow,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  variant = 'solid',
  className,
}: CtaBannerProps) {
  const solid = variant === 'solid'

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded border-2 border-ink px-6 py-12 shadow-[var(--shadow-lg)] sm:px-12 sm:py-16',
        solid ? 'bg-brand text-white' : 'grid-paper text-ink',
        className,
      )}
    >
      {/* stamped accent block in the corner */}
      <div
        className="absolute -right-6 -top-6 size-24 rotate-12 rounded border-2 border-ink bg-seal/90"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-3">
          {eyebrow ? (
            <p
              className={cn(
                'font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-widest',
                solid ? 'text-white/80' : 'text-seal-deep',
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.05] sm:text-4xl">
            {heading}
          </h2>
          {body ? (
            <p
              className={cn(
                'mx-auto max-w-[60ch] text-lg leading-relaxed',
                solid ? 'text-white/90' : 'text-ink-soft',
              )}
            >
              {body}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <ButtonReview
            href={primaryHref}
            size="lg"
            className={cn(
              'btn-stamp w-full rounded border-2 border-ink bg-seal font-[family-name:var(--font-display)] text-lg font-bold text-white hover:bg-seal sm:w-auto',
            )}
          >
            {primaryLabel}
            <ArrowRight width={18} height={18} strokeWidth={2.5} aria-hidden="true" />
          </ButtonReview>
          {secondaryLabel && secondaryHref ? (
            <ButtonReview
              href={secondaryHref}
              size="lg"
              className={cn(
                'w-full rounded border-2 border-ink font-[family-name:var(--font-display)] text-lg font-bold sm:w-auto',
                solid
                  ? 'bg-white text-ink hover:bg-white/90'
                  : 'bg-background text-ink hover:bg-paper',
              )}
            >
              {secondaryLabel}
            </ButtonReview>
          ) : null}
        </div>
      </div>
    </section>
  )
}
