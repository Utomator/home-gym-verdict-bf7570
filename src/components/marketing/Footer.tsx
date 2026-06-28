import { type FooterColumn, SiteFooter } from '@/components/sections/SiteFooter'
import { getPayloadClient } from '@/lib/payload'

/**
 * Footer — thin CMS adapter for the designed <SiteFooter>.
 *
 * Fetches the navigation global + site settings (as before) and maps them onto
 * the design-system <SiteFooter>: the CMS footer items become a "Navigate"
 * column, the agent/well-known endpoints a "For agents" column, the legal links
 * the bottom legal bar, and the org tagline the brand blurb. No design here —
 * only the data wiring. The agent links keep their plain hrefs so SiteFooter's
 * anchor renders them as real <a> elements.
 */
const FALLBACK_FOOTER = [
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

const LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const AGENT = [
  { label: 'API catalog', href: '/.well-known/api-catalog' },
  { label: 'MCP server card', href: '/.well-known/mcp/server-card.json' },
  { label: 'Agent skills', href: '/.well-known/agent-skills/index.json' },
  { label: 'llms.txt', href: '/llms.txt' },
]

export async function Footer() {
  const payload = await getPayloadClient()
  const nav = await payload.findGlobal({ slug: 'navigation' })
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'
  const tagline = settings.organization?.tagline ?? ''
  const cmsItems = (nav.footer ?? []).map((i) => ({ label: i.label, href: i.href }))
  const primary = cmsItems.length > 0 ? cmsItems : FALLBACK_FOOTER

  const columns: FooterColumn[] = [
    { title: 'Navigate', links: primary },
    { title: 'For agents', links: AGENT },
  ]

  return (
    <SiteFooter
      brandName={orgName}
      homeHref="/"
      description={tagline || undefined}
      columns={columns}
      legalLinks={LEGAL}
    />
  )
}
