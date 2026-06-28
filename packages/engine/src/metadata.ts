import type { Metadata } from 'next'

export type OgImage = { url: string; width: number; height: number; alt?: string }

/** Absolute URL from a possibly-relative media url + base. */
export function absUrl(base: string, url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//.test(url)) return url
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
}

/** OG images (absolute) from a doc hero or the site default; [] when neither exists. */
export function ogImages(
  base: string,
  heroUrl?: string | null,
  defaultUrl?: string | null,
  alt?: string,
): OgImage[] {
  const u = absUrl(base, heroUrl) ?? absUrl(base, defaultUrl)
  return u ? [{ url: u, width: 1200, height: 630, ...(alt ? { alt } : {}) }] : []
}

/**
 * Shared metadata fragment used by every route's generateMetadata:
 * self-referencing canonical + OpenGraph + Twitter (large card when an image exists) + siteName.
 * `canonical` is RELATIVE (metadataBase resolves it absolute). Images must be ABSOLUTE.
 */
export function seoMeta(opts: {
  canonical: string
  title: string
  description?: string
  siteName: string
  images?: OgImage[]
  type?: 'article' | 'website'
  article?: {
    publishedTime?: string
    modifiedTime?: string
    authors?: string[]
    section?: string
    tags?: string[]
  }
}): Metadata {
  const { canonical, title, description, siteName, images = [], type = 'website', article } = opts
  // Guarantee a social image on every page: use the supplied hero/default, else a
  // dynamically-generated branded card (/og). Relative URL — Next resolves it
  // against metadataBase into an absolute URL for social scrapers.
  const resolvedImages: OgImage[] = images.length
    ? images
    : [
        {
          url: `/og?title=${encodeURIComponent(title)}&site=${encodeURIComponent(siteName)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ]
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url: canonical,
      siteName,
      type,
      images: resolvedImages,
      ...(type === 'article' && article ? article : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      ...(description ? { description } : {}),
      images: resolvedImages.map((i) => i.url),
    },
  }
}
