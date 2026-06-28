import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Drive CodeGenHero off a KNOWN brand primary so we can assert the brand color is
// actually painted into the generated SVG. The component reads
// siteConfig.brand?.palette.primary; the engine derives the rest of the palette.
vi.mock('@/site.config', () => ({
  default: {
    archetype: 'affiliate',
    business: { name: 'Test Co' },
    brand: { palette: { primary: '#0ea5e9', neutral: 'slate' } },
  },
}))

import { CodeGenHero } from '@/components/marketing/CodeGenHero'

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(CodeGenHero, props as never))

describe('CodeGenHero component', () => {
  afterEach(() => vi.clearAllMocks())

  it('renders an inline branded SVG hero containing the title', () => {
    const html = render({ title: 'The Best Standing Desks of 2026' })
    // The figure wraps a real, inline <svg> (not an <img> / data URI).
    expect(html).toContain('<figure')
    expect(html).toContain('<svg')
    expect(html).toContain('role="img"')
    // The title is rendered as visible text inside the SVG.
    expect(html).toContain('The Best Standing Desks of 2026')
  })

  it('paints the SITE BRAND primary color into the generated hero', () => {
    const html = render({ title: 'Brand Color Test' })
    // The brand primary (#0ea5e9) seeds the gradient/background fill.
    expect(html.toLowerCase()).toContain('#0ea5e9')
  })

  it('renders the optional subtitle when provided', () => {
    const html = render({ title: 'Main Title', subtitle: 'A helpful supporting line' })
    expect(html).toContain('A helpful supporting line')
  })

  it('is deterministic — same title ⇒ byte-identical hero markup', () => {
    const a = render({ title: 'Deterministic Output' })
    const b = render({ title: 'Deterministic Output' })
    expect(a).toBe(b)
  })

  it('produces distinct decorative layouts for different titles', () => {
    const a = render({ title: 'Alpha' })
    const b = render({ title: 'Bravo Charlie Delta' })
    expect(a).not.toBe(b)
  })

  it('XML-escapes a hostile title (no raw <script> injection)', () => {
    const html = render({ title: '<script>alert(1)</script> Hijack' })
    // The angle brackets of the injected tag are escaped inside the SVG text.
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
