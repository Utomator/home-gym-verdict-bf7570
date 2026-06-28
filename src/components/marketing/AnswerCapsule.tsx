import { Sparkles } from 'lucide-react'

/**
 * "Quick answer" capsule — renders the curated aeo.answerSummary as a visually +
 * semantically DISTINCT block (its own <section id="quick-answer"> with a label),
 * not just a styled subtitle. This is the prime extraction target for Google AI
 * Overviews / featured snippets / LLM answer engines, and the stable #quick-answer
 * id is a ready hook for a future speakable selector. Returns null when empty.
 */
export function AnswerCapsule({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <section
      id="quick-answer"
      aria-label="Quick answer"
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04] p-6 shadow-sm sm:p-7"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="size-4" strokeWidth={2} />
        Quick answer
      </p>
      <p className="mt-3 text-lg leading-relaxed text-pretty text-foreground">{text}</p>
    </section>
  )
}
