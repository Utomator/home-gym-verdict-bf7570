import { beforeEach, describe, expect, it, vi } from 'vitest'

const { create, find, notifySlack } = vi.hoisted(() => ({
  create: vi.fn().mockResolvedValue({ id: 'sub_1' }),
  find: vi.fn(),
  notifySlack: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: vi.fn().mockResolvedValue({ create, find }),
}))
vi.mock('@/lib/slack', () => ({ notifySlack }))
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: () => 'test-ua/1.0' }),
}))

import { submitSubscribe } from '@/app/(marketing)/_actions/subscribe'

const fd = (entries: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitSubscribe', () => {
  it('rejects when email is invalid', async () => {
    const r = await submitSubscribe({}, fd({ email: 'not-an-email' }))
    expect(r).toMatchObject({ ok: false })
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects when email is missing', async () => {
    const r = await submitSubscribe({}, fd({}))
    expect(r).toMatchObject({ ok: false })
    expect(create).not.toHaveBeenCalled()
  })

  it('writes a Submission tagged "newsletter" on a valid email', async () => {
    const r = await submitSubscribe({}, fd({ email: 'reader@example.com' }))
    expect(r).toMatchObject({ ok: true })
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'submissions',
        overrideAccess: true,
        data: expect.objectContaining({
          email: 'reader@example.com',
          source: 'newsletter',
        }),
      }),
    )
  })

  it('passes the configured source tag through to the Submission', async () => {
    await submitSubscribe({}, fd({ email: 'reader@example.com', source: 'blog-footer' }))
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'blog-footer' }),
      }),
    )
  })

  it('falls back to the default source when the tag is unknown/missing', async () => {
    await submitSubscribe({}, fd({ email: 'reader@example.com', source: '../../etc/passwd' }))
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'newsletter' }),
      }),
    )
  })

  it('satisfies the required name/message Submission fields without user input', async () => {
    await submitSubscribe({}, fd({ email: 'reader@example.com' }))
    const arg = create.mock.calls[0][0] as { data: { name?: string; message?: string } }
    expect(typeof arg.data.name).toBe('string')
    expect(arg.data.name?.length).toBeGreaterThan(0)
    expect(typeof arg.data.message).toBe('string')
    expect(arg.data.message?.length).toBeGreaterThanOrEqual(10)
  })

  it('silently succeeds (no write) when the honeypot is filled — anti-spam', async () => {
    const r = await submitSubscribe({}, fd({ email: 'bot@spam.com', company_url: 'http://x' }))
    // Honeypot bots get a success response but nothing is persisted.
    expect(r).toMatchObject({ ok: true })
    expect(create).not.toHaveBeenCalled()
  })

  it('returns a form-level error when the write throws', async () => {
    create.mockRejectedValueOnce(new Error('db down'))
    const r = await submitSubscribe({}, fd({ email: 'reader@example.com' }))
    expect(r).toMatchObject({ ok: false })
    if ('errors' in r) expect(r.errors.email || r.errors._form).toBeTruthy()
  })
})
