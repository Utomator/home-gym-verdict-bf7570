import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'
import { getContentType, getSitemapContentTypes } from '@/lib/registry/content-registry'

/** Minimal Payload stand-in: only `collections` (a slug-keyed map) is read by the
 *  registry's mount detection (isCollectionMounted). */
const payloadWith = (slugs: string[]): Payload =>
  ({ collections: Object.fromEntries(slugs.map((s) => [s, {}])) }) as unknown as Payload

describe('content registry — products entry (affiliate archetype)', () => {
  it('declares a products entry at /products/<slug> between Pages and Service areas', () => {
    const products = getContentType('products')
    expect(products).toBeDefined()
    expect(products?.collection).toBe('products')
    expect(products?.pathFor({ slug: 'acme-pro' })).toBe('/products/acme-pro')
    expect(products?.sitemap.include).toBe(true)
    expect(products?.sitemap.staticPaths).toEqual(['/products'])
    // sectionOrder 15 sits between Pages (10) and Service areas (20)
    expect(products?.llms.sectionOrder).toBe(15)
    expect(getContentType('pages')?.llms.sectionOrder).toBe(10)
    expect(getContentType('service-areas')?.llms.sectionOrder).toBe(20)
  })

  it('is INCLUDED in sitemap content types only when the products collection is mounted', () => {
    const affiliate = getSitemapContentTypes(
      payloadWith(['blog-posts', 'pages', 'people', 'products']),
    )
    expect(affiliate.map((t) => t.key)).toContain('products')

    // leadgen / landing: products not mounted -> excluded from every surface
    const leadgen = getSitemapContentTypes(payloadWith(['blog-posts', 'pages', 'people']))
    expect(leadgen.map((t) => t.key)).not.toContain('products')
  })
})
