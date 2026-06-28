import type { CollectionConfig } from 'payload'
import { aeoFields } from '@/collections/_shared/aeo-fields'
import { revalidateAfterChange } from '@/hooks/revalidate-after-change'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status'] },
  access: {
    create: isAdminOrEditor,
    read: publicReadOnlyPublished,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  hooks: { afterChange: [revalidateAfterChange] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'body',
      type: 'blocks',
      blocks: [
        {
          slug: 'richText',
          fields: [{ name: 'content', type: 'richText', required: true }],
        },
        {
          slug: 'cta',
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'subheading', type: 'textarea' },
            { name: 'buttonLabel', type: 'text', required: true },
            { name: 'buttonHref', type: 'text', required: true },
          ],
        },
        {
          slug: 'mediaWithText',
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            { name: 'content', type: 'richText', required: true },
            {
              name: 'imagePosition',
              type: 'select',
              options: ['left', 'right'],
              defaultValue: 'left',
            },
          ],
        },
        {
          // The affiliate roundup / comparison block — the high-commercial-intent
          // "best X for Y" / "X vs Y" / "top N" money page. Each item's `affiliateUrl`
          // is the PRE-RESOLVED affiliate link (the platform's resolve_affiliate_link
          // supplies it); it is rendered as a rel="sponsored nofollow" CTA, which is
          // what gates the FTC AffiliateDisclosure at the top of the page.
          slug: 'productRoundup',
          fields: [
            { name: 'intro', type: 'richText' },
            {
              name: 'items',
              type: 'array',
              minRows: 1,
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'slug', type: 'text' },
                {
                  name: 'affiliateUrl',
                  type: 'text',
                  required: true,
                  admin: { description: 'Pre-resolved affiliate link. Rendered rel="sponsored".' },
                },
                { name: 'imageUrl', type: 'text' },
                { name: 'rating', type: 'number', min: 0, max: 5 },
                { name: 'price', type: 'text' },
                { name: 'badge', type: 'text', admin: { description: 'e.g. "Best overall"' } },
                { name: 'pros', type: 'array', fields: [{ name: 'value', type: 'text' }] },
                { name: 'cons', type: 'array', fields: [{ name: 'value', type: 'text' }] },
                { name: 'blurb', type: 'richText' },
              ],
            },
            { name: 'verdict', type: 'richText' },
          ],
        },
        {
          // A pure code-generated data chart (Tier-1 media, zero API key). Renders
          // as an on-brand inline SVG via barChartSvg / comparisonBarsSvg. Adds a
          // scannable visual to data-driven sections (stats, "X vs Y", ratings) —
          // visuals lift dwell + feed Google Images, with no external dependency.
          slug: 'dataChart',
          fields: [
            { name: 'title', type: 'text', admin: { description: 'Chart heading (optional).' } },
            {
              name: 'chartType',
              type: 'select',
              defaultValue: 'bar',
              options: [
                { label: 'Bar (vertical)', value: 'bar' },
                { label: 'Comparison (horizontal)', value: 'comparison' },
              ],
            },
            {
              name: 'max',
              type: 'number',
              admin: {
                description: 'Fixed max scale for the comparison type, e.g. 5 for ratings.',
                condition: (_, sibling) => sibling?.chartType === 'comparison',
              },
            },
            {
              name: 'items',
              type: 'array',
              minRows: 1,
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'number', required: true },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    aeoFields,
  ],
}
