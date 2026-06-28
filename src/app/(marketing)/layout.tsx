import type { ReactNode } from 'react'
import { Annie_Use_Your_Telescope, Architects_Daughter } from 'next/font/google'
import '../globals.css'
import { ogImages, organizationSchema, websiteSchema } from '@p51/engine'

// DESIGN.md §4 — display: Architects Daughter, text: Annie Use Your Telescope.
// Self-hosted via next/font (no layout-shift, no runtime Google request). The
// variables feed --font-display-src / --font-text-src, which globals.css maps
// onto the --font-display / --font-sans design tokens.
const displayFont = Architects_Daughter({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-src',
  display: 'swap',
})
const textFont = Annie_Use_Your_Telescope({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-text-src',
  display: 'swap',
})
import { Footer } from '@/components/marketing/Footer'
import { Header } from '@/components/marketing/Header'
import { JsonLd } from '@/components/marketing/JsonLd'
import { brandStyle } from '@/lib/branding/brand-tokens'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import siteConfig from '@/site.config'

type MediaLike = {
  url?: string | null
  width?: number | null
  height?: number | null
  alt?: string | null
}
const asMedia = (v: unknown): MediaLike | undefined =>
  typeof v === 'object' && v !== null && 'url' in v ? (v as MediaLike) : undefined

export async function generateMetadata() {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'
  const tagline = settings.organization?.tagline ?? orgName
  const heroImages = ogImages(
    e.NEXT_PUBLIC_SERVER_URL,
    undefined,
    asMedia(settings.defaultMeta?.image)?.url,
    orgName,
  )
  // Site-wide default OG: the configured default image, else a branded /og card.
  // Relative /og resolves absolute via metadataBase (set just below).
  const images = heroImages.length
    ? heroImages
    : [
        {
          url: `/og?title=${encodeURIComponent(tagline)}&site=${encodeURIComponent(orgName)}`,
          width: 1200,
          height: 630,
          alt: orgName,
        },
      ]
  return {
    metadataBase: new URL(e.NEXT_PUBLIC_SERVER_URL),
    title: { default: orgName, template: `%s · ${orgName}` },
    description: tagline,
    robots: e.SITE_INDEXABLE ? undefined : { index: false, follow: false },
    alternates: { types: { 'application/rss+xml': '/feed.xml' } },
    openGraph: {
      siteName: orgName,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      images: images.map((i) => i.url),
    },
  }
}

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })

  const orgLogo =
    typeof settings.organization?.logo === 'object' && settings.organization.logo?.url
      ? settings.organization.logo.url
      : undefined

  const orgName = settings.organization?.name ?? 'My Website'

  const ld = [
    organizationSchema(e.NEXT_PUBLIC_SERVER_URL, {
      name: orgName,
      logoUrl: orgLogo ?? undefined,
      sameAs: (settings.organization?.sameAs ?? [])
        .map((s) => s.url)
        .filter((u): u is string => Boolean(u)),
      foundingDate: settings.organization?.foundingDate ?? undefined,
      contactPoints:
        settings.organization?.contactPoints?.map((c) => ({
          contactType: c.contactType,
          email: c.email ?? undefined,
          telephone: c.telephone ?? undefined,
        })) ?? undefined,
      // founders is a hasMany relationship → populated People objects at this depth.
      founders: (settings.organization?.founders ?? []).flatMap((f) => {
        if (typeof f !== 'object' || f === null || !('name' in f)) return []
        const slug = 'slug' in f ? (f as { slug?: string }).slug : undefined
        return [
          {
            name: (f as { name: string }).name,
            ...(slug ? { url: `${e.NEXT_PUBLIC_SERVER_URL}/authors/${slug}` } : {}),
          },
        ]
      }),
    }),
    websiteSchema(e.NEXT_PUBLIC_SERVER_URL, orgName),
  ]

  // LANDING + LEADGEN archetypes supply their OWN SiteHeader / <main> /
  // SiteFooter chrome (LandingTemplate / LeadgenHomeTemplate / ServiceAreaTemplate),
  // so the layout steps back and renders just the JSON-LD + children. The
  // affiliate archetype uses the DESIGNED marketing chrome (Header → SiteHeader,
  // Footer → SiteFooter) wrapped in the design-system shell.
  const ownsChrome = siteConfig.archetype === 'landing' || siteConfig.archetype === 'leadgen'

  // BRAND → AUTO-THEME. Resolve the Site Brief's brand into :root token
  // overrides (+ optional Google Fonts) and emit them at the document root.
  // When siteConfig.brand is undefined this reproduces the globals.css defaults,
  // so an unbranded site renders identically. Changing siteConfig.brand
  // recolors + retypes the WHOLE site with no component edits.
  const { css: brandCss, fontsHref } = brandStyle(siteConfig.brand)

  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable}`}>
      <head>
        {fontsHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontsHref} />
          </>
        ) : null}
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: brandCss }} />
      </head>
      <body className="marketing-body">
        {/* Neutralize the clean-slate document defaults from globals.css (the
            48rem body measure + the raw underlined-link rule) so the designed,
            full-width chrome + token utilities render as intended. Scoped to the
            marketing body; mirrors the (preview) root reset. */}
        <style>{`
          .marketing-body {
            max-width: none;
            margin: 0;
            padding: 0;
            font-family: var(--font-sans);
            line-height: 1.5;
            color: var(--foreground);
            background: var(--background);
          }
          .marketing-body a { text-decoration: none; }
        `}</style>
        <JsonLd data={ld} />
        {ownsChrome ? (
          children
        ) : (
          <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        )}
      </body>
    </html>
  )
}
