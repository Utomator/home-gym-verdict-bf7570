import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env'

const baseEnv = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db?sslmode=require',
  DATABASE_URL_DIRECT: 'postgres://u:p@localhost:5432/db?sslmode=require',
  PAYLOAD_SECRET: 'a'.repeat(32),
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
}

describe('parseEnv', () => {
  it('parses a fully populated valid env', () => {
    const env = parseEnv(baseEnv)
    expect(env.DATABASE_URL).toBe(baseEnv.DATABASE_URL)
    expect(env.SITE_INDEXABLE).toBe(false) // default
  })

  it('coerces SITE_INDEXABLE=true to boolean true', () => {
    expect(parseEnv({ ...baseEnv, SITE_INDEXABLE: 'true' }).SITE_INDEXABLE).toBe(true)
  })

  it('rejects PAYLOAD_SECRET shorter than 32 chars', () => {
    expect(() => parseEnv({ ...baseEnv, PAYLOAD_SECRET: 'short' })).toThrow()
  })

  it('rejects malformed DATABASE_URL', () => {
    expect(() => parseEnv({ ...baseEnv, DATABASE_URL: 'not-a-url' })).toThrow()
  })

  it('makes prod-only secrets optional in non-prod', () => {
    const env = parseEnv(baseEnv)
    expect(env.CALENDLY_WEBHOOK_SECRET).toBeUndefined()
    expect(env.SLACK_WEBHOOK_URL).toBeUndefined()
  })
})
