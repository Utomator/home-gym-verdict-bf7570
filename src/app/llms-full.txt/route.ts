import type { Payload } from 'payload'
import { fetchAndSerialize } from '@/lib/markdown/lookups'
import { serializeLexicalField } from '@/lib/markdown/payload-to-md'
import { getPayloadClient } from '@/lib/payload'
import { type ContentType, getMdMirrorContentTypes } from '@/lib/registry/content-registry'

export const dynamic = 'force-dynamic'

type DocRow = Record<string, unknown> & { slug?: string | null }

// `fetchAndSerialize` is typed for the body-bearing collections only. The
// registry's mdMirror.via === 'serialize' marks exactly those, so this narrowing
// is safe and keeps the call site strict.
type SerializableCollection = Parameters<typeof fetchAndSerialize>[0]

async function listDocs(payload: Payload, t: ContentType): Promise<DocRow[]> {
  // People historically sorted by `name`; serialize-via types had no explicit
  // sort. Drive the sort off the registry's author handling to preserve that.
  const sort = t.author ? t.author.titleField : undefined
  const { docs } = await payload.find({
    collection: t.collection,
    where: { _status: { equals: 'published' } },
    ...(sort ? { sort } : {}),
    limit: 1000,
    depth: 0,
  })
  return docs as unknown as DocRow[]
}

// Bespoke author/profile Markdown template (mdMirror.via === 'profile'). Mirrors
// the historical inlined People rendering exactly: `# name`, optional `*role*`,
// optional serialized bio.
function renderProfile(d: DocRow): string {
  const parts: string[] = [`# ${String(d.name ?? '')}`]
  if (d.role) parts.push(`*${String(d.role)}*`)
  const bio = serializeLexicalField(d.bio)
  if (bio) parts.push(bio)
  return parts.join('\n\n')
}

export async function GET(): Promise<Response> {
  const payload = await getPayloadClient()

  // Active content types opting into the full md mirror, in declaration order
  // (blog-posts → pages → people for the affiliate app). Unmounted collections
  // are absent automatically.
  const types = getMdMirrorContentTypes(payload)

  // Fetch each type's docs in parallel, preserving declaration order for output.
  const docsByKey = new Map<string, DocRow[]>()
  await Promise.all(
    types.map(async (t) => {
      docsByKey.set(t.key, await listDocs(payload, t))
    }),
  )

  const sections: string[] = []
  for (const t of types) {
    const docs = docsByKey.get(t.key) ?? []
    if (t.mdMirror.via === 'serialize') {
      for (const d of docs) {
        sections.push(
          (await fetchAndSerialize(t.collection as SerializableCollection, d.slug ?? '')) ?? '',
        )
      }
    } else {
      for (const d of docs) sections.push(renderProfile(d))
    }
  }

  const body = sections.filter(Boolean).join('\n---\n\n')
  return new Response(body, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
