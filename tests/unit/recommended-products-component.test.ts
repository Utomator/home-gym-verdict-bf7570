import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the heavy children so we can render to static markup in the `node` env
// without booting next/image's loader or the Payload Lexical react renderer. We
// only assert RecommendedProducts' OWN markup (cards, CTAs, provenance line).
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', { src: props.src, alt: props.alt }),
}))
vi.mock('@/components/marketing/RichText', () => ({
  RichText: ({ data }: { data: unknown }) =>
    createElement('div', { 'data-richtext': data ? 'present' : 'empty' }),
}))
vi.mock('@/lib/env', () => ({ env: () => ({ NEXT_PUBLIC_SERVER_URL: 'https://example.com' }) }))

import { RecommendedProducts } from '@/components/marketing/RecommendedProducts'

const products = [
  {
    id: 11,
    name: 'Acme Pro',
    affiliateUrl: 'https://go.example.com/acme?tag=p51-20',
    image: { url: 'https://cdn.example.com/acme.jpg' },
    rating: 4.6,
    price: '$129',
    badge: 'Best overall',
    pros: [{ value: 'Fast' }],
    cons: [{ value: 'Pricey' }],
    factsAsOf: '2026-06-01',
  },
  {
    id: 22,
    name: 'Budget Pick',
    affiliateUrl: 'https://go.example.com/budget',
    imageUrl: 'https://cdn.example.com/budget.jpg',
  },
]

describe('RecommendedProducts component', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders N cards, each affiliate CTA with rel="sponsored nofollow" + safe new-tab attrs', () => {
    const html = renderToStaticMarkup(createElement(RecommendedProducts, { products } as never))
    expect(html).toContain('href="https://go.example.com/acme?tag=p51-20"')
    expect(html).toContain('href="https://go.example.com/budget"')
    const anchors = html.match(/<a [^>]*>/g) ?? []
    expect(anchors.length).toBe(2)
    for (const a of anchors) {
      expect(a).toContain('rel="sponsored nofollow noopener noreferrer"')
      expect(a).toContain('target="_blank"')
    }
  })

  it('prefers the Media doc url, falls back to imageUrl, and renders card content', () => {
    const html = renderToStaticMarkup(createElement(RecommendedProducts, { products } as never))
    // image preference: Media doc.url for the first, bare imageUrl for the second
    expect(html).toContain('src="https://cdn.example.com/acme.jpg"')
    expect(html).toContain('src="https://cdn.example.com/budget.jpg"')
    expect(html).toContain('Best overall')
    expect(html).toContain('$129')
    expect(html).toContain('Fast')
    expect(html).toContain('Pricey')
  })

  it('surfaces the facts-provenance "as of" line from factsAsOf', () => {
    const html = renderToStaticMarkup(createElement(RecommendedProducts, { products } as never))
    expect(html).toContain('Facts verified as of')
  })

  it('renders nothing for empty, low-depth (id), or nameless input', () => {
    expect(
      renderToStaticMarkup(createElement(RecommendedProducts, { products: [] } as never)),
    ).toBe('')
    // unresolved ids (depth 0)
    expect(
      renderToStaticMarkup(createElement(RecommendedProducts, { products: [11, 22] } as never)),
    ).toBe('')
    // objects without a name
    expect(
      renderToStaticMarkup(
        createElement(RecommendedProducts, { products: [{ name: '  ' }] } as never),
      ),
    ).toBe('')
  })
})
