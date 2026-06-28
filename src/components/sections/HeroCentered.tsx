import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * HeroCentered — centered, single-column hero.
 *
 * Optional eyebrow badge, a large display headline, a constrained-measure lede,
 * and up to two CTAs. Generous vertical rhythm; everything token-driven and
 * content-via-props. Server component.
 */
export type HeroCta = { label: string; href: string }

export type HeroCenteredProps = {
  /** Small label above the headline (e.g. "New" or a category). */
  eyebrow?: string
  title: ReactNode
  /** Supporting sentence(s); rendered at a ~65ch measure. */
  lede?: ReactNode
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
  /** Optional slot under the CTAs (logos, rating, etc.). */
  footnote?: ReactNode
  className?: string
}

export function HeroCentered({
  eyebrow,
  title,
  lede,
  primaryCta,
  secondaryCta,
  footnote,
  className,
}: HeroCenteredProps) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-background', className)}>
      <Container size="default" className="py-24 text-center lg:py-32">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-3.5 py-1 text-sm font-medium text-foreground">
            {eyebrow}
          </span>
        ) : null}

        <h1
          className={cn(
            'mx-auto max-w-3xl font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground',
            'text-4xl leading-[1.1] sm:text-5xl lg:text-6xl',
            eyebrow ? 'mt-6' : '',
          )}
        >
          {title}
        </h1>

        {lede ? (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {lede}
          </p>
        ) : null}

        {primaryCta || secondaryCta ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primaryCta ? (
              <Button href={primaryCta.href} size="lg" className="w-full sm:w-auto">
                {primaryCta.label}
              </Button>
            ) : null}
            {secondaryCta ? (
              <Button
                href={secondaryCta.href}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
        ) : null}

        {footnote ? <div className="mt-8 text-sm text-muted-foreground">{footnote}</div> : null}
      </Container>
    </section>
  )
}
