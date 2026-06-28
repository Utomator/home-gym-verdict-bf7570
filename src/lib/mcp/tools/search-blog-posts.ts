import { z } from 'zod'
import type { ToolDef } from './types'

const Input = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
})

type Output = {
  title: string
  slug: string
  excerpt?: string
  url: string
  publishedAt?: string
}[]

export const searchBlogPosts: ToolDef<typeof Input, Output> = {
  name: 'search_blog_posts',
  description: 'Search this site’s blog posts by query.',
  inputSchema: Input,
  handler: async ({ payload }, { query, limit = 10 }) => {
    const { docs } = await payload.find({
      collection: 'blog-posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [{ title: { like: query } }, { excerpt: { like: query } }],
          },
        ],
      },
      limit,
      depth: 0,
      sort: '-publishedAt',
    })
    return docs.map((d) => ({
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt ?? undefined,
      url: `/blog/${d.slug}`,
      publishedAt: d.publishedAt ?? undefined,
    }))
  },
}
