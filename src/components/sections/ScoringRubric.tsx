import { Container } from '@/components/ui/Container'

/**
 * ScoringRubric — the "comparison-data" band (DESIGN.md §5). Visualizes the
 * space-first scorecard with the hand-drawn circle-fill score rings called for
 * in DESIGN.md §2 (reference notes). Static brand methodology, not CMS content.
 * The `--score` custom property (1–10) drives each ring's conic fill.
 */
type Criterion = { name: string; score: number; note: string }

const CRITERIA: Criterion[] = [
  { name: 'Footprint', score: 9, note: 'Floor + folded-away storage in real apartments' },
  { name: 'Build', score: 8, note: 'Wobble, welds, and load tolerance under real reps' },
  { name: 'Value', score: 9, note: 'Dollars per usable feature, not sticker price' },
  { name: 'Noise', score: 7, note: 'What the neighbors below actually hear' },
]

export function ScoringRubric() {
  return (
    <section id="how-we-score" className="grid-paper border-y-2 border-ink py-20 sm:py-28 scroll-mt-16">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* explainer */}
          <div className="max-w-xl">
            <span className="stamp-label">How we score</span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Every verdict is <span className="marker">earned</span>, not borrowed.
            </h2>
            <div className="skew-rule mt-5 w-24" aria-hidden="true" />
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              We run each machine through the same seven-point rubric, weighted for small-space
              living. No merchant copy, no rounded-up stars — just what holds up when your gym
              shares a wall with your bed.
            </p>
          </div>

          {/* the score rings */}
          <ul className="grid grid-cols-2 gap-6 list-none pl-0">
            {CRITERIA.map((c) => (
              <li key={c.name} className="raw-card flex flex-col items-start gap-4 p-6">
                <div
                  className="score-ring"
                  style={{ ['--score' as string]: c.score }}
                  aria-hidden="true"
                >
                  <span>{c.score}</span>
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                    {c.name}{' '}
                    <span className="text-base text-ink-soft">· {c.score}/10</span>
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
