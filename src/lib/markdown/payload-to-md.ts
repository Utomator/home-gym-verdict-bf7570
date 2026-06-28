/**
 * Lexical → Markdown serializer.
 *
 * Drives `/md/**` route handlers (Phase F3) and `/llms-full.txt` (F4).
 *
 * NOTE: We hand-roll a small recursive serializer instead of using
 * `@payloadcms/richtext-lexical`'s `convertLexicalToMarkdown`. That helper
 * requires a fully sanitized Payload `SanitizedConfig` (with `collections`
 * etc.) to build a headless Lexical editor; instantiating one in unit tests
 * would require booting a Payload instance. Path B (this file) covers the
 * node types the editor actually emits: paragraph, heading, list, listitem,
 * link, quote, code, line-break — sufficient for placeholder content. More
 * node types can be added as the editor surface grows.
 */

export type Frontmatter = {
  title: string
  canonicalUrl: string
  author?: string
  publishedAt?: string
  lastReviewedAt?: string
  answerSummary?: string
}

const escapeYaml = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

function renderFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null) continue
    lines.push(`${k}: "${escapeYaml(String(v))}"`)
  }
  lines.push('---')
  return lines.join('\n')
}

type LexicalNode = {
  type?: string
  tag?: string
  listType?: string
  text?: string
  format?: number | string
  url?: string
  fields?: { url?: string }
  children?: LexicalNode[]
  [key: string]: unknown
}

// Lexical text-format bitmask (subset we care about).
const TEXT_BOLD = 1
const TEXT_ITALIC = 1 << 1
const TEXT_STRIKETHROUGH = 1 << 2
const TEXT_CODE = 1 << 4

function applyInlineFormat(text: string, format: number): string {
  let out = text
  if (format & TEXT_CODE) out = `\`${out}\``
  if (format & TEXT_BOLD) out = `**${out}**`
  if (format & TEXT_ITALIC) out = `*${out}*`
  if (format & TEXT_STRIKETHROUGH) out = `~~${out}~~`
  return out
}

function nodeToMd(n: LexicalNode | undefined): string {
  if (!n || typeof n !== 'object') return ''

  // Text leaf.
  if (typeof n.text === 'string') {
    const fmt = typeof n.format === 'number' ? n.format : 0
    return applyInlineFormat(n.text, fmt)
  }

  const kids = (n.children ?? []).map(nodeToMd).join('')

  switch (n.type) {
    case 'paragraph':
      return `${kids}\n\n`
    case 'heading': {
      const level = Number.parseInt(typeof n.tag === 'string' ? (n.tag[1] ?? '1') : '1', 10)
      const safe = Number.isFinite(level) && level >= 1 && level <= 6 ? level : 1
      return `${'#'.repeat(safe)} ${kids}\n\n`
    }
    case 'list': {
      const ordered = n.listType === 'number'
      const items = (n.children ?? []).map((li, i) => {
        const marker = ordered ? `${i + 1}.` : '-'
        return `${marker} ${nodeToMd(li).trim()}`
      })
      return `${items.join('\n')}\n\n`
    }
    case 'listitem':
      return kids
    case 'link': {
      const url = n.fields?.url ?? n.url ?? ''
      return `[${kids}](${url})`
    }
    case 'autolink': {
      const url = n.fields?.url ?? n.url ?? ''
      return `[${kids}](${url})`
    }
    case 'quote':
      return `> ${kids}\n\n`
    case 'code':
      return `\`\`\`\n${kids}\n\`\`\`\n\n`
    case 'linebreak':
      return '\n'
    case 'horizontalrule':
      return `---\n\n`
    default:
      return kids
  }
}

export function serializeToMarkdown(args: {
  frontmatter: Frontmatter
  /** A single lexical body field (blog-posts). Mutually exclusive with `body`. */
  lexical?: { root: { children: unknown[] } } | { root?: LexicalNode }
  /** Pre-rendered markdown body (pages build this themselves). */
  body?: string
}): string {
  const body =
    args.body !== undefined
      ? args.body.trim()
      : nodeToMd((args.lexical as { root?: LexicalNode } | undefined)?.root ?? { children: [] }).trim()
  return `${renderFrontmatter(args.frontmatter)}\n\n${body}\n`
}

/**
 * Serialize a single Payload `richText` field (a lexical `{ root }` object) to
 * markdown. Returns '' when the field is absent or has no renderable content.
 * Used to assemble bodies for collections that don't have a single `body`
 * lexical field (pages' richText blocks).
 */
export function serializeLexicalField(field: unknown): string {
  const root = (field as { root?: LexicalNode } | null | undefined)?.root
  if (!root) return ''
  return nodeToMd(root).trim()
}

type PageBlock = {
  blockType?: string
  content?: unknown
  heading?: string
  subheading?: string
  buttonLabel?: string
  buttonHref?: string
  [key: string]: unknown
}

/**
 * Serialize a Pages `body` blocks array to markdown. Walks each block and
 * renders its serializable prose:
 *   - `richText` / `mediaWithText` → the `content` lexical field
 *   - `cta` → heading (as H2) + subheading + a markdown link button
 * Blocks with no serializable prose are skipped.
 */
export function serializeBlocks(blocks: unknown): string {
  if (!Array.isArray(blocks)) return ''
  const sections: string[] = []
  for (const raw of blocks) {
    if (!raw || typeof raw !== 'object') continue
    const block = raw as PageBlock
    switch (block.blockType) {
      case 'richText':
      case 'mediaWithText': {
        const md = serializeLexicalField(block.content)
        if (md) sections.push(md)
        break
      }
      case 'cta': {
        const parts: string[] = []
        if (block.heading) parts.push(`## ${block.heading}`)
        if (block.subheading) parts.push(block.subheading)
        if (block.buttonLabel && block.buttonHref) {
          parts.push(`[${block.buttonLabel}](${block.buttonHref})`)
        }
        if (parts.length) sections.push(parts.join('\n\n'))
        break
      }
      default:
        break
    }
  }
  return sections.join('\n\n').trim()
}

/**
 * Best-effort plain-text extraction (used by feed snippets, JSON-LD answer
 * fallbacks, etc.). Strips formatting; collapses whitespace.
 */
export function lexicalToPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[]; root?: unknown }
  if (typeof n.text === 'string') return n.text
  if (n.root) return lexicalToPlainText(n.root)
  return (n.children ?? []).map(lexicalToPlainText).join(' ').replace(/\s+/g, ' ').trim()
}
