import Link from 'next/link'
import { cn } from '@/lib/cn'

/**
 * InlineCta — a compact, on-brand call-to-action for mid-content placement
 * (inside an article, between sections). Server component: a styled token-driven
 * block with a heading, optional body, and a single primary link. Recoloring the
 * brand recolors it via the semantic token classes.
 */

export type InlineCtaProps = {
  heading: string
  body?: string
  ctaLabel: string
  ctaHref: string
  variant?: 'solid' | 'subtle'
  className?: string
}

export function InlineCta({
  heading,
  body,
  ctaLabel,
  ctaHref,
  variant = 'subtle',
  className,
}: InlineCtaProps) {
  const solid = variant === 'solid'
  return (
    <aside
      className={cn(
        'my-10 flex flex-col items-start gap-4 rounded-xl px-6 py-7 sm:flex-row sm:items-center sm:justify-between',
        solid
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-muted/50 text-foreground',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-snug">{heading}</p>
        {body ? (
          <p
            className={cn(
              'mt-1 text-sm leading-relaxed',
              solid ? 'text-primary-foreground/85' : 'text-muted-foreground',
            )}
          >
            {body}
          </p>
        ) : null}
      </div>
      <Link
        href={ctaHref}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          solid
            ? 'bg-background text-foreground hover:bg-background/90 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary focus-visible:ring-offset-background',
        )}
      >
        {ctaLabel}
      </Link>
    </aside>
  )
}
