import { Info } from 'lucide-react'

const DEFAULT_DISCLOSURE =
  'Some links in this post are affiliate links — we may earn a commission at no extra cost to you.'

/**
 * FTC-compliant affiliate disclosure block. Meant to sit ABOVE the first
 * affiliate link in a post so the relationship is disclosed "clearly and
 * conspicuously" before the reader acts on it (16 CFR Part 255). The content
 * pipeline injects this; a worker can't ship affiliate content without it.
 */
export function AffiliateDisclosure({ text }: { text?: string }) {
  return (
    <aside
      aria-label="Affiliate disclosure"
      className="flex items-start gap-3 rounded border-2 border-ink bg-seal-tint px-4 py-3 text-sm text-ink"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-seal-deep" strokeWidth={2.5} aria-hidden />
      <p className="leading-relaxed">{text || DEFAULT_DISCLOSURE}</p>
    </aside>
  )
}
