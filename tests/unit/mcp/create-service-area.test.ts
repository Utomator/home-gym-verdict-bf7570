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
import { createServiceArea } from '@/lib/mcp/authoring/create-service-area'

const baseInput = {
  service: 'Emergency Plumbing',
  city: 'Austin',
  body_markdown: '## Fast 24/7 service\n\nWe come to **you**.',
  publish: false,
}

function payloadMock(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    create: vi
      .fn()
      .mockResolvedValue({ id: 'sa_1', slug: 'emergency-plumbing/austin', _status: 'draft' }),
    config: {},
    ...overrides,
  }
}

describe('createServiceArea', () => {
  beforeEach(() => vi.clearAllMocks())

  it('slugifies <service>/<city>, converts body + FAQ, and creates a draft', async () => {
    const payload = payloadMock()
    const out = await createServiceArea.handler({ payload: payload as never }, {
      ...baseInput,
      region: 'TX',
      intro: 'Burst pipe? We are there in 30 minutes.',
      highlights: ['Licensed', 'Insured'],
      answer_summary: 'A direct answer.',
      faq: [{ question: 'Are you 24/7?', answer_markdown: 'Yes, **always**.' }],
    } as never)

    // pre-check used the composed canonical slug
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'service-areas',
        where: { slug: { equals: 'emergency-plumbing/austin' } },
      }),
    )
    // converter called for body + each FAQ answer
    expect(convertMarkdownToLexical).toHaveBeenCalledTimes(2)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'service-areas', overrideAccess: true }),
    )
    expect(data.service).toBe('Emergency Plumbing')
    expect(data.city).toBe('Austin')
    expect(data.region).toBe('TX')
    expect(data.slug).toBe('emergency-plumbing/austin')
    expect(data.intro).toBe('Burst pipe? We are there in 30 minutes.')
    expect(data.body).toBe(fakeLexicalState)
    expect(data.highlights).toEqual([{ value: 'Licensed' }, { value: 'Insured' }])
    expect(data.aeo).toEqual({
      answerSummary: 'A direct answer.',
      faq: [{ question: 'Are you 24/7?', answer: fakeLexicalState }],
    })
    expect(data._status).toBe('draft')
    expect(out).toEqual({ id: 'sa_1', url: '/emergency-plumbing/austin', status: 'draft' })
  })

  it('omits aeo.faq when no faq is supplied', async () => {
    const payload = payloadMock()
    await createServiceArea.handler({ payload: payload as never }, baseInput as never)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data.aeo.faq).toBeUndefined()
  })

  it('sets _status=published when publish=true', async () => {
    const payload = payloadMock({
      create: vi
        .fn()
        .mockResolvedValue({ id: 's2', slug: 'emergency-plumbing/austin', _status: 'published' }),
    })
    const out = await createServiceArea.handler({ payload: payload as never }, {
      ...baseInput,
      publish: true,
    } as never)
    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data._status).toBe('published')
    expect(out).toEqual({ id: 's2', url: '/emergency-plumbing/austin', status: 'published' })
  })

  it('returns slug_conflict (no create) when slug already exists', async () => {
    const payload = payloadMock({
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [{ id: 'x' }] }),
    })
    const out = await createServiceArea.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns validation_failed when service/city slugify to empty', async () => {
    const payload = payloadMock()
    const out = await createServiceArea.handler({ payload: payload as never }, {
      ...baseInput,
      city: '!!!',
    } as never)
    expect(out).toEqual(expect.objectContaining({ error: 'validation_failed' }))
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns lexical_conversion_failed when the converter throws (no create)', async () => {
    const mod = await import('@payloadcms/richtext-lexical')
    ;(mod.convertMarkdownToLexical as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('bad markdown node')
    })
    const payload = payloadMock()
    const out = await createServiceArea.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'lexical_conversion_failed' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('maps a unique-violation race at create time to slug_conflict', async () => {
    const payload = payloadMock({
      create: vi
        .fn()
        .mockRejectedValue(new Error('duplicate key value violates unique constraint')),
    })
    const out = await createServiceArea.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
  })
})
