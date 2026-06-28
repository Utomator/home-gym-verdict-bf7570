import { Quote } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Stars } from '@/components/ui/Stars'

/**
 * Single testimonial / social-proof block. A quote-led card with optional
 * rating and an author identity row (avatar, name, role). Token-driven and
 * self-contained; brand color flows from the @theme layer.
 */

export type TestimonialProps = {
  quote: string
  authorName: string
  authorRole?: string
  avatarUrl?: string
  rating?: number
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Testimonial({
  quote,
  authorName,
  authorRole,
  avatarUrl,
  rating,
  className,
}: TestimonialProps) {
  return (
    <figure
      className={cn(
        'flex h-full flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8',
        className,
      )}
    >
      <Quote
        width={28}
        height={28}
        className="text-primary"
        strokeWidth={2}
        aria-hidden="true"
      />

      {typeof rating === 'number' ? <Stars rating={rating} size={16} /> : null}

      <blockquote className="flex-1">
        <p className="max-w-[65ch] text-lg leading-relaxed text-foreground">{quote}</p>
      </blockquote>

      <figcaption className="flex items-center gap-3 border-t border-border pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
              aria-hidden="true"
            />
          ) : (
            initials(authorName)
          )}
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{authorName}</span>
          {authorRole ? (
            <span className="text-sm text-muted-foreground">{authorRole}</span>
          ) : null}
        </span>
      </figcaption>
    </figure>
  )
}
