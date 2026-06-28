import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyCalendlyHmac(args: {
  secret: string
  header: string
  body: string
}): boolean {
  const params = Object.fromEntries(
    args.header.split(',').map((kv) => {
      const [k, v] = kv.split('=', 2)
      return [k?.trim() ?? '', v ?? '']
    }),
  )
  const t = params.t
  const v1 = params.v1
  if (!t || !v1) return false

  const expected = createHmac('sha256', args.secret).update(`${t}.${args.body}`).digest('hex')
  if (expected.length !== v1.length) return false
  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
