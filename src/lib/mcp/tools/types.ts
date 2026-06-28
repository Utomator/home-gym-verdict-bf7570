import type { Payload } from 'payload'
import type { z } from 'zod'

export type ToolDef<I extends z.ZodTypeAny, O> = {
  name: string
  description: string
  inputSchema: I
  handler: (deps: { payload: Payload }, args: z.infer<I>) => Promise<O>
}
