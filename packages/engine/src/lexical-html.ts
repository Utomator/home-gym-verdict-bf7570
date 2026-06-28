/**
 * Lexical → HTML serializer (pure).
 *
 * Mirrors the markdown serializer in the app (`src/lib/markdown/payload-to-md.ts`)
 * but emits sanitized HTML, for use as RSS `<content:encoded>` bodies. Like that
 * serializer it hand-walks the plain Lexical node tree (paragraph, heading, list,
 * listitem, link, quote, code, line-break, horizontal-rule) rather than booting a
 * headless Payload editor — keeping the engine package free of any `payload`
 * runtime import (PURITY CONTRACT, see index.ts).
 *
 * All text is HTML-escaped; only the structural tags we emit are literal, so the
 * output is safe to embed in a CDATA section.
 */

type LexicalNode = {
  type?: string
  tag?: string
  listType?: string
  text?: string
  format?: number | string
  url?: string
  fields?: { url?: string; newTab?: boolean }
  children?: LexicalNode[]
  [key: string]: unknown
}

// Lexical text-format bitmask (subset we care about).
const TEXT_BOLD = 1
const TEXT_ITALIC = 1 << 1
const TEXT_STRIKETHROUGH = 1 << 2
const TEXT_CODE = 1 << 4

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function applyInlineFormat(text: string, format: number): string {
  let out = esc(text)
  if (format & TEXT_CODE) out = `<code>${out}</code>`
  if (format & TEXT_BOLD) out = `<strong>${out}</strong>`
  if (format & TEXT_ITALIC) out = `<em>${out}</em>`
  if (format & TEXT_STRIKETHROUGH) out = `<del>${out}</del>`
  return out
}

function nodeToHtml(n: LexicalNode | undefined): string {
  if (!n || typeof n !== 'object') return ''

  // Text leaf.
  if (typeof n.text === 'string') {
    const fmt = typeof n.format === 'number' ? n.format : 0
    return applyInlineFormat(n.text, fmt)
  }

  const kids = (n.children ?? []).map(nodeToHtml).join('')

  switch (n.type) {
    case 'paragraph':
      // Skip wrapping genuinely empty paragraphs (Lexical emits them as spacers).
      return kids.trim() ? `<p>${kids}</p>` : ''
    case 'heading': {
      const level = Number.parseInt(typeof n.tag === 'string' ? (n.tag[1] ?? '2') : '2', 10)
      const safe = Number.isFinite(level) && level >= 1 && level <= 6 ? level : 2
      return `<h${safe}>${kids}</h${safe}>`
    }
    case 'list': {
      const ordered = n.listType === 'number'
      const tag = ordered ? 'ol' : 'ul'
      const items = (n.children ?? []).map((li) => `<li>${nodeToHtml(li)}</li>`).join('')
      return `<${tag}>${items}</${tag}>`
    }
    case 'listitem':
      return kids
    case 'link':
    case 'autolink': {
      const url = n.fields?.url ?? n.url ?? ''
      const newTab = n.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${esc(url)}"${newTab}>${kids}</a>`
    }
    case 'quote':
      return `<blockquote>${kids}</blockquote>`
    case 'code':
      return `<pre><code>${kids}</code></pre>`
    case 'linebreak':
      return '<br/>'
    case 'horizontalrule':
      return '<hr/>'
    default:
      return kids
  }
}

/**
 * Serialize a Lexical `{ root }` field (or a bare root node) to an HTML string.
 * Returns '' when the field is absent or has no renderable content.
 */
export function lexicalToHtml(field: unknown): string {
  if (!field || typeof field !== 'object') return ''
  const root = (field as { root?: LexicalNode }).root ?? (field as LexicalNode)
  if (!root || typeof root !== 'object') return ''
  return (root.children ?? []).map(nodeToHtml).join('').trim()
}
