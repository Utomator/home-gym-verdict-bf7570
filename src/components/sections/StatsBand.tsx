import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

export type Stat = {
  /** The headline figure, e.g. "98%", "12k+", "4.9/5". */
  value: string
  label: string
  /** Optional supporting line under the label. */
  hint?: string
}

export type StatsBandProps = {
  eyebrow?: string
  heading?: string
  stats: Stat[]
  /** "muted" sits on a tinted panel; "solid" inverts onto the brand color. */
  variant?: 'muted' | 'solid'
  className?: string
}

/**
 * StatsBand — a compact band of proof-point figures.
 * Token-driven; the "solid" variant inverts onto the brand primary.
 */
export function StatsBand({
  eyebrow,
  heading,
  stats,
  variant = 'muted',
  className,
}: StatsBandProps) {
  const solid = variant === 'solid'

  return (
    <section
      className={cn(
        'py-20 sm:py-24',
        solid ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        className,
      )}
    >
      <Container>
        {eyebrow || heading ? (
          <div className="mx-auto max-w-2xl text-center">
            {eyebrow ? (
              <p
                className={cn(
                  'text-sm font-semibold uppercase tracking-wide',
                  solid ? 'text-primary-foreground/80' : 'text-primary',
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            {heading ? (
              <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {heading}
              </h2>
            ) : null}
          </div>
        ) : null}

        <dl
          className={cn(
            'grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4',
            eyebrow || heading ? 'mt-16' : '',
          )}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-4xl font-bold tracking-tight sm:text-5xl">
                  {stat.value}
                </span>
                <span
                  className={cn(
                    'mt-3 block text-sm font-medium',
                    solid ? 'text-primary-foreground/90' : 'text-foreground',
                  )}
                >
                  {stat.label}
                </span>
                {stat.hint ? (
                  <span
                    className={cn(
                      'mt-1 block text-xs leading-relaxed',
                      solid ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {stat.hint}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
