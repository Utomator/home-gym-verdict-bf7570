import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

export type PricingTier = {
  name: string
  /** Price figure, e.g. "$29". Omit for "Custom" plans. */
  price?: string
  /** Cadence shown beside the price, e.g. "/mo". */
  period?: string
  description?: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  /** Marks this tier as the recommended one (visually elevated). */
  featured?: boolean
  /** Small ribbon text for the featured tier, e.g. "Most popular". */
  badge?: string
}

export type PricingTiersProps = {
  eyebrow?: string
  heading: string
  description?: string
  tiers: PricingTier[]
  className?: string
}

/**
 * PricingTiers — responsive pricing cards with one highlighted "best" tier.
 * Fully token-driven; the featured card lifts using the brand primary.
 */
export function PricingTiers({
  eyebrow,
  heading,
  description,
  tiers,
  className,
}: PricingTiersProps) {
  return (
    <section className={cn('bg-background py-20 sm:py-28', className)}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-prose text-pretty text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            'mx-auto mt-16 grid max-w-md grid-cols-1 items-start gap-6',
            'lg:max-w-5xl lg:grid-cols-3',
          )}
        >
          {tiers.map((tier) => {
            const featured = Boolean(tier.featured)
            return (
              <div
                key={tier.name}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-8',
                  featured
                    ? 'border-primary bg-card shadow-lg lg:-my-2 lg:py-10 ring-1 ring-primary'
                    : 'border-border bg-card shadow-sm',
                )}
              >
                {featured && tier.badge ? (
                  <span
                    className={cn(
                      'absolute -top-3 left-1/2 -translate-x-1/2',
                      'rounded-full bg-primary px-3 py-1 text-xs font-semibold',
                      'text-primary-foreground shadow-sm',
                    )}
                  >
                    {tier.badge}
                  </span>
                ) : null}

                <h3 className="text-lg font-semibold text-card-foreground">{tier.name}</h3>
                {tier.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>
                ) : null}

                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {tier.price ?? 'Custom'}
                  </span>
                  {tier.price && tier.period ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      {tier.period}
                    </span>
                  ) : null}
                </p>

                <Button
                  asChild
                  variant={featured ? 'primary' : 'outline'}
                  className="mt-8 w-full"
                >
                  <a href={tier.ctaHref}>{tier.ctaLabel}</a>
                </Button>

                <ul className="mt-8 space-y-3 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3 text-muted-foreground">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
