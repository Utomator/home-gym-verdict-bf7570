'use client'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { EmailCapture } from './EmailCapture'
import {
  dialogA11yProps,
  EXIT_INTENT_SESSION_KEY,
  isExitIntent,
  shouldArm,
} from './exit-intent-logic'

/**
 * ExitIntentModal — an accessible dialog shown ONCE PER SESSION when the reader
 * shows exit intent (cursor leaving through the top of the viewport on desktop,
 * or a decisive scroll-up on touch where mouseout never fires). It embeds an
 * EmailCapture so the last-chance moment converts to a subscriber.
 *
 * Accessibility (WAI-ARIA modal pattern):
 *   • role="dialog" + aria-modal + aria-labelledby (dialogA11yProps).
 *   • Focus moves into the dialog on open and is TRAPPED (Tab/Shift+Tab cycle).
 *   • Escape closes; closing restores focus to the previously-focused element.
 *   • Backdrop click + a labelled close button also dismiss.
 *
 * Once dismissed/shown it sets a sessionStorage flag so it won't re-arm this
 * session. "use client": depends on pointer/scroll + sessionStorage.
 */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

type Props = {
  heading?: string
  description?: string
  source?: string
  submitLabel?: string
}

export function ExitIntentModal({
  heading = 'Before you go…',
  description = 'Get our best posts in your inbox. No spam, unsubscribe anytime.',
  source = 'exit-intent',
  submitLabel = 'Subscribe',
}: Props) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    restoreFocusRef.current?.focus?.()
  }, [])

  // Arm the exit-intent triggers (desktop mouseout + touch scroll-up) once.
  useEffect(() => {
    let armed = false
    try {
      armed = shouldArm(window.sessionStorage.getItem(EXIT_INTENT_SESSION_KEY))
    } catch {
      armed = true
    }
    if (!armed) return

    const markShown = () => {
      try {
        window.sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, 'shown')
      } catch {
        // sessionStorage unavailable — in-memory only (component unmount resets).
      }
    }

    const trigger = () => {
      restoreFocusRef.current = document.activeElement as HTMLElement | null
      markShown()
      setOpen(true)
      cleanup()
    }

    const onMouseOut = (e: MouseEvent) => {
      if (isExitIntent({ clientY: e.clientY, relatedTarget: e.relatedTarget })) trigger()
    }

    // Touch fallback: a decisive upward scroll near the top of a scrolled page.
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < lastY - 40 && y < 200 && lastY > 240) trigger()
      lastY = y
    }

    const cleanup = () => {
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('scroll', onScroll)
    }

    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('scroll', onScroll, { passive: true })
    return cleanup
  }, [])

  // Focus management + Escape + focus-trap while open.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

    // Move focus into the dialog.
    const first = focusables()[0]
    ;(first ?? panel).focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — click to dismiss. aria-hidden; the dialog owns the semantics. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        {...dialogA11yProps(titleId)}
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl outline-none sm:p-8',
        )}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        <h2 id={titleId} className="text-xl font-bold tracking-tight text-foreground">
          {heading}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-5">
          <EmailCapture
            variant="inline"
            source={source}
            heading=""
            description=""
            submitLabel={submitLabel}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </div>
  )
}
