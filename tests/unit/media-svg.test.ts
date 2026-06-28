import {
  barChartSvg,
  brandedHeroSvg,
  type ChartDatum,
  comparisonBarsSvg,
  type MediaPalette,
  resolveMediaPalette,
  svgToDataUri,
} from '@p51/engine'
import { describe, expect, it } from 'vitest'

/** A vivid, fully-specified palette so colour assertions are unambiguous. */
const PAL: MediaPalette = {
  primary: '#7c3aed', // violet
  secondary: '#1e3a8a', // navy
  accent: '#f59e0b', // amber
  bg: '#fffbea', // off-white
  fg: '#101014', // near-black
}

/** Assert a string is a single, well-formed, balanced SVG element. */
function expectWellFormedSvg(svg: string): void {
  expect(svg.startsWith('<svg')).toBe(true)
  expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  expect(svg).toContain('viewBox="0 0 ')
  // Balanced root tags.
  expect((svg.match(/<svg[\s>]/g) ?? []).length).toBe(1)
  expect((svg.match(/<\/svg>/g) ?? []).length).toBe(1)
  // A11y: a <title> and <desc>, referenced by aria-labelledby.
  expect(svg).toContain('<title')
  expect(svg).toContain('<desc')
  expect(svg).toContain('aria-labelledby=')
  expect(svg).toContain('role="img"')
  // No accidental unescaped raw '&' (every & must start an entity).
  expect(/&(?!amp;|lt;|gt;|quot;|#\d+;)/.test(svg)).toBe(false)
}

describe('resolveMediaPalette', () => {
  it('fills every slot from just a primary', () => {
    const p = resolveMediaPalette({ primary: '#7c3aed' })
    expect(p.primary).toBe('#7c3aed')
    for (const v of Object.values(p)) {
      expect(v).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(p.bg).toBe('#ffffff')
  })

  it('defaults to the indigo brand when given nothing / garbage', () => {
    expect(resolveMediaPalette().primary).toBe('#4f46e5')
    expect(resolveMediaPalette({ primary: 'not-a-color' }).primary).toBe('#4f46e5')
  })

  it('normalises shorthand + drops the leading hash issues', () => {
    const p = resolveMediaPalette({ primary: '#0AF' })
    expect(p.primary).toBe('#00aaff')
  })

  it('derives a readable fg from the bg (dark bg ⇒ white)', () => {
    expect(resolveMediaPalette({ primary: '#000', bg: '#111111' }).fg).toBe('#ffffff')
    expect(resolveMediaPalette({ primary: '#000', bg: '#ffffff' }).fg).toBe('#18181b')
  })

  it('honours explicit overrides for every slot', () => {
    const p = resolveMediaPalette(PAL)
    expect(p).toEqual(PAL)
  })

  it('is deterministic', () => {
    expect(resolveMediaPalette({ primary: '#7c3aed' })).toEqual(
      resolveMediaPalette({ primary: '#7c3aed' }),
    )
  })
})

describe('brandedHeroSvg', () => {
  const title = 'The Best Standing Desks of 2026'
  const svg = brandedHeroSvg({ title, subtitle: 'Tested & ranked', palette: PAL })

  it('returns a well-formed SVG', () => {
    expectWellFormedSvg(svg)
  })

  it('defaults to a 1200x630 og card', () => {
    expect(svg).toContain('viewBox="0 0 1200 630"')
    expect(svg).toContain('width="1200"')
    expect(svg).toContain('height="630"')
  })

  it('lays out the title and subtitle text', () => {
    expect(svg).toContain('Best Standing Desks')
    expect(svg).toContain('Tested &amp; ranked')
    // The full title is announced in the a11y <title>.
    expect(svg).toContain(`<title id=`)
    expect(svg).toContain('The Best Standing Desks of 2026')
  })

  it('paints with the supplied palette (gradient + accent)', () => {
    expect(svg).toContain(PAL.primary) // gradient start
    expect(svg).toContain(PAL.accent) // underline + accents
    expect(svg).toContain('<linearGradient')
  })

  it('is deterministic — same input twice ⇒ byte-identical', () => {
    expect(brandedHeroSvg({ title, subtitle: 'Tested & ranked', palette: PAL })).toBe(svg)
  })

  it('varies layout by seed (distinct but stable per title)', () => {
    const a = brandedHeroSvg({ title: 'Alpha guide', palette: PAL })
    const b = brandedHeroSvg({ title: 'Beta guide', palette: PAL })
    expect(a).not.toBe(b)
    // …but an explicit shared seed makes the decorative field identical.
    const s1 = brandedHeroSvg({ title: 'Alpha guide', palette: PAL, seed: 'fixed' })
    const s2 = brandedHeroSvg({ title: 'Alpha guide', palette: PAL, seed: 'fixed' })
    expect(s1).toBe(s2)
  })

  it('escapes hostile titles (no raw markup injection)', () => {
    const x = brandedHeroSvg({ title: '<script>"&', palette: PAL })
    expect(x).not.toContain('<script>')
    expect(x).toContain('&lt;script&gt;')
    expectWellFormedSvg(x)
  })

  it('honours a custom width/height (usable as an inline page hero)', () => {
    const wide = brandedHeroSvg({ title, palette: PAL, width: 1600, height: 500 })
    expect(wide).toContain('viewBox="0 0 1600 500"')
  })

  it('works from a partial palette (primary only)', () => {
    expectWellFormedSvg(brandedHeroSvg({ title, palette: { primary: '#0d9488' } }))
  })
})

describe('barChartSvg', () => {
  const data: ChartDatum[] = [
    { label: 'Jan', value: 120 },
    { label: 'Feb', value: 240 },
    { label: 'Mar', value: 180 },
  ]
  const svg = barChartSvg({ data, palette: PAL, title: 'Monthly visits' })

  it('returns a well-formed SVG', () => {
    expectWellFormedSvg(svg)
  })

  it('renders the title, every label and every value', () => {
    expect(svg).toContain('Monthly visits')
    for (const d of data) {
      expect(svg).toContain(d.label)
      expect(svg).toContain(`>${d.value}<`)
    }
  })

  it('uses the palette: bars in primary, the max bar in accent', () => {
    expect(svg).toContain(`fill="${PAL.primary}"`)
    expect(svg).toContain(`fill="${PAL.accent}"`) // Feb (240) is the max
    expect(svg).toContain(`fill="${PAL.bg}"`) // card background
  })

  it('is deterministic', () => {
    expect(barChartSvg({ data, palette: PAL, title: 'Monthly visits' })).toBe(svg)
  })

  it('a11y desc summarises the series', () => {
    expect(svg).toMatch(/<desc[^>]*>Jan: 120, Feb: 240, Mar: 180<\/desc>/)
  })

  it('handles empty + non-finite data without throwing or NaN', () => {
    const empty = barChartSvg({ data: [], palette: PAL })
    expectWellFormedSvg(empty)
    const bad = barChartSvg({ data: [{ label: 'x', value: Number.NaN }], palette: PAL })
    expectWellFormedSvg(bad)
    expect(bad).not.toContain('NaN')
  })
})

describe('comparisonBarsSvg', () => {
  const data: ChartDatum[] = [
    { label: 'Product A', value: 4.8 },
    { label: 'Product B', value: 3.2 },
    { label: 'Product C', value: 4.1 },
  ]
  const svg = comparisonBarsSvg({ data, palette: PAL, title: 'Rating', max: 5 })

  it('returns a well-formed SVG', () => {
    expectWellFormedSvg(svg)
  })

  it('renders each row label + value and the title', () => {
    expect(svg).toContain('Rating')
    for (const d of data) {
      expect(svg).toContain(d.label)
      expect(svg).toContain(`>${d.value}<`)
    }
  })

  it('accent-highlights the highest-rated row', () => {
    expect(svg).toContain(`fill="${PAL.accent}"`) // Product A (4.8) wins
    expect(svg).toContain(`fill="${PAL.primary}"`)
  })

  it('respects an explicit max scale (ratings out of 5)', () => {
    // With max=5, a 4.8 bar is nearly full but not overflowing — width stays sane.
    const widths = [...svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(widths.every((w) => Number.isFinite(w) && w >= 0)).toBe(true)
  })

  it('is deterministic', () => {
    expect(comparisonBarsSvg({ data, palette: PAL, title: 'Rating', max: 5 })).toBe(svg)
  })

  it('handles empty data', () => {
    expectWellFormedSvg(comparisonBarsSvg({ data: [], palette: PAL }))
  })
})

describe('svgToDataUri', () => {
  it('wraps an SVG into a base64 data URL that round-trips', () => {
    const svg = brandedHeroSvg({ title: 'Roundtrip', palette: PAL })
    const uri = svgToDataUri(svg)
    expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true)
    const decoded =
      typeof atob === 'function'
        ? decodeURIComponent(escape(atob(uri.split(',')[1])))
        : Buffer.from(uri.split(',')[1], 'base64').toString('utf-8')
    expect(decoded).toBe(svg)
  })

  it('is deterministic', () => {
    const svg = barChartSvg({ data: [{ label: 'a', value: 1 }], palette: PAL })
    expect(svgToDataUri(svg)).toBe(svgToDataUri(svg))
  })
})
