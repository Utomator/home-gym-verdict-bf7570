import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { AuthoringToolDef } from './types'

/**
 * Section schema the MODEL expresses for a Pages document's `body` blocks field.
 *
 * It mirrors the three Pages block types (src/collections/Pages.ts) but keeps the
 * model away from Lexical entirely: any rich-text content is authored as Markdown
 * and converted server-side, exactly like create_blog_post does for `body`.
 *
 *  - richText:      { type, markdown }                       -> block `richText` { content }
 *  - cta:           { type, heading, subheading?, buttonLabel, buttonHref }
 *                                                            -> block `cta`
 *  - mediaWithText: { type, markdown, image_media_id?, imagePosition? }
 *                                                            -> block `mediaWithText` { image, content, imagePosition }
 *
 * NOTE on mediaWithText: the Pages `mediaWithText` block requires an `image`
 * (upload relation to the `media` collection). This tool does NOT ingest external
 * image URLs into `media` (out of scope, same boundary as create_blog_post's
 * hero_image_url). So `image_media_id` must reference an ALREADY-UPLOADED Media
 * doc. When it is omitted, we MUST NOT emit an invalid block — instead the section
 * degrades gracefully to a plain `richText` block so the authored copy is never
 * lost. This keeps the create from failing on a required-field violation.
 */
const RichTextSection = z.object({
  type: z.literal('richText'),
  markdown: z.string().min(1),
})

const CtaSection = z.object({
  type: z.literal('cta'),
  heading: z.string().min(1),
  subheading: z.string().nullish(),
  buttonLabel: z.string().min(1),
  buttonHref: z.string().min(1),
})

const MediaWithTextSection = z.object({
  type: z.literal('mediaWithText'),
  markdown: z.string().min(1),
  // Numeric id of an ALREADY-UPLOADED Media doc (the Pages `image` relation is
  // `number | Media`). Coerced so a stringified id from the model still resolves.
  image_media_id: z.coerce.number().int().positive().nullish(),
  imagePosition: z.enum(['left', 'right']).default('left'),
})

/**
 * productRoundup — the affiliate comparison / "best X for Y" money block. Each
 * item's `affiliateUrl` is the PRE-RESOLVED affiliate link (the platform's
 * resolve_affiliate_link supplies it; we store it as-is). intro / verdict / each
 * item's `blurb` are authored as Markdown and converted to Lexical server-side,
 * exactly like every other rich-text-bearing section. pros / cons are plain string
 * lists. The renderer emits each CTA with rel="sponsored nofollow" and the page
 * shows the FTC disclosure because a roundup is present.
 */
const RoundupItem = z.object({
  name: z.string().min(1),
  slug: z.string().nullish(),
  affiliateUrl: z.string().min(1),
  imageUrl: z.string().nullish(),
  rating: z.coerce.number().min(0).max(5).nullish(),
  price: z.string().nullish(),
  badge: z.string().nullish(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  blurb_markdown: z.string().nullish(),
})

const ProductRoundupSection = z.object({
  type: z.literal('productRoundup'),
  intro_markdown: z.string().nullish(),
  items: z.array(RoundupItem).min(1),
  verdict_markdown: z.string().nullish(),
})

const Section = z.discriminatedUnion('type', [
  RichTextSection,
  CtaSection,
  MediaWithTextSection,
  ProductRoundupSection,
])

const Input = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  body: z.array(Section).min(1),
  meta_title: z.string().nullish(),
  meta_description: z.string().nullish(),
  excerpt: z.string().max(300).nullish(),
  answer_summary: z.string().max(600).nullish(),
  key_takeaways: z.array(z.string()).optional(),
  publish: z.boolean().default(false),
})

/**
 * Success shape mirrors create_blog_post §3.1. On any handled failure the tool
 * returns a structured `{ error, detail? }` object — it never throws across the
 * MCP boundary. Error codes: slug_conflict, lexical_conversion_failed,
 * validation_failed.
 */
type Out =
  | { id: string; url: string; status: 'draft' | 'published' }
  | { error: string; detail?: string }

// Slugs that the (marketing)/[slug] catch-all reserves for real routes; authoring
// onto them would shadow a hardcoded page and never render. Mirrors RESERVED in
// src/app/(marketing)/[slug]/page.tsx.
const RESERVED_SLUGS = new Set(['blog', 'contact'])

type LexicalState = ReturnType<typeof convertMarkdownToLexical>

type RoundupItemBlock = {
  name: string
  slug?: string
  affiliateUrl: string
  imageUrl?: string
  rating?: number
  price?: string
  badge?: string
  pros?: { value: string }[]
  cons?: { value: string }[]
  blurb?: LexicalState
}

// A Pages `body` block, discriminated by `blockType`, as payload.create expects.
type PageBlock =
  | { blockType: 'richText'; content: LexicalState }
  | {
      blockType: 'cta'
      heading: string
      subheading?: string
      buttonLabel: string
      buttonHref: string
    }
  | {
      blockType: 'mediaWithText'
      image: number
      content: LexicalState
      imagePosition: 'left' | 'right'
    }
  | {
      blockType: 'productRoundup'
      intro?: LexicalState
      items: RoundupItemBlock[]
      verdict?: LexicalState
    }

