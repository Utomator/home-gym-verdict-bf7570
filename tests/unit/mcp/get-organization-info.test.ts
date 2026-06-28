import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOrganizationInfo } from '@/lib/mcp/tools/get-organization-info'

describe('getOrganizationInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns flat organization fields from SiteSettings', async () => {
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({
        organization: {
          name: 'Project51',
          tagline: 'AI agency',
          sameAs: [{ url: 'https://x.com/p51' }],
          contactPoints: [{ contactType: 'sales', email: 'hi@p51.dev' }],
        },
      }),
    }
    const out = await getOrganizationInfo.handler({ payload: payload as never }, {})
    expect(out).toMatchObject({
      name: 'Project51',
      tagline: 'AI agency',
      sameAs: ['https://x.com/p51'],
      contactPoints: [{ contactType: 'sales', email: 'hi@p51.dev' }],
    })
    expect(payload.findGlobal).toHaveBeenCalledWith({ slug: 'site-settings' })
  })
})
