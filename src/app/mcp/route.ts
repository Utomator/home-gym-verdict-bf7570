import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { logger } from '@/lib/logger'
import { createServer } from '@/lib/mcp/server'

export const dynamic = 'force-dynamic'

async function handle(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
    enableJsonResponse: true, // return JSON instead of SSE — safe for stateless
  })
  const server = createServer()

  try {
    await server.connect(transport)
    return await transport.handleRequest(req)
  } catch (err) {
    logger.error({ err }, 'mcp request failed')
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
  // Streamable HTTP supports GET for SSE in stateful mode; we're stateless.
  return new Response('Method Not Allowed', { status: 405 })
}

export async function DELETE(): Promise<Response> {
  // DELETE terminates a session; we're stateless and have nothing to terminate.
  return new Response('Method Not Allowed', { status: 405 })
}
