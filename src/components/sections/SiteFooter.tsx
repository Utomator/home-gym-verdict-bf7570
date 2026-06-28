import Link from 'next/link'
import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * SiteFooter — multi-column link footer with a brand blurb and a legal bar.
 *
 * Content-driven via props (column groups + legal links). Token-driven surface,
 * borders, and type. Server component (no interactivity). Internal links use
 * next/link; absolute / external hrefs fall back to <a>.
 */
export type FooterLink = { label: string; href: string }
export type FooterColumn = { title: string; links: FooterLink[] }

export type SiteFooterProps = {
  brandName: string
  /** Optional custom logo node; falls back to brandName text. */
  logo?: ReactNode
  /** Short description under the brand. */
  description?: string
  homeHref?: string
  columns?: FooterColumn[]
  legalLinks?: FooterLink[]
  /** Defaults to "© {year} {brandName}. All rights reserved." */
  copyright?: string
  className?: string
}

function FooterAnchor({ link }: { link: FooterLink }) {
  const isInternal = link.href.startsWith('/') && !link.href.startsWith('//')
  const classes =
    'text-sm text-ink-soft no-underline underline-offset-4 transition-colors hover:text-seal hover:underline'
  return isInternal ? (
    <Link href={link.href} className={classes}>
      {link.label}
    </Link>
  ) : (
    <a href={link.href} className={classes}>
      {link.label}
    </a>
  )
}

export function SiteFooter({
  brandName,
  logo,
  description,
  homeHref = '/',
  columns = [],
  legalLinks = [],
  copyright,
  className,
}: SiteFooterProps) {
  const year = new Date().getFullYear()
  const copy = copyright ?? `© ${year} ${brandName}. All rights reserved.`

  return (
    <footer className={cn('border-t-2 border-ink grid-paper', className)}>
      <Container size="wide" className="py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2.5 rounded text-lg font-semibold tracking-tight text-ink no-underline"
            >
              {logo ?? (
                <>
                  <span
                    className="grid size-7 place-items-center rounded-full border-2 border-ink bg-seal text-xs font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-xl font-bold">
                    {brandName}
                  </span>
                </>
              )}
            </Link>
            {description ? (
              <p className="mt-4 max-w-xs leading-relaxed text-ink-soft">{description}</p>
            ) : null}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-seal-deep">
                {col.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}`}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal bar */}
        <div className="mt-14 flex flex-col gap-4 border-t-2 border-ink pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">{copy}</p>
          {legalLinks.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <FooterAnchor link={link} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  )
}