export const createPage: AuthoringToolDef<typeof Input, Out> = {
  name: 'create_page',
  description:
    'Create a marketing Pages document from a list of section objects (richText / ' +
    'cta / mediaWithText). Markdown sections are converted to Payload Lexical ' +
    'server-side and assembled into the Pages blocks field. Privileged: only ' +
    'reachable through the authenticated /mcp/authoring endpoint.',
  inputSchema: Input,
  handler: async ({ payload }, input) => {
    if (RESERVED_SLUGS.has(input.slug)) {
      return {
        error: 'slug_conflict',
        detail: `slug "${input.slug}" is reserved by a built-in route`,
      }
    }

    // (1) Pre-check slug uniqueness for a clean, structured slug_conflict rather
    // than a raw DB unique-violation. `slug` is unique+indexed on pages.
    try {
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: input.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        return { error: 'slug_conflict', detail: `slug "${input.slug}" already exists` }
      }
    } catch (err) {
      logger.error({ err }, 'create_page: slug pre-check failed')
      return { error: 'validation_failed', detail: 'slug pre-check failed' }
    }

    // (2) Build the blocks. Each markdown-bearing section is converted to Lexical
    // with the SAME editor config Payload renders with. A single conversion
    // failure aborts the whole create with a structured lexical_conversion_failed.
    let editorConfig: Awaited<ReturnType<typeof editorConfigFactory.default>>
    try {
      editorConfig = await editorConfigFactory.default({ config: payload.config })
    } catch (err) {
      logger.error({ err }, 'create_page: editor config resolution failed')
      return {
        error: 'lexical_conversion_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    const blocks: PageBlock[] = []
    try {
      for (const section of input.body) {
        if (section.type === 'richText') {
          blocks.push({
            blockType: 'richText',
            content: convertMarkdownToLexical({ editorConfig, markdown: section.markdown }),
          })
        } else if (section.type === 'cta') {
          blocks.push({
            blockType: 'cta',
            heading: section.heading,
            subheading: section.subheading ?? undefined,
            buttonLabel: section.buttonLabel,
            buttonHref: section.buttonHref,
          })
        } else if (section.type === 'mediaWithText') {
          // mediaWithText. `image` is required by the collection; without a
          // resolvable media id we degrade to a plain richText block so the copy
          // is never dropped and the create never trips a required-field error.
          const content = convertMarkdownToLexical({ editorConfig, markdown: section.markdown })
          if (section.image_media_id != null) {
            blocks.push({
              blockType: 'mediaWithText',
              image: section.image_media_id,
              content,
              imagePosition: section.imagePosition,
            })
          } else {
            blocks.push({ blockType: 'richText', content })
          }
        } else {
          // productRoundup — the affiliate comparison block. intro/verdict/each
          // blurb is markdown -> Lexical; pros/cons map to {value} rows; affiliateUrl
          // is stored as-is (already platform-resolved).
          blocks.push({
            blockType: 'productRoundup',
            ...(section.intro_markdown
              ? {
                  intro: convertMarkdownToLexical({
                    editorConfig,
                    markdown: section.intro_markdown,
                  }),
                }
              : {}),
            items: section.items.map((item) => ({
              name: item.name,
              ...(item.slug ? { slug: item.slug } : {}),
              affiliateUrl: item.affiliateUrl,
              ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
              ...(item.rating != null ? { rating: item.rating } : {}),
              ...(item.price ? { price: item.price } : {}),
              ...(item.badge ? { badge: item.badge } : {}),
              pros: (item.pros ?? []).map((value) => ({ value })),
              cons: (item.cons ?? []).map((value) => ({ value })),
              ...(item.blurb_markdown
                ? {
                    blurb: convertMarkdownToLexical({
                      editorConfig,
                      markdown: item.blurb_markdown,
                    }),
                  }
                : {}),
            })),
            ...(section.verdict_markdown
              ? {
                  verdict: convertMarkdownToLexical({
                    editorConfig,
                    markdown: section.verdict_markdown,
                  }),
                }
              : {}),
          })
        }
      }
    } catch (err) {
      logger.error({ err }, 'create_page: lexical conversion failed')
      return {
        error: 'lexical_conversion_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }

    // (3) Create the document. overrideAccess: true — already gated by the
    // authoring bearer token at the route.
    const publish = input.publish
    try {
      const doc = await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: {
          title: input.title,
          slug: input.slug,
          body: blocks,
          meta: {
            title: input.meta_title ?? undefined,
            description: input.meta_description ?? input.excerpt ?? undefined,
          },
          _status: publish ? 'published' : 'draft',
          aeo: {
            answerSummary: input.answer_summary ?? undefined,
            keyTakeaways: (input.key_takeaways ?? []).map((point) => ({ point })),
          },
        },
      })

      const status = (doc._status as 'draft' | 'published' | undefined) ?? 'draft'
      return { id: String(doc.id), url: `/${doc.slug}`, status }
    } catch (err) {
      // Defense in depth: a race could still produce a unique violation between the
      // pre-check and the insert.
      const msg = err instanceof Error ? err.message : String(err)
      if (/unique|duplicate|slug/i.test(msg)) {
        return { error: 'slug_conflict', detail: `slug "${input.slug}" already exists` }
      }
      logger.error({ err }, 'create_page: create failed')
      return { error: 'validation_failed', detail: msg }
    }
  },
}
