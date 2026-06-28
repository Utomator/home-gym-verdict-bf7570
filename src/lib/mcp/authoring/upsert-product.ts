import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { CollectionSlug } from 'payload'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { AuthoringToolDef } from './types'

/**
 * upsert_product — mints OR updates ONE reusable `products` doc, idempotent on
 * `slug` (find-then-create-or-update). A product is the single source of truth for
 * a recommended affiliate product: authored ONCE here, then REFERENCED by N blog
 * posts via create_blog_post.recommended_product_slugs.
 *
 * Mirrors create_page / create_service_area EXACTLY: a Zod Input, Markdown→Lexical
 * for `blurb` via editorConfigFactory.default({ config: payload.config }) +
 * convertMarkdownToLexical, structured `{ error, detail }` on any handled failure
 * (never throws across the MCP boundary), and overrideAccess: true (already gated
 * by the authoring bearer token at the route).
 *
 * `affiliate_url` is the ALREADY-RESOLVED value from
 * mcp__platform__resolve_affiliate_link (§7.5) — stored as-is, exactly like the
 * inline roundup does. The tracking tag was appended in CODE upstream, never here.
 *
 * Products is mounted only under the affiliate archetype, so it is absent from the
 * DEFAULT-archetype CollectionSlug union. Narrow cast, same pattern as
 * create-service-area.ts — resolves the real collection at runtime when mounted.
 */
const PRODUCTS = 'products' as CollectionSlug

const SpecRow = z.object({ label: z.string().min(1), value: z.string().min(1) })

const Input = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().nullish(),
  excerpt: z.string().max(300).nullish(),
  // PRE-RESOLVED affiliate link from mcp__platform__resolve_affiliate_link (§7.5).
  // Stored as-is; the tracking tag was appended in CODE upstream, never here.
  affiliate_url: z.string().min(1),
  program: z.string().nullish(),
  product_key: z.string().nullish(),
  // Numeric id of an ALREADY-UPLOADED Media doc (preferred), or a bare image URL
  // fallback (generated image). Same boundary as create_page's image_media_id.
  image_media_id: z.coerce.number().int().positive().nullish(),
  image_url: z.string().nullish(),
  rating: z.coerce.number().min(0).max(5).nullish(),
  price: z.string().nullish(),
  badge: z.string().nullish(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  specs: z.array(SpecRow).optional(),
  category: z.array(z.string()).optional(),
  blurb_markdown: z.string().nullish(),
  // FACTS PROVENANCE (critique-quality C1): when price/specs were last verified.
  facts_as_of: z.string().nullish(),
  answer_summary: z.string().max(600).nullish(),
  key_takeaways: z.array(z.string()).optional(),
  // Products default to DRAFT (critique-quality C3): a product stays unpublished
  // until the referencing post passes QA. A populate/design session opts a product
  // into `published` explicitly once its post is verified.
  publish: z.boolean().default(false),
})

/**
 * Idempotent: returns the same shape on create and on update so the session can
 * upsert blindly. `created` tells it which path ran. Error codes mirror the family:
 * lexical_conversion_failed, validation_failed. (No slug_conflict — slug match =
 * update.)
 */
type Out =
  | { id: string; slug: string; url: string; status: 'draft' | 'published'; created: boolean }
  | { error: string; detail?: string }

export const upsertProduct: AuthoringToolDef<typeof Input, Out> = {
  name: 'upsert_product',
  description:
    'Create OR update one reusable Products document (the single source of truth for a ' +
    'recommended affiliate product), idempotent on slug. affiliate_url MUST be the value ' +
    'returned by mcp__platform__resolve_affiliate_link — never fabricate a tracking tag. ' +
    'blurb_markdown is converted to Lexical server-side. Blogs then reference the product ' +
    'by slug (create_blog_post.recommended_product_slugs) instead of re-authoring it inline. ' +
    'Products default to draft until the referencing post passes QA. Privileged: only ' +
    'reachable through the authenticated /mcp/authoring endpoint.',
  inputSchema: Input,
  handler: async ({ payload }, input) => {
    // (1) Build blurb Lexical with the SAME editor config Payload renders with.
    let editorConfig: Awaited<ReturnType<typeof editorConfigFactory.default>>
    try {
      editorConfig = await editorConfigFactory.default({ config: payload.config })
    } catch (err) {
      logger.error({ err }, 'upsert_product: editor config resolution failed')
      return {
        error: 'lexical_conversion_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
    let blurb: ReturnType<typeof convertMarkdownToLexical> | undefined
    try {
      if (input.blurb_markdown) {
        blurb = convertMarkdownToLexical({ editorConfig, markdown: input.blurb_markdown })
      }
    } catch (err) {
      logger.error({ err }, 'upsert_product: lexical conversion failed')
      return {
        error: 'lexical_conversion_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    // (2) Assemble the doc data. affiliateUrl stored as-is (already resolved §7.5).
    // program/productKey live under the `affiliate` group so a later fleet job can
    // re-resolve affiliateUrl when a tracking tag rotates.
    const data = {
      name: input.name,
      slug: input.slug,
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      affiliateUrl: input.affiliate_url,
      ...(input.program || input.product_key
        ? {
            affiliate: {
              ...(input.program ? { program: input.program } : {}),
              ...(input.product_key ? { productKey: input.product_key } : {}),
            },
          }
        : {}),
      ...(input.image_media_id != null ? { image: input.image_media_id } : {}),
      ...(input.image_url ? { imageUrl: input.image_url } : {}),
      ...(input.rating != null ? { rating: input.rating } : {}),
      ...(input.price ? { price: input.price } : {}),
      ...(input.badge ? { badge: input.badge } : {}),
      pros: (input.pros ?? []).map((value) => ({ value })),
      cons: (input.cons ?? []).map((value) => ({ value })),
      specs: input.specs ?? [],
      category: (input.category ?? []).map((value) => ({ value })),
      ...(input.facts_as_of ? { factsAsOf: input.facts_as_of } : {}),
      ...(blurb ? { blurb } : {}),
      _status: input.publish ? ('published' as const) : ('draft' as const),
      aeo: {
        answerSummary: input.answer_summary ?? undefined,
        keyTakeaways: (input.key_takeaways ?? []).map((point) => ({ point })),
      },
    }

    // (3) Upsert on slug. overrideAccess: true — gated by the authoring bearer token.
    try {
      const existing = await payload.find({
        collection: PRODUCTS,
        where: { slug: { equals: input.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0 && existing.docs[0]) {
        const doc = await payload.update({
          collection: PRODUCTS,
          id: (existing.docs[0] as { id: string | number }).id,
          overrideAccess: true,
          data: data as never,
        })
        const status = ((doc as { _status?: string })._status ?? 'draft') as 'draft' | 'published'
        return {
          id: String((doc as { id: string | number }).id),
          slug: input.slug,
          url: `/products/${input.slug}`,
          status,
          created: false,
        }
      }
      const doc = await payload.create({
        collection: PRODUCTS,
        overrideAccess: true,
        data: data as never,
      })
      const status = ((doc as { _status?: string })._status ?? 'draft') as 'draft' | 'published'
      return {
        id: String((doc as { id: string | number }).id),
        slug: input.slug,
        url: `/products/${input.slug}`,
        status,
        created: true,
      }
    } catch (err) {
      logger.error({ err }, 'upsert_product: upsert failed')
      return {
        error: 'validation_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  },
}
