import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Accessible FAQ accordion built on the native <details>/<summary> disclosure
 * pattern, so it is fully keyboard-operable and works with zero client-side
 * JavaScript (renders as a React server component). Token-driven and
 * self-contained.
 *
 * Each item uses the same `name` so the group behaves like a single-open
 * accordion (native HTML exclusive-disclosure behavior).
 */

export type FaqItem = {
  question: string
  answer: string
}

export type FaqAccordionProps = {
  items: FaqItem[]
  /** Shared group name; items sharing a name auto-collapse siblings. */
  name?: string
  className?: string
}

export function FaqAccordion({ items, name = 'faq', className }: FaqAccordionProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {items.map((item) => (
        <details
          key={item.question}
          name={name}
          className="raw-card group px-6 py-1 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">
              {item.question}
            </span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded border-2 border-ink bg-seal-tint text-seal-deep transition-transform duration-200 group-open:rotate-45">
              <Plus width={18} height={18} strokeWidth={3} aria-hidden="true" />
            </span>
          </summary>
          <div className="pb-5 pr-12">
            <p className="max-w-[65ch] leading-relaxed text-ink-soft">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  )
}
