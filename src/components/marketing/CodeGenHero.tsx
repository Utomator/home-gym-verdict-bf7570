import { type BrandedHeroOptions, brandedHeroSvg, type MediaPalette } from '@p51/engine'
import { cn } from '@/lib/cn'
import siteConfig from '@/site.config'

/**
 * CodeGenHero — the Tier-1 (zero-API-key) HERO FALLBACK.
 *
 * Renders the engine's pure `brandedHeroSvg` as an inline, on-brand geometric
 * hero whenever a doc has NO uploaded heroImage. This closes the "no image" gap
 * so EVERY post/page ships a real, branded visual — visuals lift dwell/
 * engagement (a ranking signal), feed Google Images, and give the page an
 * og:image source.
 *
 * SSR-SAFE: the SVG is a deterministic, self-generated string (no canvas, no
 * client APIs). `dangerouslySetInnerHTML` is acceptable here because the markup
 * is OUR OWN escaped output — `brandedHeroSvg` XML-escapes every interpolated
 * value (title/subtitle), so there is no user-controlled injection surface.
 *
 * The palette comes from the site brand (`siteConfig.brand.palette.primary`);
 * the engine fills the rest of the draw palette deterministically. When the
 * site is unbranded this falls back to the indigo default (matching globals.css).
 */
type Props = {
  /** Headline — the post/page title. Drives both the visual + the layout seed. */
  title: string
  /** Optional supporting line (e.g. an excerpt) rendered under the title. */
  subtitle?: string
  /** Stable layout seed; defaults to the title so each doc looks distinct. */
  seed?: string
  /** Render size. Defaults to the 1200×630 og card ratio. */
  width?: number
  height?: number
  /** Per-call palette override (rarely needed; defaults to the site brand). */
  palette?: Partial<MediaPalette>
  className?: string
}

/**
 * Resolve the engine draw-palette partial from the site brand. Only `primary`
 * is required — the engine derives secondary/accent/bg/fg from it. We pass the
 * brand primary (undefined ⇒ engine's indigo default).
 */
function brandMediaPalette(): Partial<MediaPalette> | undefined {
  const primary = siteConfig.brand?.palette.primary
  return primary ? { primary } : undefined
}

export function CodeGenHero({ title, subtitle, seed, width, height, palette, className }: Props) {
  const opts: BrandedHeroOptions = {
    title,
    subtitle,
    seed,
    width,
    height,
    palette: palette ?? brandMediaPalette(),
  }
  const svg = brandedHeroSvg(opts)
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-muted shadow-md',
        '[&>svg]:block [&>svg]:h-auto [&>svg]:w-full',
        className,
      )}
      // Trusted, self-generated, XML-escaped SVG string (see component docblock).
      // biome-ignore lint/security/noDangerouslySetInnerHtml: our own deterministic, escaped SVG — not user input
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
