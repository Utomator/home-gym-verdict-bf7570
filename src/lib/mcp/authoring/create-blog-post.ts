import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { CollectionSlug } from 'payload'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { createPage } from './create-page'
import { createServiceArea } from './create-service-area'
import { seedCategories } from './seed-categories'
import type { AuthoringToolDef } from './types'
import { upsertProduct } from './upsert-product'

const Input = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().max(300).nullish(),
  body_markdown: z.string().min(1),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  // OPTIONAL: slugs of EXISTING Products docs to surface in the dynamic
  // recommendation block at the foot of this post. Resolved to relationship ids
  // below; unknown/unmounted slugs are silently skipped (back-compat — a missing
  // product never fails the post create).
  recommended_product_slugs: z.array(z.string()).optional(),
  publish: z.boolean().default(false),
  hero_image_url: z.string().nullish(),
  answer_summary: z.string().max(600).nullish(),
  key_takeaways: z.array(z.string()).optional(),
  meta_description: z.string().nullish(),
})

/**
 * Success shape per contract §3.1. On any handled failure the tool returns a
 * structured `{ error, detail? }` object instead — it never throws across the MCP
 * boundary. Error codes: slug_conflict, lexical_conversion_failed,
 * validation_failed. (unauthorized is handled by the route gate before this runs.)
 */
type Out =
  | { id: string; url: string; status: 'draft' | 'published' }
  | { error: string; detail?: string }

export const createBlogPost: AuthoringToolDef<typeof Input, Out> = {
  name: 'create_blog_post',
  description:
    'Create a blog-posts document from Markdown. Converts body_markdown to Payload ' +
    'Lexical server-side and writes the doc via the local API. Privileged: only ' +
    'reachable through the authenticated /mcp/authoring endpoint.',
  inputSchema: Input,
  handler: async ({ payload }, input) => {
    // (1) Pre-check slug uniqueness for a clean, structured slug_conflict rather
    // than a raw DB unique-violation. `slug` is unique+indexed on blog-posts.
    try {
      const existing = await payload.find({
        collection: 'blog-posts',
        where: { slug: { equals: input.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        return { error: 'slug_conflict', detail: `slug "${input.slug}" already exists` }
      }
    } catch (err) {
      logger.error({ err }, 'create_blog_post: slug pre-check failed')
      return { error: 'validation_failed', detail: 'slug pre-check failed' }
    }

    // (2) Convert Markdown -> Lexical SerializedEditorState using the SAME editor
    // config Payload renders with, so round-trips stay faithful. The model never
    // sees Lexical.
    let body: ReturnType<typeof convertMarkdownToLexical>
    try {
      // `payload.config` is the already-sanitized, resolved SanitizedConfig from
      // the running instance — exactly what editorConfigFactory.default expects
      // (importing @/payload.config directly yields an unresolved Promise).
      body = convertMarkdownToLexical({
        editorConfig: await editorConfigFactory.default({ config: payload.config }),
        markdown: input.body_markdown,
      })
    } catch (err) {
      logger.error({ err }, 'create_blog_post: lexical conversion failed')
      return {
        error: 'lexical_conversion_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    // (2b) Resolve recommended product slugs -> relationship ids. Unknown/unmounted
    // -> skipped (the relationship is additive; a missing product, or a leadgen/
    // landing site without the Products collection, never fails the post create).
    let recommendedProducts: number[] | undefined
    if (input.recommended_product_slugs?.length) {
      try {
        const found = await payload.find({
          collection: 'products' as CollectionSlug,
          where: { slug: { in: input.recommended_product_slugs } },
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })
        recommendedProducts = found.docs.map((d) => Number((d as { id: string | number }).id))
      } catch (err) {
        logger.warn({ err }, 'create_blog_post: recommended product resolution failed; skipping')
      }
    }

    // (2c) Resolve the FIRST supplied category string to a seeded canonical
    // Categories row by slug (design g6, BB-6 — defense in depth). HIT ⇒ set the
    // `category` relationship that drives /blog/category/<slug>, while the legacy
    // free-text `categories` array is still mirrored below for back-compat. MISS
    // (or no `categories` collection on this site / a DB hiccup) ⇒ leave the
    // relationship unset and fall back to pure passthrough, so a legacy free-text
    // string still lands on the post and NO existing caller breaks.
    let categoryRel: number | undefined
    const firstCategory = input.categories?.[0]
    if (firstCategory) {
      try {
        const match = await payload.find({
          // Cast: `categories` is mounted by the wiring stream in payload.config,
          // so it is absent from the DEFAULT-archetype CollectionSlug union until
          // then — same boundary cast as the `products` lookup above.
          collection: 'categories' as CollectionSlug,
          where: { slug: { equals: firstCategory } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (match.totalDocs > 0 && match.docs[0]) {
          categoryRel = Number((match.docs[0] as { id: string | number }).id)
        }
      } catch (err) {
        logger.warn({ err }, 'create_blog_post: category resolution failed; passthrough only')
      }
    }

    // (3) Create the document. overrideAccess: true — this runs in a server-trusted
    // context already gated by the authoring bearer token at the route.
    //
    // hero_image_url: documented slice no-op. We do NOT ingest the external URL into
    // `media` here (out of scope) and we MUST NOT fail the create because of it, so
    // `heroImage` is simply left unset.
    // meta_description: reserved — no matching collection field; intentionally dropped.
    const publish = input.publish
    try {
      const doc = await payload.create({
        collection: 'blog-posts',
        overrideAccess: true,
        data: {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? undefined,
          body,
          categories: (input.categories ?? []).map((value) => ({ value })),
          // (g6) Canonical category relationship (drives /blog/category/<slug>).
          // Only set when the first category string resolved to a seeded row, so
          // an unmatched string is pure passthrough (back-compat).
          ...(categoryRel != null ? { category: categoryRel } : {}),
          tags: (input.tags ?? []).map((value) => ({ value })),
          ...(recommendedProducts?.length ? { recommendedProducts } : {}),
          _status: publish ? 'published' : 'draft',
          publishedAt: publish ? new Date().toISOString() : undefined,
          aeo: {
            answerSummary: input.answer_summary ?? undefined,
            keyTakeaways: (input.key_takeaways ?? []).map((point) => ({ point })),
          },
          // Cast: `recommendedProducts` targets the affiliate-only `products`
          // collection, absent from the DEFAULT-archetype generated types — same
          // boundary create-service-area.ts casts. Resolves at runtime when mounted.
        } as never,
      })

      const status = ((doc as { _status?: string })._status ?? 'draft') as 'draft' | 'published'
      return {
        id: String((doc as { id: string | number }).id),
        url: `/blog/${(doc as { slug: string }).slug}`,
        status,
      }
    } catch (err) {
      // Defense in depth: a race could still produce a unique violation between the
      // pre-check and the insert.
      const msg = err instanceof Error ? err.message : String(err)
      if (/unique|duplicate|slug/i.test(msg)) {
        return { error: 'slug_conflict', detail: `slug "${input.slug}" already exists` }
      }
      logger.error({ err }, 'create_blog_post: create failed')
      return { error: 'validation_failed', detail: msg }
    }
  },
}

export const AUTHORING_TOOLS = [
  createBlogPost,
  createPage,
  createServiceArea,
  upsertProduct,
  seedCategories,
] as const
