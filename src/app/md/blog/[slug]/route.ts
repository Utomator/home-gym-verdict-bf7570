import { fetchAndSerialize, MD_HEADERS } from '@/lib/markdown/lookups'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const md = await fetchAndSerialize('blog-posts', slug)
  if (!md) return new Response('Not Found', { status: 404 })
  return new Response(md, { headers: MD_HEADERS })
}
