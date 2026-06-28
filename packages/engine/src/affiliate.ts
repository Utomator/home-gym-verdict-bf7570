export type LinkRel = 'sponsored' | 'ugc' | 'nofollow' | 'follow' | null | undefined

/**
 * Builds the rel attribute for an OUTBOUND body link from its author-declared
 * attribution. SEO tokens come ONLY from an explicit flag — unflagged ('follow'
 * or undefined) links stay FOLLOWED (genuine editorial citations, which Google
 * rewards). When the link opens in a new tab, noopener+noreferrer are always
 * added (tab-nabbing safety), independent of SEO. Returns '' when no rel is needed.
 */
export function outboundRel(linkRel: LinkRel, newTab: boolean): string {
  const seo =
    linkRel === 'sponsored'
      ? ['sponsored', 'nofollow']
      : linkRel === 'ugc'
        ? ['ugc']
        : linkRel === 'nofollow'
          ? ['nofollow']
          : []
  return [...seo, ...(newTab ? ['noopener', 'noreferrer'] : [])]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' ')
}

/**
 * Detects whether a Pages `body` blocks array contains at least one
 * `productRoundup` block with an item carrying an `affiliateUrl`. Those items
 * render as rel="sponsored" CTAs, so — exactly like a sponsored body link — they
 * MUST trigger the FTC <AffiliateDisclosure>. The roundup's affiliate links live
 * in a structured field (not inline Lexical link nodes), so `bodyHasSponsoredLink`
 * can't see them; the [slug] page ORs this with that walk.
 *
 * Accepts the raw blocks array (or anything); returns false for non-arrays.
 */
export function blocksHaveAffiliateRoundup(blocks: unknown): boolean {
  if (!Array.isArray(blocks)) return false
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const b = block as {
      blockType?: string
      items?: { affiliateUrl?: string | null }[] | null
    }
    if (b.blockType !== 'productRoundup') continue
    for (const item of b.items ?? []) {
      if (item && typeof item.affiliateUrl === 'string' && item.affiliateUrl.trim()) return true
    }
  }
  return false
}

/**
 * Detects whether a Lexical body contains at least one link the author flagged as
 * a paid/affiliate link (link node `fields.linkRel === 'sponsored'`). Drives whether
 * the FTC <AffiliateDisclosure> must be rendered above the article. Outbound editorial
 * citations (no linkRel, or linkRel 'ugc'/'nofollow') do NOT trigger a disclosure.
 */
export function bodyHasSponsoredLink(data: unknown): boolean {
  const root = (data as { root?: { children?: unknown[] } } | null)?.root
  if (!root?.children) return false
  let found = false
  const walk = (node: unknown): void => {
    if (found || !node || typeof node !== 'object') return
    const n = node as { type?: string; fields?: { linkRel?: string }; children?: unknown[] }
    if ((n.type === 'link' || n.type === 'autolink') && n.fields?.linkRel === 'sponsored') {
      found = true
      return
    }
    for (const c of n.children ?? []) walk(c)
  }
  for (const c of root.children) walk(c)
  return found
}
