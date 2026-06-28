import { nodeText, outboundRel, slugifyHeading } from '@p51/engine'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConverters,
  type JSXConvertersFunction,
  RichText as PayloadRichText,
} from '@payloadcms/richtext-lexical/react'
import NextImage from 'next/image'
import { createElement, type ReactNode } from 'react'
import { env } from '@/lib/env'

/**
 * Host of the site's own domain, derived from NEXT_PUBLIC_SERVER_URL. Used to
 * decide whether a body link is outbound (external). Outbound links default to
 * FOLLOWED editorial; only an author-flagged linkRel='sponsored' adds
 * rel="sponsored nofollow" (see outboundRel in lib/seo/affiliate). Returns '' if
 * the env URL can't be parsed so we degrade to "treat all http(s) links as outbound".
 */
function siteHost(): string {
  try {
    return new URL(env().NEXT_PUBLIC_SERVER_URL).host
  } catch {
    return ''
  }
}

/** True for absolute http(s) links pointing at a different host than our own. */
function isOutbound(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false // root-relative / mailto / anchors = internal
  try {
    const host = new URL(href).host
    const self = siteHost()
    return self ? host !== self : true
  } catch {
    return false
  }
}

// Loose shape for a link/autolink node — `link` and `autolink` share the same
// `fields`/`children` shape, so one wrapper handles both. Typed permissively so
// it can stand in for either of Payload's stricter converter signatures.
type AnyLinkConverter = (args: {
  node: {
    fields?: {
      url?: string
      linkType?: 'custom' | 'internal'
      // Author-declared SEO attribution (LinkFeature custom field). Drives rel.
      linkRel?: 'sponsored' | 'ugc' | 'nofollow' | 'follow' | null
      newTab?: boolean | null
    }
    children: unknown[]
  }
  nodesToJSX: (args: { nodes: unknown[] }) => ReactNode[]
}) => ReactNode

/**
 * Custom converters layered on top of Payload's defaults. ONLY `upload` and the
 * link nodes (`link`/`autolink`) are overridden — every other node type keeps
 * its default rendering. Additive and surgical by design.
 */
const converters: JSXConvertersFunction = ({ defaultConverters }) => {
  /** Wrap a default link converter so outbound links get affiliate rel/target. */
  const linkOverride = (fallback: unknown): AnyLinkConverter | typeof fallback =>
    typeof fallback === 'function'
      ? (((args) => {
          const { node, nodesToJSX } = args
          const href = node.fields?.url ?? ''
          // Internal links (linkType === 'internal') and same-origin links are
          // left to the default converter so existing href resolution is intact.
          if (node.fields?.linkType !== 'internal' && isOutbound(href)) {
            const newTab = node.fields?.newTab ?? true // outbound opens in a new tab by default
            // Per-link attribution: unflagged outbound links stay FOLLOWED (editorial);
            // only an explicit linkRel='sponsored' adds rel="sponsored nofollow".
            const rel = outboundRel(node.fields?.linkRel, newTab)
            return (
              <a href={href} {...(rel ? { rel } : {})} {...(newTab ? { target: '_blank' } : {})}>
                {nodesToJSX({ nodes: node.children })}
              </a>
            )
          }
          return (fallback as AnyLinkConverter)(args)
        }) satisfies AnyLinkConverter)
      : fallback

  return {
    ...defaultConverters,
    link: linkOverride(defaultConverters.link) as JSXConverters['link'],
    autolink: linkOverride(defaultConverters.autolink) as JSXConverters['autolink'],
    // Stamp a stable slug `id` on each heading so the table-of-contents anchors
    // (and any deep links / AI section targets) resolve. id == slugifyHeading(text),
    // identical to extractHeadings() so the two always line up.
    heading: (({
      node,
      nodesToJSX,
    }: {
      node: { tag?: string; children: unknown[] }
      nodesToJSX: (args: { nodes: unknown[] }) => ReactNode[]
    }) => {
      const tag = node.tag ?? 'h2'
      const text = nodeText(node).trim()
      const children = nodesToJSX({ nodes: node.children })
      return createElement(tag, text ? { id: slugifyHeading(text) } : null, children)
    }) as JSXConverters['heading'],
    upload: ({ node, ...rest }) => {
      // Mirror the shape the default upload converter relies on.
      const uploadNode = node as {
        value?: unknown
        fields?: { alt?: string | null } | null
      }
      const doc =
        uploadNode.value && typeof uploadNode.value === 'object'
          ? (uploadNode.value as {
              url?: string | null
              alt?: string | null
              width?: number | null
              height?: number | null
              mimeType?: string | null
            })
          : null

      // Non-image uploads (PDFs etc.) and unresolved relationships fall back to
      // Payload's default upload converter untouched.
      const isImage = !!doc?.mimeType?.startsWith('image')
      if (!doc?.url || !isImage) {
        const fallback = defaultConverters.upload
        return typeof fallback === 'function' ? fallback({ node, ...rest }) : null
      }

      const alt = uploadNode.fields?.alt || doc.alt || ''

      // Graceful fallback when intrinsic dimensions are missing: next/image
      // requires width+height (or fill), so use a plain <img> in that case.
      if (!doc.width || !doc.height) {
        // Graceful fallback for dimensionless uploads (e.g. SVG): next/image requires
        // intrinsic width+height. Lazy + async-decoded; .content img{max-width:100%}
        // keeps it in-bounds. Raster uploads get dims from sharp, so this is rare.
        // biome-ignore lint/performance/noImgElement: next/image needs intrinsic width+height which are missing here
        return <img alt={alt} src={doc.url} loading="lazy" decoding="async" />
      }

      return <NextImage src={doc.url} alt={alt} width={doc.width} height={doc.height} />
    },
  }
}

export function RichText({ data }: { data: SerializedEditorState | null | undefined }) {
  if (!data) return null
  return <PayloadRichText data={data} converters={converters} />
}
