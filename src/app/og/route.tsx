import { brandedHeroSvg, type MediaPalette, svgToDataUri } from '@p51/engine'
import { ImageResponse } from 'next/og'
import siteConfig from '@/site.config'

/**
 * Dynamic OpenGraph card generator. Renders a BRANDED 1200×630 social image from
 * `?title=` (+ optional `?subtitle=` / `?site=`) — no AI image quota, no stored
 * asset. seoMeta() points here whenever a page has no uploaded hero/default image,
 * so EVERY shared URL ships a real, on-brand social card (imageless cards roughly
 * halve referral CTR; the large-image card ~doubles it).
 *
 * BRANDED, DETERMINISTICALLY: the card IS the engine's pure `brandedHeroSvg` —
 * the SAME generator the inline CodeGenHero fallback uses — embedded full-bleed
 * via a data-URI <img> and rasterised to PNG by Satori. The palette is derived
 * from the site brand (`siteConfig.brand.palette.primary`, exactly like
 * CodeGenHero); the engine fills secondary/accent/bg/fg from it. Same (title,
 * subtitle, site, brand) ⇒ byte-identical card, so the CDN cache below is sound.
 *
 * NO DATABASE: the title/subtitle/site come entirely from the query string (the
 * caller's page metadata passes them) — there is NO Payload read here, so the
 * route renders identically at build time with no live DB. Do NOT add a DB query.
 *
 * Runs in the Node runtime (Fluid Compute) — `next/og` no longer needs edge.
 */
export const runtime = 'nodejs'

/**
 * Resolve the engine draw-palette partial from the site brand. Mirrors
 * CodeGenHero.brandMediaPalette: only `primary` is needed — the engine derives
 * the rest. Undefined ⇒ the engine's indigo default (matching globals.css), so
 * an unbranded site still gets a coherent card.
 */
function brandMediaPalette(): Partial<MediaPalette> | undefined {
  const primary = siteConfig.brand?.palette.primary
  return primary ? { primary } : undefined
}

export function GET(req: Request): Response {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') ?? 'Untitled').slice(0, 160)
  const subtitleRaw = searchParams.get('subtitle')?.slice(0, 160)
  // Prefer an explicit subtitle; otherwise surface the site name as the kicker so
  // the card still carries the brand even when no subtitle was passed.
  const site = searchParams.get('site')?.slice(0, 80) ?? undefined
  const subtitle = subtitleRaw || site

  // The branded card is the engine SVG embedded full-bleed. Same generator as the
  // inline hero ⇒ the social card and the on-page hero look identical + on-brand.
  const svg = brandedHeroSvg({
    title,
    subtitle,
    palette: brandMediaPalette(),
    width: 1200,
    height: 630,
  })

  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* biome-ignore lint/a11y/useAltText: Satori renders to a raster card; the alt lives on the og:image tag, not here. */}
      {/* biome-ignore lint/performance/noImgElement: Satori (next/og) JSX — rasterised server-side; next/image cannot run inside ImageResponse. */}
      <img src={svgToDataUri(svg)} width={1200} height={630} />
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        // Cards are deterministic per (title, subtitle, site, brand) → cache hard.
        'cache-control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    },
  )
}
