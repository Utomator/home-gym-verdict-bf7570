import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the lexical converter + editor config so the handler can be unit-tested
// without booting Payload. Each markdown section becomes this fake state.
const fakeLexicalState = {
  root: { type: 'root', version: 1, children: [], direction: null, format: '', indent: 0 },
}
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertMarkdownToLexical: vi.fn(() => fakeLexicalState),
  editorConfigFactory: { default: vi.fn(async () => ({})) },
}))
vi.mock('@/payload.config', () => ({ default: {} }))

import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import { createPage } from '@/lib/mcp/authoring/create-page'

const baseInput = {
  title: 'About Us',
  slug: 'about',
  body: [{ type: 'richText', markdown: '# About\n\nWe do **things**.' }],
  publish: false,
}

function payloadMock(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    create: vi.fn().mockResolvedValue({ id: 'page_1', slug: 'about', _status: 'draft' }),
    config: {},
    ...overrides,
  }
}

describe('createPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assembles richText / cta / mediaWithText blocks and creates a draft', async () => {
    const payload = payloadMock()
    const out = await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      body: [
        { type: 'richText', markdown: '# Intro' },
        {
          type: 'cta',
          heading: 'Get started',
          subheading: 'It is easy',
          buttonLabel: 'Sign up',
          buttonHref: '/signup',
        },
        {
          type: 'mediaWithText',
          markdown: 'Caption copy',
          image_media_id: 42,
          imagePosition: 'right',
        },
      ],
      meta_title: 'About | Brand',
      meta_description: 'All about us',
      answer_summary: 'A direct answer.',
      key_takeaways: ['one', 'two'],
    } as never)

    // converter called once per markdown-bearing section (richText + mediaWithText)
    expect(convertMarkdownToLexical).toHaveBeenCalledTimes(2)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'pages', overrideAccess: true }),
    )
    expect(data.body).toEqual([
      { blockType: 'richText', content: fakeLexicalState },
      {
        blockType: 'cta',
        heading: 'Get started',
        subheading: 'It is easy',
        buttonLabel: 'Sign up',
        buttonHref: '/signup',
      },
      { blockType: 'mediaWithText', image: 42, content: fakeLexicalState, imagePosition: 'right' },
    ])
    expect(data.meta).toEqual({ title: 'About | Brand', description: 'All about us' })
    expect(data.aeo).toEqual({
      answerSummary: 'A direct answer.',
      keyTakeaways: [{ point: 'one' }, { point: 'two' }],
    })
    expect(data._status).toBe('draft')
    expect(out).toEqual({ id: 'page_1', url: '/about', status: 'draft' })
  })

  it('authors a productRoundup section (markdown->lexical, pros/cons, affiliate links as-is)', async () => {
    const payload = payloadMock({
      create: vi.fn().mockResolvedValue({ id: 'page_1', slug: 'best-crms', _status: 'draft' }),
    })
    const out = await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      slug: 'best-crms',
      body: [
        {
          type: 'productRoundup',
          intro_markdown: 'These are the **best** CRMs.',
          items: [
            {
              name: 'Acme Pro',
              affiliateUrl: 'https://go.example.com/acme?ref=p51',
              imageUrl: 'https://cdn.example.com/acme.jpg',
              rating: 4.6,
              price: '$129',
              badge: 'Best overall',
              pros: ['Fast', 'Reliable'],
              cons: ['Pricey'],
              blurb_markdown: 'A great pick.',
            },
            {
              // sparse item: name + affiliate link only, no rich blurb
              name: 'Budget Pick',
              affiliateUrl: 'https://go.example.com/budget',
            },
          ],
          verdict_markdown: 'Acme wins.',
        },
      ],
    } as never)

    // intro + verdict + one blurb = 3 markdown conversions (the sparse item has none).
    expect(convertMarkdownToLexical).toHaveBeenCalledTimes(3)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.body).toHaveLength(1)
    const block = data.body[0]
    expect(block.blockType).toBe('productRoundup')
    expect(block.intro).toEqual(fakeLexicalState)
    expect(block.verdict).toEqual(fakeLexicalState)
    expect(block.items).toHaveLength(2)
    // first item: full shape, affiliate URL stored verbatim, pros/cons -> {value}
    expect(block.items[0]).toEqual({
      name: 'Acme Pro',
      affiliateUrl: 'https://go.example.com/acme?ref=p51',
      imageUrl: 'https://cdn.example.com/acme.jpg',
      rating: 4.6,
      price: '$129',
      badge: 'Best overall',
      pros: [{ value: 'Fast' }, { value: 'Reliable' }],
      cons: [{ value: 'Pricey' }],
      blurb: fakeLexicalState,
    })
    // sparse item: no blurb key, empty pros/cons arrays, link preserved
    expect(block.items[1]).toEqual({
      name: 'Budget Pick',
      affiliateUrl: 'https://go.example.com/budget',
      pros: [],
      cons: [],
    })
    expect(out).toEqual({ id: 'page_1', url: '/best-crms', status: 'draft' })
  })

  it('returns lexical_conversion_failed (no create) when a roundup blurb conversion throws', async () => {
    const mod = await import('@payloadcms/richtext-lexical')
    ;(mod.convertMarkdownToLexical as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('bad blurb')
    })
    const payload = payloadMock()
    const out = await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      slug: 'roundup',
      body: [
        {
          type: 'productRoundup',
          items: [{ name: 'X', affiliateUrl: 'https://x.example', blurb_markdown: 'boom' }],
        },
      ],
    } as never)
    expect(out).toEqual(expect.objectContaining({ error: 'lexical_conversion_failed' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('degrades a mediaWithText section with no image to a richText block', async () => {
    const payload = payloadMock()
    await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      body: [{ type: 'mediaWithText', markdown: 'Orphan caption', imagePosition: 'left' }],
    } as never)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.body).toEqual([{ blockType: 'richText', content: fakeLexicalState }])
  })

  it('sets _status=published when publish=true', async () => {
    const payload = payloadMock({
      create: vi.fn().mockResolvedValue({ id: 'p2', slug: 'about', _status: 'published' }),
    })
    const out = await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      publish: true,
    } as never)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data._status).toBe('published')
    expect(out).toEqual({ id: 'p2', url: '/about', status: 'published' })
  })

  it('returns slug_conflict (no create) when slug already exists', async () => {
    const payload = payloadMock({
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [{ id: 'x' }] }),
    })
    const out = await createPage.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns slug_conflict (no find/create) for a reserved slug', async () => {
    const payload = payloadMock()
    const out = await createPage.handler({ payload: payload as never }, {
      ...baseInput,
      slug: 'blog',
    } as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns lexical_conversion_failed when a section conversion throws (no create)', async () => {
    const mod = await import('@payloadcms/richtext-lexical')
    ;(mod.convertMarkdownToLexical as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('bad markdown node')
    })
    const payload = payloadMock()
    const out = await createPage.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'lexical_conversion_failed' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('maps a unique-violation race at create time to slug_conflict', async () => {
    const payload = payloadMock({
      create: vi
        .fn()
        .mockRejectedValue(new Error('duplicate key value violates unique constraint')),
    })
    const out = await createPage.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
  })
})
