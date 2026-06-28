import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ButtonReview } from '@/components/ui/ButtonReview'
import { Stars } from '@/components/ui/Stars'

/**
 * Compact product card for affiliate grids/listicles. Optimized for scanning:
 * image, rank/badge, name, rating, one-line summary, price, and a single
 * "where to buy" CTA. Token-driven, responsive, self-contained.
 */

export type ProductCardProps = {
  name: string
  href: string
  rating: number
  reviewCount?: number
  summary?: string
  price?: string
  imageUrl?: string
  imageAlt?: string
  badge?: string
  ctaLabel?: string
  className?: string
}

export function ProductCard({
  name,
  href,
  rating,
  reviewCount,
  summary,
  price,
  imageUrl,
  imageAlt,
  badge,
  ctaLabel = 'Where to buy',
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt || name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {badge ? (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold leading-snug text-foreground">{name}</h3>
          <div className="flex items-center gap-2">
            <Stars rating={rating} size={14} showValue />
            {typeof reviewCount === 'number' ? (
              <span className="text-xs text-muted-foreground">
                ({reviewCount.toLocaleString()})
              </span>
            ) : null}
          </div>
        </div>

        {summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {price ? (
            <p className="text-lg font-bold text-foreground tabular-nums">{price}</p>
          ) : null}
          <ButtonReview
            href={href}
            variant="primary"
            size="md"
            className="w-full"
            rel="nofollow sponsored"
          >
            {ctaLabel}
            <ExternalLink width={15} height={15} aria-hidden="true" />
          </ButtonReview>
        </div>
      </div>
    </article>
  )
}
