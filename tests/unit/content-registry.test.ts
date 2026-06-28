import { describe, expect, it } from 'vitest'
import { CONTENT_TYPES, getContentType } from '@/lib/registry/content-registry'

describe('content registry — taxonomy hubs (topic clusters)', () => {
  const blog = getContentType('blog-posts')

  it('blog-posts declares category + tag taxonomy hubs and opts into them', () => {
    expect(blog).toBeDefined()
    expect(blog?.sitemap.includeTaxonomyHubs).toBe(true)
    const fields = blog?.taxonomy?.fields ?? []
    expect(fields.map((f) => f.field)).toEqual(['categories', 'tags'])
  })

  it('category hub pathFor matches the /blog/category/<value> route + post chip', () => {
    const cat = blog?.taxonomy?.fields.find((f) => f.field === 'categories')
    expect(cat?.pathFor('Guides')).toBe('/blog/category/Guides')
    // Multi-word values must be URL-encoded so the [value] segment resolves and
    // the canonical URL is byte-identical to what the chip <Link> emits.
    expect(cat?.pathFor('Home Energy')).toBe('/blog/category/Home%20Energy')
  })

  it('tag hub pathFor matches the /blog/tag/<value> route + post chip', () => {
    const tag = blog?.taxonomy?.fields.find((f) => f.field === 'tags')
    expect(tag?.pathFor('seo')).toBe('/blog/tag/seo')
    expect(tag?.pathFor('a&b')).toBe('/blog/tag/a%26b')
  })

  it('blog detail + author pathFor produce the canonical URLs used across surfaces', () => {
    expect(blog?.pathFor({ slug: 'my-post' })).toBe('/blog/my-post')
    const people = getContentType('people')
    // Byline + ProfilePage @id both resolve to /authors/<slug> (E-E-A-T graph).
    expect(people?.pathFor({ slug: 'jane' })).toBe('/authors/jane')
    expect(people?.author?.titleField).toBe('name')
  })

  it('every registry entry exposes a canonical detail pathFor', () => {
    for (const t of CONTENT_TYPES) {
      expect(typeof t.pathFor).toBe('function')
      expect(t.pathFor({ slug: 's' }).startsWith('/')).toBe(true)
    }
  })
})
