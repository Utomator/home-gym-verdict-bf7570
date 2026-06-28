import type { CollectionConfig } from 'payload'
import { aeoFields } from '@/collections/_shared/aeo-fields'
import { revalidateAfterChange } from '@/hooks/revalidate-after-change'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

/**
 * ServiceAreas — the LEAD-GEN archetype's programmatic-SEO collection.
 *
 * One document = one "service in a city" landing page (e.g. "Emergency
 * Plumbing in Austin"), surfaced at `/[service]/[city]`. This is the local
 * lead-gen equivalent of the affiliate site's blog-posts: a large set of
 * intent-targeted pages, each capturing leads for one service × one location.
 *
 * CONDITIONAL: this collection is mounted in payload.config ONLY when the Site
 * Brief declares `archetype: 'leadgen'`. The default (affiliate) config never
 * mounts it, so the affiliate baseline needs no migration. A `service-areas`
 * entry already exists (reserved) in the content-registry, so the moment this
 * collection is mounted it lights up sitemap.xml / llms.txt automatically.
 *
 * Reuses the same building blocks as Pages / BlogPosts: shared `aeoFields`
 * (answer summary, key takeaways, FAQ, lastReviewedAt), drafts + autosave, the
 * public-read-only-published access policy, and the revalidate-after-change
 * hook (the hook no-ops for unknown collections, so no extra wiring needed).
 */
export const ServiceAreas: CollectionConfig = {
  slug: 'service-areas',
  labels: { singular: 'Service Area', plural: 'Service Areas' },
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['service', 'city', 'slug', '_status'],
    description:
      'One “service in a city” lead page (e.g. Emergency Plumbing in Austin), served at /[service]/[city].',
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
    {
      name: 'service',
      type: 'text',
      required: true,
      admin: { description: 'The service offered, e.g. "Emergency Plumbing".' },
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      admin: { description: 'The city / locality served, e.g. "Austin".' },
    },
    {
      name: 'region',
      type: 'text',
      admin: { description: 'Optional state / region, e.g. "TX". Used in LocalBusiness JSON-LD.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Canonical URL slug in the form "<service>/<city>" (e.g. "emergency-plumbing/austin").',
      },
    },
    {
      name: 'intro',
      type: 'text',
      admin: { description: 'Short lede shown in the hero + used for meta description / AEO.' },
    },
    { name: 'body', type: 'richText' },
    {
      name: 'highlights',
      type: 'array',
      label: 'Highlights (rendered as a FeatureGrid)',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    aeoFields,
  ],
}
