// @p51/engine — framework-agnostic SEO engine.
//
// PURITY CONTRACT: this package must NOT runtime-import `payload`, `@/collections`,
// or `next` (or any app-internal module). Type-only imports from those packages are
// allowed (e.g. `import type { Metadata } from 'next'` in metadata.ts) because they
// are erased at build time. See README.md for the rationale and the guard.

export type { LinkRel } from './affiliate'
// --- affiliate ---
export { blocksHaveAffiliateRoundup, bodyHasSponsoredLink, outboundRel } from './affiliate'
export type { ContentSignalPolicy } from './content-signals'
// --- content-signals (AI content-signal policy header) ---
export { renderContentSignal } from './content-signals'
export type { RssChannel, RssItem } from './feed'
// --- feed ---
export { buildRssXml } from './feed'
export type { RoundupItem } from './json-ld'
// --- json-ld ---
export {
  aggregateRatingSchema,
  articleSchema,
  breadcrumbList,
  collectionPageSchema,
  faqPageSchema,
  itemListSchema,
  lexicalToPlainText,
  localBusinessSchema,
  organizationSchema,
  personSchema,
  productRoundupSchema,
  productSchema,
  profilePageSchema,
  reviewSchema,
  serviceSchema,
  webPageSchema,
  websiteSchema,
} from './json-ld'
// --- lexical → html (RSS content:encoded bodies) ---
export { lexicalToHtml } from './lexical-html'
export type {
  BarChartOptions,
  BrandedHeroOptions,
  ChartDatum,
  ComparisonBarsOptions,
  MediaPalette,
} from './media-svg'
// --- media-svg (Tier-1 code-generated visuals: hero/og + charts) ---
export {
  barChartSvg,
  brandedHeroSvg,
  comparisonBarsSvg,
  resolveMediaPalette,
  svgToDataUri,
} from './media-svg'
export type { OgImage } from './metadata'
// --- metadata ---
export { absUrl, ogImages, seoMeta } from './metadata'
export type { SitemapEntry } from './sitemap'
// --- sitemap ---
export { buildSitemapXml } from './sitemap'
export type { TocHeading } from './toc'
// --- toc ---
export { extractHeadings, nodeText, slugifyHeading } from './toc'
