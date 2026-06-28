import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('bookDiscoveryCall', () => {
  const original = process.env

  beforeEach(() => {
    process.env = { ...original }
    vi.resetModules()
  })
  afterEach(() => {
    process.env = original
  })

  it('returns the configured Calendly booking URL', async () => {
    process.env = {
      ...process.env,
      DATABASE_URL: 'postgres://u:p@x/db',
      DATABASE_URL_DIRECT: 'postgres://u:p@x/db',
      PAYLOAD_SECRET: 'a'.repeat(32),
      NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
      CALENDLY_BOOKING_URL: 'https://calendly.com/project51/discovery',
    }
    const { bookDiscoveryCall } = await import('@/lib/mcp/tools/book-discovery-call')
    const out = await bookDiscoveryCall.handler({ payload: {} as never }, {})
    expect(out).toEqual({ bookingUrl: 'https://calendly.com/project51/discovery' })
  })

  it('throws when CALENDLY_BOOKING_URL is not set', async () => {
    process.env = {
      ...process.env,
      DATABASE_URL: 'postgres://u:p@x/db',
      DATABASE_URL_DIRECT: 'postgres://u:p@x/db',
      PAYLOAD_SECRET: 'a'.repeat(32),
      NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
      CALENDLY_BOOKING_URL: undefined,
    }
    delete (process.env as Record<string, unknown>).CALENDLY_BOOKING_URL
    const { bookDiscoveryCall } = await import('@/lib/mcp/tools/book-discovery-call')
    await expect(bookDiscoveryCall.handler({ payload: {} as never }, {})).rejects.toThrow()
  })
})
