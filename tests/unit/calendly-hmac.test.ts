import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyCalendlyHmac } from '@/lib/webhooks/calendly-hmac'

const SECRET = 'shh'
const sig = (t: string, body: string) => {
  const v1 = createHmac('sha256', SECRET).update(`${t}.${body}`).digest('hex')
  return `t=${t},v1=${v1}`
}

describe('verifyCalendlyHmac', () => {
  it('accepts a valid signature', () => {
    const body = '{"a":1}'
    const t = '1700000000'
    expect(verifyCalendlyHmac({ secret: SECRET, header: sig(t, body), body })).toBe(true)
  })

  it('rejects a tampered body', () => {
    const t = '1700000000'
    const goodSig = sig(t, '{"a":1}')
    expect(verifyCalendlyHmac({ secret: SECRET, header: goodSig, body: '{"a":2}' })).toBe(false)
  })

  it('rejects malformed header', () => {
    expect(verifyCalendlyHmac({ secret: SECRET, header: 'totallybroken', body: '{}' })).toBe(false)
  })

  it('rejects missing v1', () => {
    expect(verifyCalendlyHmac({ secret: SECRET, header: 't=123', body: '{}' })).toBe(false)
  })

  it('uses constant-time comparison (smoke)', () => {
    const body = '{}'
    const t = '1'
    expect(verifyCalendlyHmac({ secret: SECRET, header: sig(t, body), body })).toBe(true)
    expect(
      verifyCalendlyHmac({
        secret: SECRET,
        header: sig(t, body).replace(/v1=./, 'v1=z'),
        body,
      }),
    ).toBe(false)
  })
})
