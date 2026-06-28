import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { AUTHORING_TOOLS } from './create-blog-post'

/**
 * Authoring MCP server. Physically distinct from the public `createServer()`
 * (src/lib/mcp/server.ts): it registers ONLY `AUTHORING_TOOLS` and is mounted on
 * the authenticated /mcp/authoring route. It deliberately does not import
 * `ALL_TOOLS`, so the privileged tool set and the public tool set never share a
 * registry.
 */
export function createAuthoringServer() {
  const server = new Server(
    { name: 'payload-website-authoring-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: AUTHORING_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }),
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = AUTHORING_TOOLS.find((t) => t.name === req.params.name)
    if (!tool) throw new Error(`Unknown tool: ${req.params.name}`)
    const args = tool.inputSchema.parse(req.params.arguments ?? {})
    const payload = await getPayloadClient()
    const result = await tool.handler({ payload }, args as never)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  })

  return server
}
