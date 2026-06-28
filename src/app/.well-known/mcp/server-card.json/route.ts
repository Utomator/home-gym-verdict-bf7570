import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const e = env()
  const body = {
    $schema: 'https://modelcontextprotocol.io/schemas/server-card',
    serverInfo: { name: 'payload-website-mcp', version: '0.1.0' },
    transport: {
      type: 'http',
      endpoint: `${e.NEXT_PUBLIC_SERVER_URL}/mcp`,
    },
    capabilities: { tools: true, resources: false, prompts: false },
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
