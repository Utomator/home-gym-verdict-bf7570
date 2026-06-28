import { fetchAndSerialize, MD_HEADERS } from '@/lib/markdown/lookups'

export const dynamic = 'force-dynamic'

const RESERVED = new Set(['blog', 'contact'])

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  if (RESERVED.has(slug)) return new Response('Not Found', { status: 404 })
  const md = await fetchAndSerialize('pages', slug)
  if (!md) return new Response('Not Found', { status: 404 })
  return new Response(md, { headers: MD_HEADERS })
}
