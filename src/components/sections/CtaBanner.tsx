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
        'rounded-2xl px-6 py-12 sm:px-12 sm:py-16',
        solid ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted text-foreground',
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-3">
          {eyebrow ? (
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                solid ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{heading}</h2>
          {body ? (
            <p
              className={cn(
                'mx-auto max-w-[60ch] text-base leading-relaxed',
                solid ? 'text-primary-foreground/85' : 'text-muted-foreground',
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
            variant={solid ? 'inverse' : 'primary'}
            className="w-full sm:w-auto"
          >
            {primaryLabel}
            <ArrowRight width={16} height={16} aria-hidden="true" />
          </ButtonReview>
          {secondaryLabel && secondaryHref ? (
            <ButtonReview
              href={secondaryHref}
              size="lg"
              variant="ghost"
              className={cn(
                'w-full sm:w-auto',
                solid && 'text-primary-foreground hover:bg-primary-foreground/10',
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
