import type { TocHeading } from '@p51/engine'

/**
 * Inline table of contents built from a post's h2/h3 headings. The `#id` anchors
 * match the ids RichText stamps on the rendered headings (both via
 * slugifyHeading). Renders nothing for short posts (< 3 headings) where a ToC is
 * noise — and gives AI answer engines explicit, linkable section targets on long
 * ones. Plain in-page `<a href="#…">` (not next/link) for native anchor jumps.
 */
export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  if (headings.length < 3) return null
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-xl border border-border bg-muted/40 p-5 sm:p-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </h2>
      <ol className="mt-3 list-none space-y-1 pl-0">
        {headings.map((h) => (
          <li key={h.id} className={h.level >= 3 ? 'border-l border-border pl-4' : undefined}>
            <a
              href={`#${h.id}`}
              className="-mx-2 block rounded-md px-2 py-1 text-sm leading-snug text-muted-foreground no-underline transition-colors hover:bg-background hover:text-foreground"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
