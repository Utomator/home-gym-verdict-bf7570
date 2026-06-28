import { env } from '@/lib/env'
import { serializeBlocks, serializeToMarkdown } from '@/lib/markdown/payload-to-md'
import { getPayloadClient } from '@/lib/payload'

type Coll = 'blog-posts' | 'pages'

const PATH: Record<Coll, (slug: string) => string> = {
  'blog-posts': (s) => `/blog/${s}`,
  pages: (s) => `/${s}`,
}

export async function fetchAndSerialize(coll: Coll, slug: string): Promise<string | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: coll,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  const d = docs[0]
  if (!d) return null

  const author =
    typeof (d as { author?: unknown }).author === 'object' &&
    (d as { author?: { name?: string } }).author?.name
      ? (d as { author: { name: string } }).author.name
      : undefined

  const frontmatter = {
    title: (d as { title: string }).title,
    canonicalUrl: `${env().NEXT_PUBLIC_SERVER_URL}${PATH[coll](slug)}`,
    author,
    publishedAt: (d as { publishedAt?: string | null }).publishedAt ?? undefined,
    lastReviewedAt:
      (d as { aeo?: { lastReviewedAt?: string | null } }).aeo?.lastReviewedAt ?? undefined,
    answerSummary: (d as { aeo?: { answerSummary?: string } }).aeo?.answerSummary,
  }

  // Body shape differs per collection:
  // - blog-posts: a single `body` lexical field.
  // - pages: `body` is a blocks array, not a lexical `{root}`.
  if (coll === 'pages') {
    const body = serializeBlocks((d as { body?: unknown }).body)
    return serializeToMarkdown({ frontmatter, body })
  }

  // blog-posts: single lexical body field.
  const lexical = (d as { body?: unknown }).body ?? {
    root: { children: [], type: 'root', version: 1, direction: 'ltr', format: '', indent: 0 },
  }
  return serializeToMarkdown({ frontmatter, lexical: lexical as never })
}

export const MD_HEADERS: HeadersInit = {
  'content-type': 'text/markdown; charset=utf-8',
  vary: 'Accept',
}
