import { Check, ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ButtonReview } from '@/components/ui/ButtonReview'
import { Stars } from '@/components/ui/Stars'

/**
 * Editorial-style review card: a verdict-led layout with a prominent score,
 * a pros/cons split, and a single "where to buy" CTA. Token-driven and
 * self-contained — pass content via props; brand color flows from the
 * @theme token layer (no hardcoded brand hexes).
 */

export type ReviewCardProps = {
  title: string
  rating: number
  verdict: string
  pros?: string[]
  cons?: string[]
  ctaLabel?: string
  ctaHref: string
  badge?: string
  className?: string
}

export function ReviewCard({
  title,
  rating,
  verdict,
  pros = [],
  cons = [],
  ctaLabel = 'Where to buy',
  ctaHref,
  badge,
  className,
}: ReviewCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {badge ? (
              <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {badge}
              </span>
            ) : null}
            <h3 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {title}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 rounded-lg bg-muted px-3 py-2 text-right">
            <span className="text-2xl font-bold leading-none text-foreground tabular-nums">
              {rating.toFixed(1)}
            </span>
            <Stars rating={rating} size={13} />
          </div>
        </div>

        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{verdict}</p>
      </div>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
          {pros.length > 0 && (
            <div className="bg-card p-6 sm:p-8">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pros
              </h4>
              <ul className="flex flex-col gap-2.5 pl-0">
                {pros.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check
                      width={16}
                      height={16}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div className="bg-card p-6 sm:p-8">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cons
              </h4>
              <ul className="flex flex-col gap-2.5 pl-0">
                {cons.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <X
                      width={16}
                      height={16}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto border-t border-border p-6 sm:p-8">
        <ButtonReview
          href={ctaHref}
          variant="primary"
          size="lg"
          className="w-full"
          rel="nofollow sponsored"
        >
          {ctaLabel}
          <ExternalLink width={16} height={16} aria-hidden="true" />
        </ButtonReview>
      </div>
    </article>
  )
}
