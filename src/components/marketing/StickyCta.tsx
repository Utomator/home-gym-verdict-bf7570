'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * StickyCta — a dismissible bottom CTA bar that appears after the reader scrolls
 * past a threshold. Dismissal persists in localStorage (per `storageKey`), so a
 * reader who closes it won't see it again on later visits. "use client" because
 * it depends on scroll position + localStorage.
 *
 * Driven by the brand CTA + a configurable headline. Token-driven surface
 * (brand primary) so it follows the site's brand.
 *
 * Accessibility: a labelled region; the dismiss control is a real <button> with
 * an accessible name; the CTA is a normal focusable link. SSR-safe — renders
 * nothing until mounted (no hydration mismatch from reading localStorage).
 */

type Props = {
  headline: string
  ctaLabel: string
  ctaHref: string
  /** Scroll distance in px before the bar appears. */
  showAfter?: number
  /** localStorage key for the dismissed flag. */
  storageKey?: string
}

export function StickyCta({
  headline,
  ctaLabel,
  ctaHref,
  showAfter = 600,
  storageKey = 'p51:sticky-cta-dismissed',
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    setMounted(true)
    let isDismissed = false
    try {
      isDismissed = window.localStorage.getItem(storageKey) === '1'
    } catch {
      // localStorage unavailable (private mode) — treat as not dismissed.
    }
    setDismissed(isDismissed)
    if (isDismissed) return

    const onScroll = () => setScrolledPast(window.scrollY > showAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [showAfter, storageKey])

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      // ignore persistence failure
    }
  }

  if (!mounted || dismissed || !scrolledPast) return null

  return (
    <section
      aria-label="Call to action"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-primary text-primary-foreground shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">{headline}</p>
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          {ctaLabel}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </section>
  )
}
