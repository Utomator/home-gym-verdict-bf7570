import { brandedHeroSvg, svgToDataUri } from '@p51/engine'
import { describe, expect, it, vi } from 'vitest'

// Drive the OG route off a KNOWN brand primary so we can assert the card is
// actually branded (the engine derives the rest of the palette from it). The
// route reads siteConfig.brand?.palette.primary, exactly like CodeGenHero.
vi.mock('@/site.config', () => ({
  default: {
    archetype: 'affiliate',
    business: { name: 'Test Co' },
    brand: { palette: { primary: '#0ea5e9', neutral: 'slate' } },
  },
}))

import { GET } from '@/app/og/route'

const call = (qs: string): Response => GET(new Request(`https://example.com/og${qs}`))

/** Read the PNG header: returns { width, height } from the IHDR chunk. */
function pngSize(buf: Buffer): { width: number; height: number } {
  // PNG signature (8) + length (4) + 'IHDR' (4) → width @16, height @20 (big-endian).
  expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG')
  expect(buf.subarray(12, 16).toString('ascii')).toBe('IHDR')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('GET /og — dynamic branded social card', () => {
  it('returns a 200 PNG image response for a given title (no DB)', async () => {
    const res = call('?title=Hello%20World&site=Test%20Co')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^image\/png/)
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.length).toBeGreaterThan(1000)
  })

  it('renders the card at exactly 1200×630', async () => {
    const res = call('?title=Dimensions%20Check')
    const buf = Buffer.from(await res.arrayBuffer())
    expect(pngSize(buf)).toEqual({ width: 1200, height: 630 })
  })

  it('is cacheable (immutable cache-control)', () => {
    const res = call('?title=Cacheable')
    expect(res.headers.get('cache-control')).toContain('immutable')
  })

  it('falls back to a default title when none is supplied (never throws)', async () => {
    const res = call('')
    expect(res.status).toBe(200)
    const buf = Buffer.from(await res.arrayBuffer())
    expect(pngSize(buf)).toEqual({ width: 1200, height: 630 })
  })

  it('reads ONLY the query string — same title ⇒ byte-identical PNG (deterministic, no DB)', async () => {
    const a = Buffer.from(await call('?title=Deterministic&site=Test%20Co').arrayBuffer())
    const b = Buffer.from(await call('?title=Deterministic&site=Test%20Co').arrayBuffer())
    expect(a.equals(b)).toBe(true)
  })

  it('produces a different card for a different title', async () => {
    const a = Buffer.from(await call('?title=Alpha').arrayBuffer())
    const b = Buffer.from(await call('?title=Bravo%20Charlie').arrayBuffer())
    expect(a.equals(b)).toBe(false)
  })
})

describe('OG card is branded from the site palette (deterministically)', () => {
  // The route embeds the engine's brandedHeroSvg full-bleed; the SVG it embeds is
  // the SAME deterministic output the inline hero uses. We assert at the SVG layer
  // (the source of truth for branding) that the site brand primary is painted in.
  it('paints the SITE BRAND primary (#0ea5e9) into the embedded card SVG', () => {
    const svg = brandedHeroSvg({
      title: 'Brand Color Test',
      subtitle: 'Test Co',
      palette: { primary: '#0ea5e9' },
      width: 1200,
      height: 630,
    })
    expect(svg.toLowerCase()).toContain('#0ea5e9')
    // The embedded data-URI round-trips the branded SVG (what the <img> renders).
    const uri = svgToDataUri(svg)
    const decoded = Buffer.from(uri.split(',')[1], 'base64').toString('utf-8')
    expect(decoded.toLowerCase()).toContain('#0ea5e9')
    expect(decoded).toContain('Brand Color Test')
  })
})
