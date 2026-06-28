import { env } from '@/lib/env'
import { MD_HEADERS } from '@/lib/markdown/lookups'
import { getPayloadClient } from '@/lib/payload'
import { getFeedContentTypes } from '@/lib/registry/content-registry'

export const dynamic = 'force-dynamic'

// Non-collection hub links that exist regardless of which content types are
// mounted (a contact page is part of the base chrome, not a content archetype).
// Appended after the registry-derived collection hubs.
const STATIC_SECTION_LINKS: readonly { label: string; path: string }[] = [
  { label: 'Contact', path: '/contact' },
]

/**
 * Anchor text for a content-type hub path. The registry carries the canonical
 * hub *path* (`/blog`) on each type's sitemap policy; the md hub shows the index
 * name ("Blog"), which is the path's leaf segment title-cased — distinct from
 * the type's `label` ("Blog posts"). Derived so the listing stays data-driven.
 */
function hubLabel(path: string): string {
  const seg = path.split('/').filter(Boolean).pop() ?? ''
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : path
}

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'
  const tagline = settings.organization?.tagline ?? ''

  // The md hub lists the primary editorial content stream, not every sitemap
  // hub: feed-bearing types own a top-level index (blog-posts → /blog) and are
  // the ones surfaced here. Author/page hubs (/authors) are deliberately absent.
  // A landing app with no feed-bearing type contributes none — only the static
  // links remain.
  const collectionLinks = getFeedContentTypes(payload).flatMap((t) =>
    (t.sitemap.staticPaths ?? []).map((path) => ({ label: hubLabel(path), path })),
  )

  const sectionLinks = [...collectionLinks, ...STATIC_SECTION_LINKS]
  const sections = sectionLinks
    .map(({ label, path }) => `- [${label}](${e.NEXT_PUBLIC_SERVER_URL}${path})`)
    .join('\n')

  const md = `---
title: "${orgName}"
canonicalUrl: "${e.NEXT_PUBLIC_SERVER_URL}/"
---

# ${orgName}

${tagline ? `${tagline}\n\n` : ''}Sections:

${sections}
`
  return new Response(md, { headers: MD_HEADERS })
}
