import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakeLexicalState = {
  root: { type: 'root', version: 1, children: [], direction: null, format: '', indent: 0 },
}
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertMarkdownToLexical: vi.fn(() => fakeLexicalState),
  editorConfigFactory: { default: vi.fn(async () => ({})) },
}))
vi.mock('@/payload.config', () => ({ default: {} }))

import { createBlogPost } from '@/lib/mcp/authoring/create-blog-post'

const baseInput = {
  title: 'Best Widgets',
  slug: 'best-widgets',
  body_markdown: '# Best Widgets\n\nText.',
  publish: false,
}

/**
 * `find` is called twice in the products path: first the blog-posts slug pre-check
 * (must report the slug is free), then the products lookup (returns matching docs).
 */
function payloadMock(productDocs: { id: string | number }[]) {
  const find = vi.fn(async (args: { collection: string }) => {
    if (args.collection === 'products') {
      return { totalDocs: productDocs.length, docs: productDocs }
    }
    return { totalDocs: 0, docs: [] }
  })
  return {
    find,
    create: vi.fn().mockResolvedValue({ id: 'doc_1', slug: 'best-widgets', _status: 'draft' }),
    config: {},
  }
}

describe('createBlogPost — recommended_product_slugs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves recommended_product_slugs to relationship ids on the created doc', async () => {
    const payload = payloadMock([{ id: 11 }, { id: 22 }])
    await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      recommended_product_slugs: ['acme-pro', 'budget-pick'],
    } as never)

    // products lookup used an `in` query over the supplied slugs
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        where: { slug: { in: ['acme-pro', 'budget-pick'] } },
      }),
    )
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.recommendedProducts).toEqual([11, 22])
  })

  it('omits recommendedProducts entirely when no slugs are supplied (back-compat)', async () => {
    const payload = payloadMock([])
    await createBlogPost.handler({ payload: payload as never }, baseInput as never)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('recommendedProducts' in data).toBe(false)
    // no products query at all when the field is absent
    expect(payload.find).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'products' }),
    )
  })

  it('silently skips unknown/unmounted slugs and still creates the post', async () => {
    // products lookup throws (e.g. collection not mounted on leadgen/landing)
    const find = vi.fn(async (args: { collection: string }) => {
      if (args.collection === 'products') throw new Error('no such collection: products')
      return { totalDocs: 0, docs: [] }
    })
    const payload = {
      find,
      create: vi.fn().mockResolvedValue({ id: 'doc_2', slug: 'best-widgets', _status: 'draft' }),
      config: {},
    }
    const out = await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      recommended_product_slugs: ['ghost'],
    } as never)
    // post still created; no recommendedProducts key
    expect(payload.create).toHaveBeenCalled()
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('recommendedProducts' in data).toBe(false)
    expect(out).toEqual({ id: 'doc_2', url: '/blog/best-widgets', status: 'draft' })
  })
})
