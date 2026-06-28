import { describe, expect, it } from 'vitest'
import { collectionListTag, docTag } from '@/lib/cache'

/**
 * The cache tags MUST stay in lockstep with src/hooks/revalidate-after-change.ts,
 * which invalidates `${collection.slug}:${doc.slug}` and 'sitemap' on every
 * publish. `docTag` is the per-document tag the hook fires; if its format ever
 * drifts, cached page reads would never be invalidated on publish (stale pages).
 * These tests lock that exact string contract.
 */
describe('cache tags', () => {
  it('docTag matches the publish hook format collection:slug', () => {
    // Mirrors revalidateTag(collection.slug + ":" + doc.slug) in the hook.
    expect(docTag('blog-posts', 'my-post')).toBe('blog-posts:my-post')
    expect(docTag('pages', 'about')).toBe('pages:about')
    expect(docTag('people', 'jane-doe')).toBe('people:jane-doe')
    // Leadgen composite slug (service/city) — the hook now maps service-areas too.
    expect(docTag('service-areas', 'plumbing/austin')).toBe('service-areas:plumbing/austin')
  })

  it('collectionListTag is a stable per-collection list handle', () => {
    expect(collectionListTag('blog-posts')).toBe('blog-posts:list:')
    expect(collectionListTag('people')).toBe('people:list:')
  })

  it('docTag and collectionListTag never collide for any single-segment slug', () => {
    // The list tag ends in a `:` sentinel that a doc slug (one URL-safe segment,
    // no colon) can never reproduce — so even a post slugged "list" stays distinct.
    expect(docTag('blog-posts', 'list')).not.toBe(collectionListTag('blog-posts'))
    expect(docTag('blog-posts', 'list')).toBe('blog-posts:list')
  })
})
