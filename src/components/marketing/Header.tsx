import { SiteHeader } from '@/components/sections/SiteHeader'
import { getPayloadClient } from '@/lib/payload'

/**
 * Header — thin CMS adapter for the designed <SiteHeader>.
 *
 * Fetches the navigation global + site settings (as before) and maps them onto
 * the design-system <SiteHeader> (sticky, responsive, token-driven). The CMS
 * header items become the primary nav; the persistent Search link is appended;
 * the org name is the brand label. No design lives here — only the data wiring.
 */
const FALLBACK_NAV = [
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export async function Header() {
  const payload = await getPayloadClient()
  const nav = await payload.findGlobal({ slug: 'navigation' })
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'
  const cmsItems = (nav.header ?? []).map((i) => ({ label: i.label, href: i.href }))
  const items = cmsItems.length > 0 ? cmsItems : FALLBACK_NAV
  const navItems = [...items, { label: 'Search', href: '/search' }]

  return <SiteHeader brandName={orgName} homeHref="/" navItems={navItems} />
}
