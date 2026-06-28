import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { CollectionSlug } from 'payload'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import type { AuthoringToolDef } from './types'

/**
 * create_service_area — authors a ServiceAreas doc (the leadgen archetype's
 * programmatic-SEO "service in a city" landing page, served at /[service]/[city]).
 *
 * Mirrors create_blog_post EXACTLY: a Zod Input schema, a slug pre-check for a
 * clean slug_conflict, markdown -> Lexical for the `body` richText, and a
 * structured `{ error, detail }` on any handled failure (never throws across the
 * MCP boundary).
 *
 * The canonical `slug` is composed as "<service>/<city>" (URL-safe), matching how
 * the /[slug]/[city] route resolves a doc (see src/app/(marketing)/[slug]/[city]/page.tsx).
 * The model supplies clean `service` and `city` strings; this tool slugifies each
 * segment so the authored slug always lines up with the route's own normalisation.
 */
const Input = z.object({
  service: z.string().min(1),
  city: z.string().min(1),
  region: z.string().nullish(),
  intro: z.string().nullish(),
  body_markdown: z.string().min(1),
  highlights: z.array(z.string()).optional(),
  answer_summary: z.string().max(600).nullish(),
  faq: z
    .array(z.object({ question: z.string().min(1), answer_markdown: z.string().min(1) }))
    .optional(),
  publish: z.boolean().default(false),
})

/**
 * Success shape mirrors create_blog_post §3.1. Error codes: slug_conflict,
 * lexical_conversion_failed, validation_failed.
 */
type Out =
  | { id: string; url: string; status: 'draft' | 'published' }
  | { error: string; detail?: string }

// The ServiceAreas collection is only mounted under the leadgen archetype, so it
// is absent from the affiliate-generated payload-types `CollectionSlug` union. A
// narrow cast (same pattern the route uses) lets this file typecheck against the
// DEFAULT types while resolving the real collection at runtime when mounted.
const SERVICE_AREAS = 'service-areas' as CollectionSlug

// Mirror the route's own segment slugifier so the slug we write resolves cleanly.
const sectionToSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const createServiceArea: AuthoringToolDef<typeof Input, Out> = {
  name: 'create_service_area',
  description:
    'Create a ServiceAreas document (a leadgen "service in a city" landing page, ' +
    'served at /[service]/[city]). Converts body_markdown and FAQ answers to ' +
    'Payload Lexical server-side. Privileged: only reachable through the ' +
    'authenticated /mcp/authoring endpoint.',
  inputSchema: Input,
  handler: async ({ payload }, input) => {
    const serviceSlug = sectionToSlug(input.service)
    const citySlug = sectionToSlug(input.city)
    const slug = `${serviceSlug}/${citySlug}`

    if (!serviceSlug || !citySlug) {
      return {
        error: 'validation_failed',
        detail: 'service and city must contain URL-safe characters',
      }
    }

    // (1) Pre-check slug uniqueness for a clean slug_conflict. `slug` is
    // unique+indexed on service-areas.
    try {
      const existing = await payload.find({
        collection: SERVICE_AREAS,
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) {
        return { error: 'slug_conflict', detail: `slug "${slug}" already exists` }
      }
    } catch (err) {
      logger.error({ err }, 'create_service_area: slug pre-check failed')
      return { error: 'validation_failed', detail: 'slug pre-check failed' }
    }

    // (2) Convert the body markdown + each FAQ answer to Lexical with the SAME
    // editor config Payload renders with.
    let body: ReturnType<typeof convertMarkdownToLexical>
    let faq: { question: string; answer: ReturnType<typeof convertMarkdownToLexical> }[]
    try {
      const editorConfig = await editorConfigFactory.default({ config: payload.config })
      body = convertMarkdownToLexical({ editorConfig, markdown: input.body_markdown })
      faq = (input.faq ?? []).map((q) => ({
        question: q.question,
        answer: convertMarkdownToLexical({ editorConfig, markdown: q.answer_markdown }),
      }))
    } catch (err) {
      logger.error({ err }, 'create_service_area: lexical conversion failed')
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
        collection: SERVICE_AREAS,
        overrideAccess: true,
        data: {
          service: input.service,
          city: input.city,
          region: input.region ?? undefined,
          slug,
          intro: input.intro ?? undefined,
          body,
          highlights: (input.highlights ?? []).map((value) => ({ value })),
          _status: publish ? 'published' : 'draft',
          aeo: {
            answerSummary: input.answer_summary ?? undefined,
            faq: faq.length > 0 ? faq : undefined,
          },
        } as never,
      })

      const status = ((doc as { _status?: 'draft' | 'published' })._status ?? 'draft') as
        | 'draft'
        | 'published'
      return { id: String((doc as { id: string | number }).id), url: `/${slug}`, status }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/unique|duplicate|slug/i.test(msg)) {
        return { error: 'slug_conflict', detail: `slug "${slug}" already exists` }
      }
      logger.error({ err }, 'create_service_area: create failed')
      return { error: 'validation_failed', detail: msg }
    }
  },
}
