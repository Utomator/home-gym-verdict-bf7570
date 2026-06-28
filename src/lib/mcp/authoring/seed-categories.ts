import type { CollectionSlug } from 'payload'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { AuthoringToolDef } from './types'

// The `categories` collection is mounted by the wiring stream in payload.config,
// so it is absent from the DEFAULT-archetype generated CollectionSlug union until
// then. Narrow cast, same boundary pattern as upsert-product.ts's PRODUCTS —
// resolves to the real collection at runtime once mounted.
const CATEGORIES = 'categories' as CollectionSlug

/**
 * seed_categories — seed/upsert the SITE's blog taxonomy (the `categories`
 * collection, design g6 Plane B) from the platform-coordinated
 * `website_categories` pool.
 *
 * Idempotent on `slug` (slug is unique + indexed on the collection): re-running
 * a provision, or topping up the approved category plan, never duplicates a
 * category — an existing slug is UPDATED in place, a new slug is CREATED. So a
 * fleet re-run / re-populate is safe (the self-healing property the 300/mo
 * pipeline needs).
 *
 * The platform is a BRIDGE: it POSTs the chosen categories; the site writes its
 * own rows. Mirrors create_blog_post / upsert_product exactly: a Zod Input,
 * structured `{ error, detail }` on any handled failure (never throws across the
 * MCP boundary), and overrideAccess: true (already gated by the authoring bearer
 * token at the /mcp/authoring route).
 */
const CategoryInput = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullish(),
  // The numeric platform website_categories.id, when known (the Plane A join
  // key). Coerced so a stringified id from the platform still resolves.
  platform_category_id: z.coerce.number().int().positive().nullish(),
})

const Input = z.object({
  categories: z.array(CategoryInput).min(1),
})

/**
 * Success shape reports how many slugs were processed and which path each took,
 * so the platform-side caller can log create-vs-skip without a second round-trip.
 * On any handled failure returns `{ error, detail? }` — error code:
 * validation_failed.
 */
type Out =
  | { seeded: number; created: string[]; updated: string[]; slugs: string[] }
  | { error: string; detail?: string }

export const seedCategories: AuthoringToolDef<typeof Input, Out> = {
  name: 'seed_categories',
  description:
    'Seed/upsert the site blog taxonomy (the categories collection) from the platform-' +
    'coordinated website_categories pool. Accepts a list of { title, slug, description?, ' +
    'platform_category_id? }. Idempotent on slug: an existing slug is updated in place, a ' +
    'new slug is created — re-running never duplicates a category. Returns ' +
    '{ seeded, created, updated, slugs }. Privileged: only reachable through the ' +
    'authenticated /mcp/authoring endpoint.',
  inputSchema: Input,
  handler: async ({ payload }, input) => {
    const created: string[] = []
    const updated: string[] = []
    const slugs: string[] = []

    try {
      for (const c of input.categories) {
        const data = {
          title: c.title,
          slug: c.slug,
          ...(c.description ? { description: c.description } : {}),
          ...(c.platform_category_id != null ? { platformCategoryId: c.platform_category_id } : {}),
        }

        // Idempotent get-or-update keyed on slug (unique + indexed).
        const existing = await payload.find({
          collection: CATEGORIES,
          where: { slug: { equals: c.slug } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })

        if (existing.totalDocs > 0 && existing.docs[0]) {
          await payload.update({
            collection: CATEGORIES,
            id: (existing.docs[0] as { id: string | number }).id,
            data: data as never,
            overrideAccess: true,
          })
          updated.push(c.slug)
        } else {
          await payload.create({
            collection: CATEGORIES,
            data: data as never,
            overrideAccess: true,
          })
          created.push(c.slug)
        }
        slugs.push(c.slug)
      }
    } catch (err) {
      logger.error({ err }, 'seed_categories: seed failed')
      return {
        error: 'validation_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    return { seeded: slugs.length, created, updated, slugs }
  },
}
