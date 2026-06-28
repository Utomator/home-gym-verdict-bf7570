import { RoundupCard, type RoundupItem } from './ProductRoundup'

/**
 * A depth-resolved `products` doc (Products.ts) as it arrives on a post's
 * `recommendedProducts` relationship at depth >= 1. Superset of RoundupItem.
 */
export type ProductDoc = {
  id?: string | number | null
  name?: string | null
  slug?: string | null
  affiliateUrl?: string | null
  imageUrl?: string | null
  image?: { url?: string | null } | number | null
  rating?: number | null
  price?: string | null
  badge?: string | null
  pros?: ({ value?: string | null } | null)[] | null
  cons?: ({ value?: string | null } | null)[] | null
  blurb?: RoundupItem['blurb']
  /** Facts-provenance "as-of" date (critique-quality C1) — when price/specs were verified. */
  factsAsOf?: string | null
}

/** Prefer the real Media doc's URL; fall back to the bare imageUrl string. */
const imageUrlOf = (p: ProductDoc): string | undefined => {
  if (p.image && typeof p.image === 'object' && p.image.url) return p.image.url
  return p.imageUrl ?? undefined
}

/** Map a resolved Products doc to the card's existing RoundupItem shape (1:1). */
const toRoundupItem = (p: ProductDoc): RoundupItem => ({
  id: p.id != null ? String(p.id) : undefined,
  name: p.name,
  slug: p.slug,
  affiliateUrl: p.affiliateUrl,
  imageUrl: imageUrlOf(p),
  rating: p.rating,
  price: p.price,
  badge: p.badge,
  pros: p.pros,
  cons: p.cons,
  blurb: p.blurb,
})

/** The most recent facts-provenance date across the rendered products, if any. */
const latestFactsAsOf = (docs: ProductDoc[]): string | undefined => {
  const dates = docs
    .map((p) => p.factsAsOf)
    .filter((d): d is string => Boolean(d))
    .sort()
  return dates.length ? dates[dates.length - 1] : undefined
}

/**
 * RecommendedProducts — renders a post's/page's `recommendedProducts` relationship
 * as the same comparison cards ProductRoundup uses, but from CMS product DOCS
 * (single source of truth) rather than inline block items. Each CTA points at the
 * pre-resolved affiliateUrl with rel="sponsored nofollow" (RoundupCard / CTA_REL).
 * The presence of these links is what the page's disclosure gate uses to show the
 * FTC AffiliateDisclosure (see blog/[slug]/page.tsx wiring).
 *
 * `products` may arrive as unresolved ids (depth 0) or resolved docs (depth >= 1).
 * The renderer filters to objects with a name, so a low-depth read or an
 * unmounted-collection read simply renders nothing — robust by construction.
 */
export function RecommendedProducts({
  products,
  heading = 'Our top picks',
}: {
  products?: (ProductDoc | number | string | null)[] | null
  heading?: string
}) {
  const docs = (products ?? []).filter(
    (p): p is ProductDoc => typeof p === 'object' && p !== null && Boolean(p.name?.trim()),
  )
  if (docs.length === 0) return null
  const asOf = latestFactsAsOf(docs)
  const asOfLabel = asOf
    ? new Date(asOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  return (
    <section
      className="not-prose my-12 border-t border-border pt-10"
      aria-label="Recommended products"
    >
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{heading}</h2>
      {asOfLabel ? (
        <p className="mb-6 text-sm text-muted-foreground">Facts verified as of {asOfLabel}.</p>
      ) : (
        <div className="mb-6" />
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((p, i) => (
          <RoundupCard key={p.id ?? `${p.name}-${i}`} item={toRoundupItem(p)} />
        ))}
      </div>
    </section>
  )
}
