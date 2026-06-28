import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the lexical converter + editor config so the handler can be unit-tested
// without booting Payload. We assert the converter is called with our markdown and
// that its output is passed straight into payload.create's `body`.
const fakeLexicalState = {
  root: { type: 'root', version: 1, children: [], direction: null, format: '', indent: 0 },
}
vi.mock('@payloadcms/richtext-lexical', () => ({
  convertMarkdownToLexical: vi.fn(() => fakeLexicalState),
  editorConfigFactory: { default: vi.fn(async () => ({})) },
}))
// The handler imports the payload config only to feed editorConfigFactory; stub it.
vi.mock('@/payload.config', () => ({ default: {} }))

import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import { createBlogPost } from '@/lib/mcp/authoring/create-blog-post'

const baseInput = {
  title: 'Hello World',
  slug: 'hello-world',
  body_markdown: '# Hello\n\nSome **bold** text.',
  publish: false,
}

function payloadMock(overrides: Record<string, unknown> = {}) {
  return {
    // default: slug is free
    find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    create: vi.fn().mockResolvedValue({ id: 'doc_123', slug: 'hello-world', _status: 'draft' }),
    ...overrides,
  }
}

describe('createBlogPost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('converts markdown to lexical and creates a draft doc with field mapping', async () => {
    const payload = payloadMock()
    const out = await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      excerpt: 'short',
      categories: ['AI', 'Agents'],
      tags: ['mcp', 'payload'],
      answer_summary: 'A direct answer.',
      key_takeaways: ['one', 'two'],
    } as never)

    // markdown -> lexical converter received our markdown
    expect(convertMarkdownToLexical).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: baseInput.body_markdown }),
    )

    // create received the mapped data, with the converter output as `body`
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'blog-posts',
        overrideAccess: true,
        data: expect.objectContaining({
          title: 'Hello World',
          slug: 'hello-world',
          excerpt: 'short',
          body: fakeLexicalState,
          categories: [{ value: 'AI' }, { value: 'Agents' }],
          tags: [{ value: 'mcp' }, { value: 'payload' }],
          _status: 'draft',
          aeo: {
            answerSummary: 'A direct answer.',
            keyTakeaways: [{ point: 'one' }, { point: 'two' }],
          },
        }),
      }),
    )

    expect(out).toEqual({ id: 'doc_123', url: '/blog/hello-world', status: 'draft' })
  })

  it('sets _status=published and publishedAt when publish=true', async () => {
    const payload = payloadMock({
      create: vi.fn().mockResolvedValue({ id: 'd2', slug: 'hello-world', _status: 'published' }),
    })
    const out = await createBlogPost.handler({ payload: payload as never }, {
      ...baseInput,
      publish: true,
    } as never)

    const data = (payload.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data
    expect(data._status).toBe('published')
    expect(typeof data.publishedAt).toBe('string')
    expect(out).toEqual({ id: 'd2', url: '/blog/hello-world', status: 'published' })
  })

  it('returns slug_conflict (no create) when slug already exists', async () => {
    const payload = payloadMock({
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [{ id: 'x' }] }),
    })
    const out = await createBlogPost.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns lexical_conversion_failed when the converter throws (no create)', async () => {
    const mod = await import('@payloadcms/richtext-lexical')
    ;(mod.convertMarkdownToLexical as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('bad markdown node')
    })
    const payload = payloadMock()
    const out = await createBlogPost.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'lexical_conversion_failed' }))
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('maps a unique-violation race at create time to slug_conflict', async () => {
    const payload = payloadMock({
      create: vi
        .fn()
        .mockRejectedValue(new Error('duplicate key value violates unique constraint')),
    })
    const out = await createBlogPost.handler({ payload: payload as never }, baseInput as never)
    expect(out).toEqual(expect.objectContaining({ error: 'slug_conflict' }))
  })
})
