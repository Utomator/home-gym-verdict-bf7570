import { Container } from '@/components/ui/Container'

/**
 * TrustBar — a sturdy inked band of proof stats sitting directly under the hero.
 * Anti-polish: solid ink surface, display-font numerals, seal-colored figures.
 * Static brand scaffolding (no CMS content). Server component.
 */
export type TrustStat = { value: string; label: string }

const DEFAULT_STATS: TrustStat[] = [
  { value: '120+', label: 'Compact rigs tested' },
  { value: '< 8 ft²', label: 'Footprint we design for' },
  { value: '7-pt', label: 'Space-first scorecard' },
  { value: '0', label: 'Sponsored verdicts' },
]

export function TrustBar({ stats = DEFAULT_STATS }: { stats?: TrustStat[] }) {
  return (
    <section className="bg-ink text-white">
      <Container size="wide" className="py-8">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {stats.map((s) => (
            <li key={s.label} className="text-center sm:text-left">
              <p className="font-[family-name:var(--font-display)] text-4xl font-bold leading-none text-[color:var(--seal-tint)]">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-white/70">
                {s.label}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
