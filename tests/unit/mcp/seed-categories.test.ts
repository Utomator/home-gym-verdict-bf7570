import { beforeEach, describe, expect, it, vi } from 'vitest'

// seed_categories does no Lexical conversion, but other authoring modules pulled
// into the same module graph (via create-blog-post's AUTHORING_TOOLS barrel) do.
// Stub the converter + the payload config exactly like the sibling authoring
// tests so the handler can be unit-tested without booting Payload.
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertMarkdownToLexical: vi.fn(() => ({ root: {} })),
  editorConfigFactory: { default: vi.fn(async () => ({})) },
}))
vi.mock('@/payload.config', () => ({ default: {} }))

import { seedCategories } from '@/lib/mcp/authoring/seed-categories'

const cats = [
  { title: 'Home Energy', slug: 'home-energy', description: 'Cut your bills.' },
  { title: 'Solar', slug: 'solar', platform_category_id: 42 },
]

/**
 * `find` decides create-vs-update per slug. By default every slug is free
 * (create path). Pass `existingSlugs` to simulate already-seeded rows that must
 * be updated in place (idempotency).
 */
function payloadMock(existingSlugs: Set<string> = new Set()) {
  const find = vi.fn(async (args: { where: { slug: { equals: string } } }) => {
    const slug = args.where.slug.equals
    return existingSlugs.has(slug)
      ? { totalDocs: 1, docs: [{ id: `cat_${slug}` }] }
      : { totalDocs: 0, docs: [] }
  })
  return {
    find,
    create: vi.fn(async (args: { data: { slug: string } }) => ({
      id: `cat_${args.data.slug}`,
      ...args.data,
    })),
    update: vi.fn(async (args: { id: string; data: { slug: string } }) => ({
      id: args.id,
      ...args.data,
    })),
    config: {},
  }
}

describe('seedCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CREATE path: seeds each category, maps fields, returns created list', async () => {
    const payload = payloadMock()
    const out = await seedCategories.handler({ payload: payload as never }, {
      categories: cats,
    } as never)

    // get-or-create keyed on slug (unique + indexed)
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'categories',
        where: { slug: { equals: 'home-energy' } },
      }),
    )
    expect(payload.create).toHaveBeenCalledTimes(2)
    expect(payload.update).not.toHaveBeenCalled()

    // field mapping: title/slug always, description/platformCategoryId only when present
    const first = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(first).toEqual({
      title: 'Home Energy',
      slug: 'home-energy',
      description: 'Cut your bills.',
    })
    const second = (payload.create as ReturnType<typeof vi.fn>).mock.calls[1][0].data
    expect(second).toEqual({ title: 'Solar', slug: 'solar', platformCategoryId: 42 })

    expect(out).toEqual({
      seeded: 2,
      created: ['home-energy', 'solar'],
      updated: [],
      slugs: ['home-energy', 'solar'],
    })
  })

  it('IDEMPOTENT: re-seeding the SAME slugs updates in place, never duplicates', async () => {
    // Simulate a prior seed: both slugs already exist.
    const payload = payloadMock(new Set(['home-energy', 'solar']))
    const out = await seedCategories.handler({ payload: payload as never }, {
      categories: cats,
    } as never)

    // every slug took the UPDATE path; zero creates => no duplicate rows
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledTimes(2)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'categories',
        id: 'cat_home-energy',
        overrideAccess: true,
      }),
    )
    expect(out).toEqual({
      seeded: 2,
      created: [],
      updated: ['home-energy', 'solar'],
      slugs: ['home-energy', 'solar'],
    })
  })

  it('MIXED: a new slug is created, a known slug is updated (top-up the plan)', async () => {
    const payload = payloadMock(new Set(['home-energy']))
    const out = await seedCategories.handler({ payload: payload as never }, {
      categories: cats,
    } as never)
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(out).toEqual(expect.objectContaining({ created: ['solar'], updated: ['home-energy'] }))
  })

  it('coerces a stringified platform_category_id to a number (at the Zod boundary the server parses through)', async () => {
    const payload = payloadMock()
    // The MCP server (authoring/server.ts) parses args through inputSchema before
    // calling the handler, so mirror that here to assert the z.coerce boundary.
    const parsed = seedCategories.inputSchema.parse({
      categories: [{ title: 'Solar', slug: 'solar', platform_category_id: '42' }],
    })
    await seedCategories.handler({ payload: payload as never }, parsed)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.platformCategoryId).toBe(42)
  })

  it('rejects an empty categories list at the Zod boundary', () => {
    expect(() => seedCategories.inputSchema.parse({ categories: [] })).toThrow()
  })

  it('rejects a category missing a slug at the Zod boundary', () => {
    expect(() => seedCategories.inputSchema.parse({ categories: [{ title: 'No Slug' }] })).toThrow()
  })

  it('returns validation_failed (never throws across the MCP boundary) when a write throws', async () => {
    const payload = payloadMock()
    payload.create = vi.fn().mockRejectedValue(new Error('db down'))
    const out = await seedCategories.handler({ payload: payload as never }, {
      categories: cats,
    } as never)
    expect(out).toEqual(expect.objectContaining({ error: 'validation_failed' }))
  })
})
