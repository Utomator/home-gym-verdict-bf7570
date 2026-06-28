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
            <span className="stamp-label mx-auto">{eyebrow}</span>
          ) : null}
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {heading}
          </h2>
          {description ? (
            <p className="mx-auto mt-5 max-w-prose text-pretty text-lg leading-relaxed text-ink-soft">
              {description}
            </p>
          ) : null}
        </div>

        <ul className={cn('mt-16 grid list-none grid-cols-1 gap-6 pl-0', COLS[columns])}>
          {features.map((feature, i) => {
            const Icon = resolveIcon(feature.icon)
            return (
              <li key={feature.title} className="raw-card raw-card-hover group p-6">
                <span
                  className={cn(
                    'inline-flex size-12 items-center justify-center rounded border-2 border-ink',
                    i % 2 === 0 ? 'bg-brand-tint text-brand-deep' : 'bg-seal-tint text-seal-deep',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-6" strokeWidth={2.5} />
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{feature.description}</p>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
