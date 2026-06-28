import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Accessible star-rating display shared by the review section components.
 * Renders full / half / empty stars for a 0–5 `rating` and exposes the value
 * to assistive tech via an aria-label, so the visual stars are decorative.
 * Color comes from the brand token (`text-primary`) — recolor at the token
 * layer and every rating follows.
 */

type Props = {
  rating: number
  outOf?: number
  size?: number
  className?: string
  showValue?: boolean
}

export function Stars({ rating, outOf = 5, size = 16, className, showValue = false }: Props) {
  const clamped = Math.max(0, Math.min(outOf, rating))
  const full = Math.floor(clamped)
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75
  const roundedUp = clamped - full >= 0.75 ? 1 : 0

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`Rated ${clamped} out of ${outOf}`}
    >
      <span className="inline-flex items-center gap-0.5 text-primary" aria-hidden="true">
        {Array.from({ length: outOf }).map((_, i) => {
          const filled = i < full + roundedUp
          const half = !filled && hasHalf && i === full
          if (half) {
            return (
              <StarHalf
                key={i}
                width={size}
                height={size}
                className="fill-current"
                strokeWidth={1.5}
              />
            )
          }
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={filled ? 'fill-current' : 'fill-none text-muted-foreground/40'}
              strokeWidth={1.5}
            />
          )
        })}
      </span>
      {showValue ? (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {clamped.toFixed(1)}
        </span>
      ) : null}
    </span>
  )
}
