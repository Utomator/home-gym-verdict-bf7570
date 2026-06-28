import { barChartSvg, type ChartDatum, comparisonBarsSvg, type MediaPalette } from '@p51/engine'
import { cn } from '@/lib/cn'
import siteConfig from '@/site.config'

/**
 * ChartBlock — renders the Pages `dataChart` block as a pure, on-brand SVG chart
 * (Tier-1 code-generated media, zero API key). A `bar` type renders the vertical
 * `barChartSvg`; a `comparison` type renders the horizontal `comparisonBarsSvg`
 * (good for "X vs Y" / ratings).
 *
 * SSR-SAFE + deterministic: the chart is a self-generated, XML-escaped SVG string
 * (the engine escapes every label/value), so `dangerouslySetInnerHTML` carries no
 * injection surface. No client/canvas APIs — renders identically on the server
 * with no live DB. Colors come from the site brand primary.
 */

/** One row of the `dataChart` block, as Payload stores it (depth-resolved). */
type ChartItem = { label?: string | null; value?: number | null; id?: string | null }

export type DataChartBlock = {
  title?: string | null
  /** 'bar' (vertical) | 'comparison' (horizontal). Defaults to 'bar'. */
  chartType?: ('bar' | 'comparison') | null
  items?: ChartItem[] | null
  /** Optional fixed max scale for the comparison type (e.g. 5 for ratings). */
  max?: number | null
}

/** Brand primary → engine palette partial (engine derives the rest). */
function brandMediaPalette(): Partial<MediaPalette> | undefined {
  const primary = siteConfig.brand?.palette.primary
  return primary ? { primary } : undefined
}

/** Keep only rows with a non-empty label + a finite numeric value. */
export function toChartData(items?: ChartItem[] | null): ChartDatum[] {
  return (items ?? [])
    .map((it) => ({ label: it?.label?.trim() ?? '', value: Number(it?.value) }))
    .filter((d) => Boolean(d.label) && Number.isFinite(d.value))
}

export function ChartBlock({ block, className }: { block: DataChartBlock; className?: string }) {
  const data = toChartData(block.items)
  // Nothing valid to plot ⇒ render nothing (don't emit an empty axis frame).
  if (data.length === 0) return null

  const palette = brandMediaPalette()
  const title = block.title?.trim() || undefined
  const svg =
    block.chartType === 'comparison'
      ? comparisonBarsSvg({ data, palette, title, max: block.max ?? undefined })
      : barChartSvg({ data, palette, title })

  return (
    <figure
      className={cn(
        'not-prose my-10 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm',
        '[&>svg]:block [&>svg]:h-auto [&>svg]:w-full',
        className,
      )}
      // Trusted, self-generated, XML-escaped SVG (engine escapes all labels/values).
      // biome-ignore lint/security/noDangerouslySetInnerHtml: our own deterministic, escaped SVG — not user input
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/**
 * RatingsChart — a value-add chart derived from an existing `productRoundup`
 * block's item ratings (no new CMS field, no extra DB read). Renders the items
 * as horizontal comparison bars on a fixed 0–5 scale so a roundup page gets a
 * scannable "at a glance" rating visual above/below the cards.
 */
export function RatingsChart({
  items,
  title = 'Ratings at a glance',
  className,
}: {
  items?: ({ name?: string | null; rating?: number | null } | null)[] | null
  title?: string
  className?: string
}) {
  const data: ChartDatum[] = (items ?? [])
    .map((it) => ({ label: it?.name?.trim() ?? '', value: Number(it?.rating) }))
    .filter((d) => Boolean(d.label) && Number.isFinite(d.value) && d.value > 0)

  // Need at least two rated items for a comparison to be meaningful.
  if (data.length < 2) return null

  const svg = comparisonBarsSvg({ data, palette: brandMediaPalette(), title, max: 5 })
  return (
    <figure
      className={cn(
        'not-prose my-10 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm',
        '[&>svg]:block [&>svg]:h-auto [&>svg]:w-full',
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: our own deterministic, escaped SVG — not user input
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
