import type { CollectionConfig, CollectionSlug } from 'payload'
import { aeoFields } from '@/collections/_shared/aeo-fields'
import { revalidateAfterChange } from '@/hooks/revalidate-after-change'
import { isAdminOrEditor, publicReadOnlyPublished } from '@/lib/access'

/**
 * Categories — the SITE's first-class blog taxonomy (design g6, Plane B).
 *
 * One document = one blog category the reader sees and that the category hub
 * page (`/blog/category/<slug>`) renders from. Today blog categories are a
 * free-text string array on blog-posts (`BlogPosts.ts` `categories`), so the
 * taxonomy is *emergent* from whatever strings land on posts — two posts in the
 * same coordinated platform category can fragment into "Home Energy",
 * "home-energy", "Energy Savings". This collection makes the taxonomy a seeded,
 * canonical entity with a stable join key.
 *
 * SEEDED at provision from the platform's coordinated `website_categories`
 * (Plane A) via the `seed_categories` authoring tool — the site writes its own
 * rows idempotently, the platform only POSTs the chosen set. `slug` is the join
 * key back to the platform pool row, and `platformCategoryId` carries the
 * numeric pool id for cross-plane reconciliation.
 *
 * ADDITIVE + archetype-agnostic: every site ships a blog, so this is mounted
 * UNCONDITIONALLY (unlike ServiceAreas / Products, which are archetype-gated).
 * It introduces no required change to existing posts — the legacy free-text
 * `categories` array on blog-posts still renders, so the 3 live sites are
 * untouched until they are re-provisioned with a seeded taxonomy.
 *
 * Reuses the same building blocks as BlogPosts / ServiceAreas: shared
 * `aeoFields`, the public-read-only-published access policy, and the
 * revalidate-after-change hook (the hook no-ops for any collection it does not
 * have a path builder for, so no extra wiring is needed for `categories`).
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent'],
    description:
      'The blog taxonomy. Seeded at provision from the coordinated platform website_categories; ' +
      'drives the /blog/category/<slug> hub pages.',
  },
  access: {
    create: isAdminOrEditor,
    read: publicReadOnlyPublished,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: { afterChange: [revalidateAfterChange] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'URL-safe slug — the join key to the platform website_categories pool row and the ' +
          'segment in /blog/category/<slug>. Seeded; do not hand-edit.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Rendered on the category hub page.' },
    },
    {
      // Optional self-relationship so a niche can express a shallow hierarchy
      // (parent → child). Nullable + empty by default, so a flat taxonomy (the
      // common case) is unaffected.
      name: 'parent',
      type: 'relationship',
      // Self-relationship. Cast: this very collection is mounted by the wiring
      // stream in payload.config, so `categories` is absent from the generated
      // CollectionSlug union until then — same boundary cast BlogPosts uses.
      relationTo: 'categories' as CollectionSlug,
      admin: { description: 'Optional parent category for a shallow hierarchy.' },
    },
    {
      name: 'platformCategoryId',
      type: 'number',
      index: true,
      admin: {
        description:
          'website_categories.id (Plane A join key). Seeded from the platform; do not edit.',
      },
    },
    aeoFields,
  ],
}
