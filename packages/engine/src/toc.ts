export type TocHeading = { level: number; text: string; id: string }

/**
 * Stable, URL-safe slug from heading text. PURE — shared verbatim by the ToC
 * builder (extractHeadings) and RichText's heading converter so a ToC link's
 * `#slug` always matches the `id` rendered on the heading. No stateful de-dupe:
 * duplicate headings (rare) collide to the same id and the anchor jumps to the
 * first occurrence, which keeps both sides provably in sync.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Recursively concatenate the text of a Lexical node's subtree. */
export function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  if (typeof n.text === 'string') return n.text
  return (n.children ?? []).map(nodeText).join('')
}

/**
 * Extract headings (default h2/h3) in document order from a Lexical editor state
 * for a table of contents. Each id = slugifyHeading(text), matching the ids
 * RichText injects on the rendered headings.
 */
export function extractHeadings(data: unknown, levels: number[] = [2, 3]): TocHeading[] {
  const root = (data as { root?: { children?: unknown[] } } | null)?.root
  if (!root?.children) return []
  const out: TocHeading[] = []
  for (const child of root.children) {
    const c = child as { type?: string; tag?: string }
    if (c.type !== 'heading' || typeof c.tag !== 'string') continue
    const level = Number(c.tag.replace('h', ''))
    if (!Number.isFinite(level) || !levels.includes(level)) continue
    const text = nodeText(child).trim()
    if (!text) continue
    out.push({ level, text, id: slugifyHeading(text) })
  }
  return out
}
