import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the heavy children so we can render ProductRoundup to static markup in the
// `node` test env without booting next/image's loader or the Payload Lexical
// react renderer. We only assert the roundup's OWN markup (CTAs, disclosure gate).
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', { src: props.src, alt: props.alt }),
}))
vi.mock('@/components/marketing/RichText', () => ({
  RichText: ({ data }: { data: unknown }) =>
    createElement('div', { 'data-richtext': data ? 'present' : 'empty' }),
}))
// env() is read by @/lib/env transitively via outboundRel's siteHost path only in
// RichText (mocked) — ProductRoundup itself only needs outboundRel, which is pure.
vi.mock('@/lib/env', () => ({ env: () => ({ NEXT_PUBLIC_SERVER_URL: 'https://example.com' }) }))

import { ProductRoundup } from '@/components/marketing/ProductRoundup'

const block = {
  intro: { root: { children: [] } } as never,
  items: [
    {
      id: 'i1',
      name: 'Acme Pro',
      affiliateUrl: 'https://go.example.com/acme?ref=p51',
      imageUrl: 'https://cdn.example.com/acme.jpg',
      rating: 4.6,
      price: '$129',
      badge: 'Best overall',
      pros: [{ value: 'Fast' }, { value: 'Reliable' }],
      cons: [{ value: 'Pricey' }],
      blurb: { root: { children: [] } } as never,
    },
    { id: 'i2', name: 'Budget Pick', affiliateUrl: 'https://go.example.com/budget' },
  ],
  verdict: { root: { children: [] } } as never,
}

describe('ProductRoundup component', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders each affiliate CTA with rel="sponsored nofollow" + safe new-tab attrs', () => {
    const html = renderToStaticMarkup(createElement(ProductRoundup, { block } as never))
    // Both items render an affiliate CTA.
    expect(html).toContain('href="https://go.example.com/acme?ref=p51"')
    expect(html).toContain('href="https://go.example.com/budget"')
    // Every affiliate CTA <a> carries the sponsored rel from outboundRel('sponsored',
    // true) and opens accessibly in a new tab. Scope to the anchor tags (React 19 may
    // also emit a <link rel="preload"> for the image, which is unrelated).
    const anchors = html.match(/<a [^>]*>/g) ?? []
    expect(anchors.length).toBe(2)
    for (const a of anchors) {
      expect(a).toContain('rel="sponsored nofollow noopener noreferrer"')
      expect(a).toContain('target="_blank"')
    }
    // Accessible "opens in a new tab" hint for screen readers.
    expect(html).toContain('opens in a new tab')
  })

  it('renders the comparison card content (badge, price, pros, cons, image)', () => {
    const html = renderToStaticMarkup(createElement(ProductRoundup, { block } as never))
    expect(html).toContain('Best overall')
    expect(html).toContain('$129')
    expect(html).toContain('Fast')
    expect(html).toContain('Pricey')
    // next/image (mocked) emits an <img> for the item image with alt = item name.
    expect(html).toContain('src="https://cdn.example.com/acme.jpg"')
    expect(html).toContain('alt="Acme Pro"')
  })

  it('renders nothing when there are no valid (named) items', () => {
    const html = renderToStaticMarkup(
      createElement(ProductRoundup, { block: { items: [{ name: '  ' }] } } as never),
    )
    expect(html).toBe('')
  })
})
