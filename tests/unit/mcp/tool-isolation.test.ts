import { describe, expect, it } from 'vitest'
import { AUTHORING_TOOLS } from '@/lib/mcp/authoring/create-blog-post'
import { ALL_TOOLS } from '@/lib/mcp/tools'

/**
 * Boundary guard (spec §11): the privileged authoring tool set and the public,
 * unauthenticated tool set must stay PHYSICALLY distinct. `create_blog_post` must
 * never appear in ALL_TOOLS (the public /mcp surface).
 */
const PRIVILEGED_TOOL_NAMES = [
  'create_blog_post',
  'create_page',
  'create_service_area',
  'upsert_product',
  'seed_categories',
]

describe('public vs authoring tool isolation', () => {
  it('public ALL_TOOLS does not expose any privileged authoring tool', () => {
    const names = ALL_TOOLS.map((t) => t.name)
    for (const privileged of PRIVILEGED_TOOL_NAMES) {
      expect(names).not.toContain(privileged)
    }
  })

  it('AUTHORING_TOOLS contains exactly the privileged write-tools', () => {
    expect(AUTHORING_TOOLS.map((t) => t.name)).toEqual(PRIVILEGED_TOOL_NAMES)
  })

  it('the two tool sets are disjoint by name', () => {
    const pub = new Set(ALL_TOOLS.map((t) => t.name))
    for (const t of AUTHORING_TOOLS) expect(pub.has(t.name)).toBe(false)
  })
})
