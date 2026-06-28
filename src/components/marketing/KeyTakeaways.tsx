import { Check } from 'lucide-react'

type Takeaway = { point?: string | null; id?: string | null }

/**
 * Renders aeo.keyTakeaways as a visible, scannable block near the top of a post.
 * This is the single highest-leverage AEO win — bulleted answers are exactly what
 * featured snippets and AI Overviews extract. Returns null when there are none.
 */
export function KeyTakeaways({ items }: { items?: Takeaway[] | null }) {
  const points = (items ?? [])
    .map((i) => ({ point: i?.point, id: i?.id }))
    .filter((i): i is { point: string; id: string | null | undefined } => Boolean(i.point))
  if (points.length === 0) return null
  return (
    <aside
      aria-label="Key takeaways"
      className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-7"
    >
      <h2 className="text-base font-semibold tracking-tight text-card-foreground">Key takeaways</h2>
      <ul className="mt-4 grid list-none gap-3 pl-0">
        {points.map((item) => (
          <li
            key={item.id ?? item.point}
            className="flex items-start gap-3 text-pretty leading-relaxed text-foreground"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
            <span>{item.point}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
