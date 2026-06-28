import type { CollectionConfig, CollectionSlug } from 'payload'
import { aeoFields } from '@/collections/_shared/aeo-fields'
import { revalidateAfterChange } from '@/hooks/revalidate-after-change'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', '_status'],
  },
  access: {
    create: isAdminOrEditor,
    read: publicReadOnlyPublished,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 25,
  },
  hooks: { afterChange: [revalidateAfterChange] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea', maxLength: 300 },
    { name: 'body', type: 'richText', required: true },
    { name: 'publishedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'author', type: 'relationship', relationTo: 'people' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      // Reference EXISTING Products by relationship (single source of truth) — do
      // NOT re-author product data inline. Rendered as a dynamic recommendation
      // block at the foot of the post (RecommendedProducts). `products` is only in
      // the CollectionSlug union under the affiliate archetype, so the cast mirrors
      // create-service-area.ts:47 / content-registry. Nullable + empty by default,
      // so every existing post (and the 3 live sites' posts) renders as today; when
      // Products is unmounted the relationship resolves to nothing and the foot
      // block renders nothing.
      name: 'recommendedProducts',
      type: 'relationship',
      relationTo: 'products' as CollectionSlug,
      hasMany: true,
      admin: {
        description:
          'Products surfaced in a dynamic recommendation block at the foot of this post. ' +
          'Reference existing Products by relationship — do NOT re-author product data inline.',
      },
    },
    {
      // (g6) Canonical category relationship to the seeded Categories taxonomy.
      // Drives /blog/category/<slug>. Nullable + empty by default, so every
      // existing post (and the 3 live sites' posts) renders exactly as today;
      // create_blog_post resolves a supplied category string to this row when it
      // matches a seeded slug (BB-6), otherwise leaves it unset.
      name: 'category',
      type: 'relationship',
      // Cast: the `categories` collection is mounted by the wiring stream in
      // payload.config; until then it is absent from the generated CollectionSlug
      // union — same boundary cast BlogPosts uses for `products` above.
      relationTo: 'categories' as CollectionSlug,
      admin: {
        description:
          'Canonical category (seeded taxonomy). Drives /blog/category/<slug>. ' +
          'Resolved from the claimed category slug; the legacy free-text categories ' +
          'array below is retained for back-compat.',
      },
    },
    {
      // Legacy free-text categories — RETAINED so existing posts on the 3 live
      // sites still render. The category archive prefers the `category`
      // relationship above and falls back to this string array.
      name: 'categories',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    aeoFields,
  ],
}
