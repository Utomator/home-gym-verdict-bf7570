'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * SiteHeader — responsive top navigation.
 *
 * Logo (text or image slot) + horizontal nav + primary CTA on desktop; collapses
 * to a hamburger-driven panel on mobile. Sticky, with a hairline + subtle blur.
 * Token-driven (shadcn semantic classes) and content-via-props (no CMS coupling).
 * Client component so the mobile menu can toggle and close on Escape.
 */
export type NavItem = { label: string; href: string }

export type SiteHeaderProps = {
  /** Brand label shown when no logo node is provided. */
  brandName: string
  /** Optional custom logo node (e.g. an <Image/>). Falls back to brandName text. */
  logo?: ReactNode
  /** Destination for the logo link. */
  homeHref?: string
  navItems?: NavItem[]
  /** Primary call-to-action shown on the right / at the bottom of the mobile sheet. */
  cta?: { label: string; href: string }
  className?: string
}

export function SiteHeader({
  brandName,
  logo,
  homeHref = '/',
  navItems = [],
  cta,
  className,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b-2 border-ink',
        'bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75',
        className,
      )}
    >
      <Container size="wide" as="div" className="flex h-16 items-center justify-between gap-6">
        {/* Brand */}
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 rounded font-semibold tracking-tight text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setOpen(false)}
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

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 font-[family-name:var(--font-display)] text-base font-bold text-ink-soft no-underline underline-offset-4 transition-colors hover:text-seal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {cta ? (
            <Button href={cta.href} size="sm">
              {cta.label}
            </Button>
          ) : null}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X width={20} height={20} aria-hidden="true" />
          ) : (
            <Menu width={20} height={20} aria-hidden="true" />
          )}
        </button>
      </Container>

      {/* Mobile panel */}
      {open ? (
        <div id="site-mobile-menu" className="border-t-2 border-ink bg-paper md:hidden">
          <Container size="wide" as="nav" aria-label="Mobile" className="py-4">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-3 text-base font-medium text-foreground no-underline transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {cta ? (
              <div className="mt-3">
                <Button href={cta.href} size="md" className="w-full" onClick={() => setOpen(false)}>
                  {cta.label}
                </Button>
              </div>
            ) : null}
          </Container>
        </div>
      ) : null}
    </header>
  )
}
