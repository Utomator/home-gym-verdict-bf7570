import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import type { ReactNode } from 'react'
import '../globals.css'
import { brandStyle } from '@/lib/branding/brand-tokens'
import siteConfig from '@/site.config'

/**
 * Standalone preview root layout — intentionally DB-free.
 *
 * Unlike the (marketing) layout, this does NOT touch Payload / env / the DB, so
 * the design system can be rendered and screenshotted with zero infrastructure.
 * It ships its own <html>/<body>, wires the brand font pairing onto the token
 * vars (--font-display / --font-sans), and applies a sample brand accent at the
 * preview scope so the whole token cascade recolors from one place.
 *
 * It ALSO emits the Site Brief's brand as :root token overrides (mirroring the
 * (marketing) layout) so a generated brand recolors the preview surface too.
 * Individual preview pages may still apply a tighter `.preview-theme` scope for
 * their demos; that wins over :root, so those showcases are unchanged.
 */

// Text font: a neutral, highly legible grotesque for body + UI.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Display font: a geometric grotesk with character for headings.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Design Preview · project51',
  robots: { index: false, follow: false },
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  const { css: brandCss, fontsHref } = brandStyle(siteConfig.brand)
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
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
      <body className="preview-root">{children}</body>
    </html>
  )
}
