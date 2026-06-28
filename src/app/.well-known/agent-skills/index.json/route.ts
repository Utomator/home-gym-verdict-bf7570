import { createHash } from 'node:crypto'
import { z } from 'zod'
import { env } from '@/lib/env'
import { ALL_TOOLS } from '@/lib/mcp/tools'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const e = env()
  const skills = ALL_TOOLS.map((t) => {
    const inputSchema = z.toJSONSchema(t.inputSchema, { target: 'draft-7' })
    const fingerprint = JSON.stringify({
      name: t.name,
      description: t.description,
      inputSchema,
    })
    const sha256 = createHash('sha256').update(fingerprint).digest('hex')
    return {
      name: t.name.replace(/_/g, '-'),
      type: 'mcp-tool',
      description: t.description,
      url: `${e.NEXT_PUBLIC_SERVER_URL}/mcp`,
      sha256,
    }
  })

  return Response.json({
    $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
    skills,
  })
}
