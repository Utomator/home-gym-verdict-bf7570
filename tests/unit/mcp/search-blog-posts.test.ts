import { beforeEach, describe, expect, it, vi } from 'vitest'
import { searchBlogPosts } from '@/lib/mcp/tools/search-blog-posts'

describe('searchBlogPosts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries by title/excerpt and maps results', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: '1',
            title: 'AI agents',
            slug: 'ai-agents',
            excerpt: 'x',
            publishedAt: '2026-01-01',
          },
        ],
      }),
    }
    const out = await searchBlogPosts.handler({ payload: payload as never }, { query: 'agents' })
    expect(out).toEqual([
      {
        title: 'AI agents',
        slug: 'ai-agents',
        excerpt: 'x',
        url: '/blog/ai-agents',
        publishedAt: '2026-01-01',
      },
    ])
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'blog-posts' }))
  })

  it('respects custom limit', async () => {
    const payload = { find: vi.fn().mockResolvedValue({ docs: [] }) }
    await searchBlogPosts.handler({ payload: payload as never }, { query: 'q', limit: 5 })
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }))
  })
})
