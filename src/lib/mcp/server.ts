import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { ALL_TOOLS } from './tools'

export function createServer() {
  const server = new Server(
    { name: 'payload-website-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }),
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = ALL_TOOLS.find((t) => t.name === req.params.name)
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
