import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Token the gate expects.
const TOKEN = 'super-secret-authoring-token'

// Mock env so the route reads our token without a full env parse.
vi.mock('@/lib/env', () => ({
  env: () => ({ SITE_AUTHORING_TOKEN: process.env.__TEST_TOKEN }),
}))

// Mock the transport + authoring server so an AUTHORIZED request resolves to a
// recognizable 200 without doing real MCP/Payload work. This lets us assert the
// gate: unauthorized => 401 and the transport is NEVER constructed; authorized =>
// the transport path runs. `vi.hoisted` makes the spies available to the hoisted
// vi.mock factory below.
const { handleRequest, transportCtor, TransportMock } = vi.hoisted(() => {
  const handleRequest = vi.fn(async () => new Response('ok', { status: 200 }))
  // The route does `new WebStandardStreamableHTTPServerTransport(...)`, so the mock
  // must be newable. A class constructor is both newable and biome-clean (an arrow
  // function returned from vi.fn cannot be used with `new`). transportCtor counts
  // constructions so we can assert the transport is never built on a 401.
  const transportCtor = vi.fn()
  class TransportMock {
    handleRequest = handleRequest
    close = vi.fn(async () => undefined)
    constructor() {
      transportCtor()
    }
  }
  return { handleRequest, transportCtor, TransportMock }
})
vi.mock('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js', () => ({
  WebStandardStreamableHTTPServerTransport: TransportMock,
}))
vi.mock('@/lib/mcp/authoring/server', () => ({
  createAuthoringServer: () => ({
    connect: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  }),
}))

import { POST } from '@/app/mcp/authoring/route'

function req(headers: Record<string, string> = {}) {
  return new Request('https://site.example/mcp/authoring', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: '{"jsonrpc":"2.0","id":1,"method":"tools/list"}',
  })
}

describe('authoring route auth gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.__TEST_TOKEN = TOKEN
  })
  afterEach(() => {
    process.env.__TEST_TOKEN = undefined
  })

  it('401s with no Authorization header (transport never constructed)', async () => {
    const res = await POST(req())
    expect(res.status).toBe(401)
    expect(transportCtor).not.toHaveBeenCalled()
  })

  it('401s with a wrong bearer token', async () => {
    const res = await POST(req({ authorization: 'Bearer nope' }))
    expect(res.status).toBe(401)
    expect(transportCtor).not.toHaveBeenCalled()
  })

  it('proceeds with the correct Bearer token', async () => {
    const res = await POST(req({ authorization: `Bearer ${TOKEN}` }))
    expect(res.status).toBe(200)
    expect(transportCtor).toHaveBeenCalledTimes(1)
    expect(handleRequest).toHaveBeenCalledTimes(1)
  })

  it('accepts the X-Authoring-Token header form too', async () => {
    const res = await POST(req({ 'x-authoring-token': TOKEN }))
    expect(res.status).toBe(200)
  })

  it('is fail-closed: 401 when SITE_AUTHORING_TOKEN is unset, even with a token', async () => {
    process.env.__TEST_TOKEN = undefined
    const res = await POST(req({ authorization: `Bearer ${TOKEN}` }))
    expect(res.status).toBe(401)
    expect(transportCtor).not.toHaveBeenCalled()
  })
})
