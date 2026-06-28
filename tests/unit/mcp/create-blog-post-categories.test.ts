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
  title: 'Solar Savings',
  slug: 'solar-savings',
  body_markdown: '# Solar\n\nText.',
  publish: false,
}

/**
 * `find` is collection-aware: the blog-posts slug pre-check always reports the
 * slug is free; the `categories` lookup returns a seeded row only when the
 * queried slug is in `seededSlugs` (design g6 BB-6).
 */
function payloadMock(seededSlugs: Record<string, number> = {}) {
  const find = vi.fn(
    async (args: { collection: string; where?: { slug?: { equals?: string } } }) => {
      if (args.collection === 'categories') {
        const slug = args.where?.slug?.equals
        const id = slug ? seededSlugs[slug] : undefined
        return id != null ? { totalDocs: 1, docs: [{ id }] } : { totalDocs: 0, docs: [] }
      }
      return { totalDocs: 0, docs: [] }
    },
  )
  return {
    find,
    create: vi.fn().mockResolvedValue({ id: 'doc_1', slug: 'solar-savings', _status: 'draft' }),
    config: {},
  }
}

describe('createBlogPost — category resolution (g6 BB-6)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves the FIRST category slug to the seeded relationship + mirrors the free-text array', async () => {
    const payload = payloadMock({ solar: 7 })
    await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      categories: ['solar', 'energy'],
    } as never)

    // looked up the first category by slug
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'categories',
        where: { slug: { equals: 'solar' } },
      }),
    )
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    // relationship set to the resolved seeded id (drives /blog/category/<slug>)
    expect(data.category).toBe(7)
    // legacy free-text array still mirrored for back-compat
    expect(data.categories).toEqual([{ value: 'solar' }, { value: 'energy' }])
  })

  it('UNKNOWN string ⇒ no relationship, pure passthrough (back-compat, no error)', async () => {
    const payload = payloadMock({}) // nothing seeded
    const out = await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      categories: ['made-up'],
    } as never)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('category' in data).toBe(false)
    expect(data.categories).toEqual([{ value: 'made-up' }])
    expect(out).toEqual({ id: 'doc_1', url: '/blog/solar-savings', status: 'draft' })
  })

  it('NO categories supplied ⇒ no categories lookup, no relationship (untouched behavior)', async () => {
    const payload = payloadMock({ solar: 7 })
    await createBlogPost.handler({ payload: payload as never }, baseInput as never)

    expect(payload.find).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'categories' }),
    )
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('category' in data).toBe(false)
    expect(data.categories).toEqual([])
  })

  it('a categories-lookup failure ⇒ passthrough only, post still created (defense in depth)', async () => {
    const find = vi.fn(async (args: { collection: string }) => {
      if (args.collection === 'categories') throw new Error('no such collection: categories')
      return { totalDocs: 0, docs: [] }
    })
    const payload = {
      find,
      create: vi.fn().mockResolvedValue({ id: 'doc_2', slug: 'solar-savings', _status: 'draft' }),
      config: {},
    }
    const out = await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      categories: ['solar'],
    } as never)

    expect(payload.create).toHaveBeenCalled()
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect('category' in data).toBe(false)
    expect(data.categories).toEqual([{ value: 'solar' }])
    expect(out).toEqual({ id: 'doc_2', url: '/blog/solar-savings', status: 'draft' })
  })
})
