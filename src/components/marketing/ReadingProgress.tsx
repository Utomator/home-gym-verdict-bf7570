'use client'
import { useEffect, useState } from 'react'

/**
 * ReadingProgress — a thin, fixed top progress bar that fills as the reader
 * scrolls the page. Scroll-driven, "use client". Purely decorative chrome, so
 * it is aria-hidden (the value is also exposed via a visually-hidden
 * progressbar role for AT users who want it). Token-driven fill color (brand).
 *
 * Cheap: a single passive scroll/resize listener updating one CSS scaleX via a
 * rAF-throttled state write. No layout thrash, no dependency.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0
      setProgress(pct)
    }
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1"
    >
      <div
        className="h-full origin-left bg-primary transition-transform duration-75 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
