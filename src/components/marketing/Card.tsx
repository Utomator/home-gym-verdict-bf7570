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
          'raw-card raw-card-hover flex h-full flex-col p-6 no-underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {eyebrow ? (
          <p className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-widest text-seal-deep">
            {eyebrow}
          </p>
        ) : null}
        <h3
          className={cn(
            'font-[family-name:var(--font-display)] text-xl font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand',
            eyebrow ? 'mt-2' : '',
          )}
        >
          {title}
        </h3>
        {body ? (
          <p className="mt-3 line-clamp-3 leading-relaxed text-ink-soft">{body}</p>
        ) : null}
        {children}
        {meta ? (
          <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <span className="h-px w-5 bg-ink" aria-hidden="true" />
            {meta}
          </p>
        ) : null}
      </Link>
    </article>
  )
}

type EmptyProps = {
  message: string
}

export function EmptyState({ message }: EmptyProps) {
  return (
    <div className="rounded border-2 border-dashed border-ink/40 bg-paper px-6 py-16 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg text-ink-soft">{message}</p>
    </div>
  )
}
