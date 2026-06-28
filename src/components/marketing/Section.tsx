import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * Section — a titled content band for the affiliate content hub.
 *
 * Renders an eyebrow + heading + optional lede header row with an optional CTA
 * aligned to the end, then the section body (e.g. a Card grid) below. Generous
 * vertical rhythm, token-driven surfaces, and a `soft` variant that tints the
 * band with the muted surface. Props + behavior unchanged.
 */
type Props = {
  eyebrow?: string
  heading: string
  lede?: string
  ctaLabel?: string
  ctaHref?: string
  children: ReactNode
  variant?: 'default' | 'soft'
}

export function Section({
  eyebrow,
  heading,
  lede,
  ctaLabel,
  ctaHref,
  children,
  variant = 'default',
}: Props) {
  return (
    <section className={cn('py-20 sm:py-28', variant === 'soft' ? 'bg-muted/40' : 'bg-background')}>
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {heading}
            </h2>
            {lede ? (
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                {lede}
              </p>
            ) : null}
          </div>
          {ctaLabel && ctaHref ? (
            <Button href={ctaHref} variant="outline" size="md" className="shrink-0">
              {ctaLabel}
            </Button>
          ) : null}
        </div>

        <div className="mt-12">{children}</div>
      </Container>
    </section>
  )
}
