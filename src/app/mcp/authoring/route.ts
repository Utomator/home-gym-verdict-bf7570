import { timingSafeEqual } from 'node:crypto'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { createAuthoringServer } from '@/lib/mcp/authoring/server'

export const dynamic = 'force-dynamic'
// Lexical conversion + a Payload create can exceed the Hobby 10s default.
export const maxDuration = 60

/**
 * Constant-time bearer-token gate. Reads the expected secret from
 * SITE_AUTHORING_TOKEN. Fail-closed: if the env var is unset/empty, EVERY request
 * is rejected (no Payload work, no unauthenticated authoring surface).
 *
 * Accepts either `Authorization: Bearer <token>` or `X-Authoring-Token: <token>`
 * (the contract names both; the spawned agent uses the Bearer form via .mcp.json).
 */
function isAuthorized(req: Request): boolean {
  const expected = env().SITE_AUTHORING_TOKEN
  if (!expected) return false

  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const headerToken = req.headers.get('x-authoring-token') ?? ''
  const got = bearer || headerToken
  if (!got) return false

  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function handle(req: Request): Promise<Response> {
  // Auth gate runs BEFORE constructing the transport or touching Payload.
  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true, // return JSON instead of SSE — safe for stateless
  })
  const server = createAuthoringServer()

  try {
    await server.connect(transport)
    return await transport.handleRequest(req)
  } catch (err) {
    logger.error({ err }, 'authoring mcp request failed')
    return Response.json({ error: 'mcp server error' }, { status: 500 })
  } finally {
    await transport.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
}

export async function POST(req: Request): Promise<Response> {
  return handle(req)
}

export async function GET(): Promise<Response> {
  // Stateless: no SSE stream to open.
  return new Response('Method Not Allowed', { status: 405 })
}

export async function DELETE(): Promise<Response> {
  // Stateless: nothing to terminate.
  return new Response('Method Not Allowed', { status: 405 })
}
