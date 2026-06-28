import type { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

export type Feature = {
  /** A lucide-react icon name, e.g. "Zap", "ShieldCheck", "Sparkles". */
  icon?: keyof typeof Icons
  title: string
  description: string
}

export type FeatureGridProps = {
  eyebrow?: string
  heading: string
  description?: string
  features: Feature[]
  /** Cards per row at the lg breakpoint. */
  columns?: 2 | 3 | 4
  className?: string
}

const COLS: Record<NonNullable<FeatureGridProps['columns']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

function resolveIcon(name?: keyof typeof Icons): LucideIcon {
  const fallback = Icons.Sparkles as unknown as LucideIcon
  if (!name) return fallback
  const candidate = Icons[name] as unknown as LucideIcon | undefined
  return candidate ?? fallback
}

/**
 * FeatureGrid — a token-driven grid of icon + title + text cards.
 * Recolors entirely from the semantic token layer (no hardcoded brand colors).
 */
export function FeatureGrid({
  eyebrow,
  heading,
  description,
  features,
  columns = 3,
  className,
}: FeatureGridProps) {
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

        <ul className={cn('mt-16 grid list-none grid-cols-1 gap-6 pl-0', COLS[columns])}>
          {features.map((feature) => {
            const Icon = resolveIcon(feature.icon)
            return (
              <li
                key={feature.title}
                className={cn(
                  'group rounded-xl border border-border bg-card p-6',
                  'shadow-sm transition-colors hover:border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-11 items-center justify-center rounded-lg',
                    'bg-primary/10 text-primary',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-5.5" strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-base font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
