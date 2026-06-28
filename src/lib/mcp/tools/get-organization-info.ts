import { z } from 'zod'
import type { ToolDef } from './types'

const Input = z.object({})

type Out = {
  name: string
  tagline?: string
  sameAs: string[]
  contactPoints: { contactType: string; email?: string; telephone?: string }[]
}

export const getOrganizationInfo: ToolDef<typeof Input, Out> = {
  name: 'get_organization_info',
  description: 'Return organization info from the SiteSettings global.',
  inputSchema: Input,
  handler: async ({ payload }) => {
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const org = settings.organization ?? {}
    return {
      name: org.name ?? 'My Website',
      tagline: org.tagline ?? undefined,
      sameAs: (org.sameAs ?? []).map((s) => s.url).filter((u): u is string => Boolean(u)),
      contactPoints: (org.contactPoints ?? []).map((c) => ({
        contactType: c.contactType,
        email: c.email ?? undefined,
        telephone: c.telephone ?? undefined,
      })),
    }
  },
}
