import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Card — the linked content card for affiliate hub grids (blog feed, authors,
 * search results). Token-driven surface: bordered bg-card panel with a subtle
 * shadow, a brand-accent hover lift, an optional eyebrow, a title that turns
 * brand-colored on hover, a clamped body, and a quiet meta footer. The whole
 * card is one link target. Props + behavior unchanged.
 */
type Props = {
  href: string
  eyebrow?: string
  title: string
  body?: string
  meta?: string
  children?: ReactNode
}

export function Card({ href, eyebrow, title, body, meta, children }: Props) {
  return (
    <article className="group h-full">
      <Link
        href={href}
        className={cn(
          'flex h-full flex-col rounded-xl border border-border bg-card p-6 no-underline',
          'shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <h3
          className={cn(
            'text-lg font-semibold leading-snug tracking-tight text-card-foreground transition-colors group-hover:text-primary',
            eyebrow ? 'mt-2' : '',
          )}
        >
          {title}
        </h3>
        {body ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        ) : null}
        {children}
        {meta ? <p className="mt-4 text-xs font-medium text-muted-foreground">{meta}</p> : null}
      </Link>
    </article>
  )
}

type EmptyProps = {
  message: string
}

export function EmptyState({ message }: EmptyProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
