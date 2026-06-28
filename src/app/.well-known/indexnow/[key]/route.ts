import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string }> },
): Promise<Response> {
  const { key } = await ctx.params
  const e = env()
  if (!e.INDEXNOW_KEY) return new Response('Not Found', { status: 404 })
  if (key !== `${e.INDEXNOW_KEY}.txt`) return new Response('Not Found', { status: 404 })
  return new Response(e.INDEXNOW_KEY, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
