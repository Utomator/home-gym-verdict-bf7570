import Link from 'next/link'

/**
 * Visible, crawlable breadcrumb trail (real <a> links) matching the BreadcrumbList JSON-LD.
 * Google prefers structured data backed by visible content; this also adds internal links
 * and improves crawl depth. `href` is relative (e.g. '/blog').
 */
export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex list-none flex-wrap items-center gap-x-2 gap-y-1 pl-0 text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item.href} className="flex items-center gap-x-2">
              {last ? (
                <span aria-current="page" className="font-medium text-foreground line-clamp-1">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="no-underline transition-colors hover:text-foreground"
                >
                  {item.name}
                </Link>
              )}
              {!last && (
                <span aria-hidden className="text-border">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
