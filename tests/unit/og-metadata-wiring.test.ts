import { type OgImage, ogImages, seoMeta } from '@p51/engine'
import { describe, expect, it } from 'vitest'

/**
 * The FALLBACK wiring: seoMeta() must point og:image / twitter:image at the
 * dynamic /og route for a doc WITHOUT an uploaded image, and keep the uploaded
 * image when one is present (no regression). This is the contract the
 * [slug] + blog/[slug] generateMetadata depend on.
 */

const BASE = 'https://example.com'
const ogUrlOf = (m: ReturnType<typeof seoMeta>): string => {
  const imgs = m.openGraph?.images as OgImage[] | undefined
  return imgs?.[0]?.url ?? ''
}

describe('seoMeta — dynamic /og FALLBACK when no uploaded image', () => {
  it('uses the dynamic /og route with the page title + site when images is empty', () => {
    const m = seoMeta({
      canonical: '/best-desks',
      title: 'The Best Standing Desks',
      siteName: 'Desk Co',
    })
    const url = ogUrlOf(m)
    expect(url.startsWith('/og?')).toBe(true)
    expect(url).toContain(`title=${encodeURIComponent('The Best Standing Desks')}`)
    expect(url).toContain(`site=${encodeURIComponent('Desk Co')}`)
    // The card is 1200×630 (large summary image).
    const img = (m.openGraph?.images as OgImage[])[0]
    expect(img.width).toBe(1200)
    expect(img.height).toBe(630)
    expect(img.alt).toBe('The Best Standing Desks')
  })

  it('mirrors the same /og url onto the twitter large-image card', () => {
    const m = seoMeta({ canonical: '/x', title: 'No Hero Doc', siteName: 'Site' })
    const tw = m.twitter as { card?: string; images?: string[] }
    expect(tw.card).toBe('summary_large_image')
    expect(tw.images?.[0]).toBe(ogUrlOf(m))
    expect(tw.images?.[0]?.startsWith('/og?')).toBe(true)
  })

  it('url-encodes a title with special characters (no broken query)', () => {
    const m = seoMeta({ canonical: '/y', title: 'A&B "Best" <2026>', siteName: 'Site' })
    const url = ogUrlOf(m)
    expect(url).toContain(encodeURIComponent('A&B "Best" <2026>'))
    expect(url).not.toContain(' ')
  })
})

describe('seoMeta — uploaded image WINS (no regression)', () => {
  it('uses the supplied uploaded image and does NOT fall back to /og', () => {
    const uploaded: OgImage = {
      url: 'https://cdn.example.com/hero.jpg',
      width: 1200,
      height: 630,
      alt: 'Real hero',
    }
    const m = seoMeta({
      canonical: '/has-hero',
      title: 'Has Uploaded Hero',
      siteName: 'Site',
      images: [uploaded],
    })
    const url = ogUrlOf(m)
    expect(url).toBe('https://cdn.example.com/hero.jpg')
    expect(url).not.toContain('/og?')
    // Twitter mirrors the uploaded image too.
    expect((m.twitter as { images?: string[] }).images?.[0]).toBe(
      'https://cdn.example.com/hero.jpg',
    )
  })

  it('ogImages() yields the uploaded hero (so seoMeta keeps it) when a heroUrl exists', () => {
    const imgs = ogImages(BASE, '/media/hero.png', undefined, 'Hero alt')
    const m = seoMeta({ canonical: '/z', title: 'Doc', siteName: 'Site', images: imgs })
    expect(ogUrlOf(m)).toBe(`${BASE}/media/hero.png`)
    expect(ogUrlOf(m)).not.toContain('/og?')
  })

  it('ogImages() is empty when neither hero nor default exists → seoMeta falls back to /og', () => {
    const imgs = ogImages(BASE, undefined, undefined, 'alt')
    expect(imgs).toEqual([])
    const m = seoMeta({ canonical: '/z', title: 'Imageless Doc', siteName: 'Site', images: imgs })
    expect(ogUrlOf(m).startsWith('/og?')).toBe(true)
  })
})
