import type { Payload } from 'payload'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import {
  type ContentType,
  getContentType,
  getLlmsContentTypes,
} from '@/lib/registry/content-registry'

export const dynamic = 'force-dynamic'

// Per-type list query: which collection, sort, and the field used as the link
// label. Derived from the registry entry so the collection SET is data-driven;
// the sort + label field mirror the historical hardcoded queries exactly to keep
// output byte-identical for the affiliate app.
function listQueryFor(t: ContentType): { sort: string; titleField: string } {
  // Authors/profiles use `name` as both their sort and display field; everything
  // else sorts/labels by `title`. blog-posts historically sorted by newest first.
  if (t.author) return { sort: t.author.titleField, titleField: t.author.titleField }
  if (t.key === 'blog-posts') return { sort: '-publishedAt', titleField: 'title' }
  return { sort: 'title', titleField: 'title' }
}

type DocRow = Record<string, unknown> & {
  slug?: string | null
  categories?: { value?: string | null }[] | null
  tags?: { value?: string | null }[] | null
}

async function listDocs(payload: Payload, t: ContentType, sort: string): Promise<DocRow[]> {
  const { docs } = await payload.find({
    collection: t.collection,
    where: { _status: { equals: 'published' } },
    sort,
    limit: 100,
    depth: 0,
  })
  return docs as unknown as DocRow[]
}

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })

  // Active, llms-opted-in content types in declared section order. Unmounted
  // collections are simply absent — a landing app with only Pages renders just
  // the Pages section, no flags.
  const types = getLlmsContentTypes(payload)

  // Fetch every section's documents in parallel, keyed by content-type key.
  const rowsByKey = new Map<string, DocRow[]>()
  await Promise.all(
    types.map(async (t) => {
      const { sort } = listQueryFor(t)
      rowsByKey.set(t.key, await listDocs(payload, t, sort))
    }),
  )

  // Taxonomy hubs (Topics/Tags) derive from the blog-posts collection. The
  // historical route ran a dedicated unbounded query for distinct values, kept
  // here verbatim so the hub set is identical. Driven by the registry's taxonomy
  // declaration (field names + section titles + path builders) rather than
  // inline literals.
  const blogType = getContentType('blog-posts')
  const taxonomyType = blogType?.taxonomy && rowsByKey.has(blogType.key) ? blogType : undefined
  const taxonomySections: {
    sectionTitle: string
    values: string[]
    pathFor: (v: string) => string
  }[] = []
  if (taxonomyType?.taxonomy) {
    const { docs: taxonomyDocs } = await payload.find({
      collection: taxonomyType.collection,
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })
    for (const tax of taxonomyType.taxonomy.fields) {
      const values = new Set<string>()
      for (const d of taxonomyDocs as unknown as DocRow[]) {
        for (const item of (d[tax.field] as { value?: string | null }[] | undefined) ?? []) {
          if (item.value) values.add(item.value)
        }
      }
      taxonomySections.push({
        sectionTitle: tax.sectionTitle,
        values: [...values].sort(),
        pathFor: tax.pathFor,
      })
    }
  }

  const base = e.NEXT_PUBLIC_SERVER_URL

  const renderType = (t: ContentType): string[] => {
    const { titleField } = listQueryFor(t)
    const rows = rowsByKey.get(t.key) ?? []
    return [
      `## ${t.llms.sectionTitle}`,
      ...rows.map((d) => `- [${String(d[titleField] ?? '')}](${base}${t.pathFor(d)})`),
      '',
    ]
  }

  const renderTaxonomy = (): string[] =>
    taxonomySections.flatMap((s) => [
      `## ${s.sectionTitle}`,
      ...s.values.map((v) => `- [${v}](${base}${s.pathFor(v)})`),
      '',
    ])

  const lines: string[] = [
    `# ${settings.organization?.name ?? 'My Website'}`,
    '',
    settings.organization?.tagline ?? '',
    '',
  ]

  // Section order: registry-declared sectionOrder drives the type sections;
  // taxonomy hubs (owned by blog-posts) are emitted right after the Pages
  // section to preserve the historical Pages → Topics → Tags → Authors →
  // Recent-posts sequence exactly. If Pages is not mounted, the hubs are
  // emitted just before their owning blog-posts section so they are never
  // silently dropped while remaining contiguous and correctly placed.
  const hasPages = types.some((t) => t.key === 'pages')
  const taxonomyAfterKey = hasPages ? 'pages' : taxonomyType?.key
  let taxonomyEmitted = false
  for (const t of types) {
    if (!taxonomyEmitted && !hasPages && t.key === taxonomyAfterKey) {
      lines.push(...renderTaxonomy())
      taxonomyEmitted = true
    }
    lines.push(...renderType(t))
    if (t.key === taxonomyAfterKey && hasPages) {
      lines.push(...renderTaxonomy())
      taxonomyEmitted = true
    }
  }

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
