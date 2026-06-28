export const dynamic = 'force-dynamic'

export async function POST(): Promise<Response> {
  // Phase 2: handle Slack slash commands. For now, accept and 200.
  return Response.json({ ok: true })
}
