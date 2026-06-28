import {
  aggregateRatingSchema,
  productRoundupSchema,
  productSchema,
  type RoundupItem,
  reviewSchema,
} from '@p51/engine'
import { describe, expect, it } from 'vitest'

const baseUrl = 'https://example.com'
const PUBLISHER = 'Project51'

const fullItem: RoundupItem = {
  name: 'Acme Pro',
  affiliateUrl: 'https://go.example.com/acme?ref=p51',
  imageUrl: 'https://cdn.example.com/acme.jpg',
  rating: 4.6,
  price: '$129',
  pros: ['Fast', 'Reliable'],
  cons: ['Pricey'],
  description: 'The best overall pick.',
  badge: 'Best overall',
}

describe('aggregateRatingSchema', () => {
  it('emits a valid AggregateRating with a non-zero reviewCount', () => {
    const ar = aggregateRatingSchema(4.6)
    expect(ar['@type']).toBe('AggregateRating')
    expect(ar.ratingValue).toBe('4.6')
    expect(ar.bestRating).toBe('5')
    // Google requires a non-zero reviewCount for the rating to be eligible.
    expect(ar.reviewCount).toBe(1)
  })

  it('clamps the rating into [0, bestRating]', () => {
    expect(aggregateRatingSchema(9).ratingValue).toBe('5')
    expect(aggregateRatingSchema(-2).ratingValue).toBe('0')
  })
})

describe('reviewSchema', () => {
  it('maps pros/cons to positiveNotes/negativeNotes ItemLists + a Rating', () => {
    const r = reviewSchema(baseUrl, {
      itemName: 'Acme Pro',
      publisherName: PUBLISHER,
      rating: 4,
      pros: ['Fast'],
      cons: ['Pricey'],
      body: 'Best overall',
    })
    expect(r).toBeDefined()
    if (!r) throw new Error('review missing')
    expect(r['@type']).toBe('Review')
    // author is the publishing Organization, referenced by the shared @id node.
    expect(r.author).toMatchObject({ '@type': 'Organization', '@id': `${baseUrl}#organization` })
    const pos = r.positiveNotes as unknown as { itemListElement: { name: string }[] }
    const neg = r.negativeNotes as unknown as { itemListElement: { name: string }[] }
    expect(pos.itemListElement[0]).toMatchObject({ position: 1, name: 'Fast' })
    expect(neg.itemListElement[0]).toMatchObject({ position: 1, name: 'Pricey' })
    expect((r.reviewRating as { ratingValue: string }).ratingValue).toBe('4')
  })

  it('returns undefined when there is nothing reviewable', () => {
    expect(reviewSchema(baseUrl, { itemName: 'Bare', publisherName: PUBLISHER })).toBeUndefined()
  })
})

describe('productSchema', () => {
  it('builds a fully-populated Product (offer, rating, review, image, url)', () => {
    const p = productSchema(baseUrl, fullItem, PUBLISHER)
    expect(p['@type']).toBe('Product')
    expect(p.name).toBe('Acme Pro')
    expect(p.image).toBe('https://cdn.example.com/acme.jpg')
    expect(p.url).toBe(fullItem.affiliateUrl)
    const offer = p.offers as { '@type': string; price: string; url: string; availability: string }
    expect(offer).toMatchObject({
      '@type': 'Offer',
      price: '$129',
      url: fullItem.affiliateUrl,
      availability: 'https://schema.org/InStock',
    })
    expect((p.aggregateRating as { ratingValue: string }).ratingValue).toBe('4.6')
    expect((p.review as { '@type': string })['@type']).toBe('Review')
  })

  it('omits offer/rating/review/image for a sparse (name-only) item — no empty fields', () => {
    const p = productSchema(baseUrl, { name: 'Bare' }, PUBLISHER)
    expect(p.name).toBe('Bare')
    // None of the optional sub-nodes should be present (no undefined/empty leaks).
    expect(p).not.toHaveProperty('offers')
    expect(p).not.toHaveProperty('aggregateRating')
    expect(p).not.toHaveProperty('review')
    expect(p).not.toHaveProperty('image')
    // every value present must be defined
    for (const v of Object.values(p)) expect(v).toBeDefined()
  })

  it('omits the Offer when there is no price (Offer requires a price)', () => {
    const p = productSchema(
      baseUrl,
      { name: 'NoPrice', affiliateUrl: 'https://x.example' },
      PUBLISHER,
    )
    expect(p).not.toHaveProperty('offers')
    expect(p.url).toBe('https://x.example')
  })
})

describe('productRoundupSchema', () => {
  it('produces a valid ItemList of Product ListItems with no missing-required fields', () => {
    const ld = productRoundupSchema(baseUrl, {
      name: 'Best CRMs for 2026',
      url: `${baseUrl}/best-crms`,
      publisherName: PUBLISHER,
      items: [fullItem, { name: 'Budget Pick', affiliateUrl: 'https://go.example/budget' }],
    })
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('ItemList')
    expect(ld.numberOfItems).toBe(2)
    const els = ld.itemListElement as unknown as Array<{
      '@type': string
      position: number
      item: { '@type': string; name: string }
    }>
    expect(els).toHaveLength(2)
    expect(els[0]).toMatchObject({ '@type': 'ListItem', position: 1 })
    expect(els[0].item).toMatchObject({ '@type': 'Product', name: 'Acme Pro' })
    expect(els[1].item).toMatchObject({ '@type': 'Product', name: 'Budget Pick' })
    // positions are 1-based and contiguous
    expect(els.map((e) => e.position)).toEqual([1, 2])
  })

  it('skips nameless items so the list never carries an invalid Product', () => {
    const ld = productRoundupSchema(baseUrl, {
      name: 'Roundup',
      publisherName: PUBLISHER,
      items: [{ name: '   ' } as RoundupItem, fullItem],
    })
    expect(ld.numberOfItems).toBe(1)
    const els = ld.itemListElement as unknown as Array<{ item: { name: string } }>
    expect(els).toHaveLength(1)
    expect(els[0].item.name).toBe('Acme Pro')
  })
})
