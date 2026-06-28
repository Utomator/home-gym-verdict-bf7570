import type { CollectionConfig } from 'payload'
import { aeoFields } from '@/collections/_shared/aeo-fields'
import { revalidateAfterChange } from '@/hooks/revalidate-after-change'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

/**
 * Products — first-class, reusable, queryable affiliate product entities.
 *
 * Replaces the per-page inline `productRoundup.items` array (Pages.ts) as the
 * single source of truth for a recommended product. A product is authored ONCE
 * (via upsert_product, idempotent on slug) and then REFERENCED by N blog posts /
 * pages through a `relationship` field — so its url/rating/price update in one
 * place and one product can appear in many articles. `affiliateUrl` is the
 * PRE-RESOLVED link from mcp__platform__resolve_affiliate_link (§7.5); the
 * tracking tag is appended in CODE, never authored. The CTA renders
 * rel="sponsored nofollow" and its presence gates the FTC AffiliateDisclosure +
 * Product/Review ItemList JSON-LD.
 *
 * CONDITIONAL MOUNT: registered only when siteConfig.archetype === 'affiliate'
 * (payload.config.ts), exactly mirroring ServiceAreas for leadgen. leadgen /
 * landing sites — and the 3 live sites until re-provisioned — render identically
 * to today (the collection is simply not mounted, so no migration runs there).
 *
 * Reuses the same building blocks as Pages / BlogPosts / ServiceAreas: shared
 * `aeoFields`, drafts + autosave, the public-read-only-published access policy,
 * and the revalidate-after-change hook.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'brand', 'rating', 'price', '_status'],
  },
  access: {
    create: isAdminOrEditor,
    read: publicReadOnlyPublished,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  hooks: { afterChange: [revalidateAfterChange] },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'brand',
      type: 'text',
      admin: { description: 'Manufacturer / brand, e.g. "Bowflex".' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Short one-line summary used in cards / listings / meta description.' },
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'PRE-RESOLVED affiliate link from resolve_affiliate_link (§7.5). Rendered ' +
          'rel="sponsored nofollow". NEVER hand-write a tracking tag here.',
      },
    },
    {
      name: 'affiliate',
      type: 'group',
      label: 'Affiliate resolution source',
      admin: {
        description: 'Lets a later fleet job re-resolve affiliateUrl when a tracking tag rotates.',
      },
      fields: [
        {
          name: 'program',
          type: 'text',
          admin: { description: 'Affiliate program name (§7.5), e.g. "amazon-us".' },
        },
        {
          name: 'productKey',
          type: 'text',
          admin: { description: 'product_map key (§7.5) — lets a build re-resolve affiliateUrl.' },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Real Media doc (preferred). Falls back to imageUrl when unset.' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Fallback image URL when no Media doc is available (generated image).',
      },
    },
    { name: 'rating', type: 'number', min: 0, max: 5 },
    {
      name: 'price',
      type: 'text',
      admin: { description: 'Display price, e.g. "$299". Free text.' },
    },
    {
      name: 'badge',
      type: 'text',
      admin: { description: 'e.g. "Best overall", "Editor\'s pick".' },
    },
    { name: 'pros', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'cons', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    {
      name: 'specs',
      type: 'array',
      label: 'Specifications',
      admin: { description: 'Key/value spec rows — feed the dynamic ComparisonTable columns.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'category',
      type: 'array',
      admin: { description: 'Taxonomy values, mirrors blog `categories`. Powers a future hub.' },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      // FACTS PROVENANCE (critique-quality C1). The "as-of" date the product's
      // facts (price / specs / availability) were last verified against the
      // source. Drives a visible "Facts verified as of …" line and feeds
      // dateModified in Product JSON-LD so stale affiliate data is auditable.
      name: 'factsAsOf',
      type: 'date',
      label: 'Facts verified as of',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description:
          'When the price/specs/availability were last checked against the source. ' +
          'Surfaces a "Facts verified as of …" provenance line and dateModified in JSON-LD.',
      },
    },
    { name: 'blurb', type: 'richText' },
    aeoFields,
  ],
}
