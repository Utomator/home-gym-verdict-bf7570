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

import { submitContact } from '@/app/(marketing)/contact/_actions/submit'

const fd = (entries: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  return f
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitContact', () => {
  it('rejects when email is invalid', async () => {
    const r = await submitContact({}, fd({ name: 'A', email: 'bad', message: 'hello there hello' }))
    expect(r).toMatchObject({ ok: false })
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects when message is too short', async () => {
    const r = await submitContact({}, fd({ name: 'A', email: 'a@b.co', message: 'hi' }))
    expect(r).toMatchObject({ ok: false })
  })

  it('creates submission and notifies slack on valid input', async () => {
    const r = await submitContact(
      {},
      fd({
        name: 'A',
        email: 'a@b.co',
        company: 'C',
        message: 'message of sufficient length',
      }),
    )
    expect(r).toMatchObject({ ok: true })
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'submissions',
        overrideAccess: true,
        data: expect.objectContaining({
          name: 'A',
          email: 'a@b.co',
          message: 'message of sufficient length',
        }),
      }),
    )
    expect(notifySlack).toHaveBeenCalled()
  })
})
