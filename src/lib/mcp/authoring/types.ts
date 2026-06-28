import type { Payload } from 'payload'
import type { z } from 'zod'

/**
 * Authoring tool definition. Mirrors the public `ToolDef` shape
 * (src/lib/mcp/tools/types.ts) but lives in a physically separate module so the
 * privileged authoring tool set can never be reached one tool-list away from the
 * public, unauthenticated /mcp surface.
 */
export type AuthoringToolDef<I extends z.ZodTypeAny, O> = {
  name: string
  description: string
  inputSchema: I
  handler: (deps: { payload: Payload }, args: z.infer<I>) => Promise<O>
}
