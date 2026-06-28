import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakeLexicalState = {
  root: { type: 'root', version: 1, children: [], direction: null, format: '', indent: 0 },
}
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertMarkdownToLexical: vi.fn(() => fakeLexicalState),
  editorConfigFactory: { default: vi.fn(async () => ({})) },
}))
vi.mock('@/payload.config', () => ({ default: {} }))

import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import { upsertProduct } from '@/lib/mcp/authoring/upsert-product'

const baseInput = {
  name: 'Acme Pro',
  slug: 'acme-pro',
  affiliate_url: 'https://go.example.com/acme?tag=p51-20',
  publish: false,
}

function payloadMock(overrides: Record<string, unknown> = {}) {
  return {
    // default: slug is free -> create path
    find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    create: vi.fn().mockResolvedValue({ id: 'prod_1', slug: 'acme-pro', _status: 'draft' }),
    update: vi.fn().mockResolvedValue({ id: 'prod_1', slug: 'acme-pro', _status: 'draft' }),
    config: {},
    ...overrides,
  }
}

describe('upsertProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CREATE path: maps fields, defaults to draft, returns created=true', async () => {
    const payload = payloadMock()
    const out = await upsertProduct.handler({ payload: payload as never }, {
      ...baseInput,
      brand: 'Acme',
      excerpt: 'A great product.',
      program: 'amazon-us',
      product_key: 'B0ACME',
      rating: 4.6,
      price: '$129',
      badge: 'Best overall',
      pros: ['Fast', 'Reliable'],
      cons: ['Pricey'],
      specs: [{ label: 'Weight', value: '2kg' }],
      category: ['Fitness'],
      blurb_markdown: 'The **best** in class.',
      facts_as_of: '2026-06-01',
      answer_summary: 'A direct answer.',
      key_takeaways: ['one', 'two'],
    } as never)

    // upsert keyed on slug
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        where: { slug: { equals: 'acme-pro' } },
      }),
    )
    // blurb markdown -> lexical
    expect(convertMarkdownToLexical).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: 'The **best** in class.' }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'products', overrideAccess: true }),
    )
    expect(payload.update).not.toHaveBeenCalled()

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.name).toBe('Acme Pro')
    expect(data.slug).toBe('acme-pro')
    expect(data.brand).toBe('Acme')
    expect(data.excerpt).toBe('A great product.')
    // affiliate_url stored as-is (already resolved §7.5)
    expect(data.affiliateUrl).toBe('https://go.example.com/acme?tag=p51-20')
    // program/productKey live under the affiliate group (re-resolve source)
    expect(data.affiliate).toEqual({ program: 'amazon-us', productKey: 'B0ACME' })
    expect(data.rating).toBe(4.6)
    expect(data.price).toBe('$129')
    expect(data.badge).toBe('Best overall')
    expect(data.pros).toEqual([{ value: 'Fast' }, { value: 'Reliable' }])
    expect(data.cons).toEqual([{ value: 'Pricey' }])
    expect(data.specs).toEqual([{ label: 'Weight', value: '2kg' }])
    expect(data.category).toEqual([{ value: 'Fitness' }])
    expect(data.factsAsOf).toBe('2026-06-01')
    expect(data.blurb).toBe(fakeLexicalState)
    // products default to DRAFT (critique-quality C3)
    expect(data._status).toBe('draft')
    expect(data.aeo).toEqual({
      answerSummary: 'A direct answer.',
      keyTakeaways: [{ point: 'one' }, { point: 'two' }],
    })

    expect(out).toEqual({
      id: 'prod_1',
      slug: 'acme-pro',
      url: '/products/acme-pro',
      status: 'draft',
      created: true,
    })
  })

  it('UPDATE path (idempotent on slug): second call with same slug updates, created=false', async () => {
    const payload = payloadMock({
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [{ id: 'prod_1' }] }),
      update: vi.fn().mockResolvedValue({ id: 'prod_1', slug: 'acme-pro', _status: 'draft' }),
    })
    const out = await upsertProduct.handler({ payload: payload as never }, {
      ...baseInput,
      price: '$99',
    } as never)

    // updates the existing doc, never creates a duplicate
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'products', id: 'prod_1', overrideAccess: true }),
    )
    expect(payload.create).not.toHaveBeenCalled()
    const data = (payload.update as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.price).toBe('$99')
    expect(out).toEqual({
      id: 'prod_1',
      slug: 'acme-pro',
      url: '/products/acme-pro',
      status: 'draft',
      created: false,
    })
  })

  it('sets _status=published when publish=true', async () => {
    const payload = payloadMock({
      create: vi.fn().mockResolvedValue({ id: 'p2', slug: 'acme-pro', _status: 'published' }),
    })
    const out = await upsertProduct.handler({ payload: payload as never }, {
      ...baseInput,
      publish: true,
    } as never)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data._status).toBe('published')
    expect(out).toEqual(expect.objectContaining({ status: 'published', created: true }))
  })

  it('rejects rating > 5 at the Zod boundary', () => {
    expect(() => upsertProduct.inputSchema.parse({ ...baseInput, rating: 9 })).toThrow()
  })

  it('rejects a missing affiliate_url at the Zod boundary', () => {
    const { affiliate_url: _omit, ...noUrl } = baseInput
    expect(() => upsertProduct.inputSchema.parse(noUrl)).toThrow()
  })

  it('returns lexical_conversion_failed when the converter throws (no create/update)', async () => {
    const mod = await import('@payloadcms/richtext-lexical')
    ;(mod.convertMarkdownToLexical as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('bad markdown node')
    })
    const payload = payloadMock()
    const out = await upsertProduct.handler({ payload: payload as never }, {
      ...baseInput,
      blurb_markdown: 'broken',
    } as never)
    expect(out).toEqual(expect.objectContaining({ error: 'lexical_conversion_failed' }))
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('returns validation_failed when the write throws', async () => {
    const payload = payloadMock({
      create: vi.fn().mockRejectedValue(new Error('db down')),
    })
    const out = await upsertProduct.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'validation_failed' }))
  })
})
