import { describe, expect, it } from 'vitest'
import { buildSitemapXml, type SitemapEntry } from '@p51/engine'

describe('buildSitemapXml', () => {
  const baseUrl = 'https://example.com'

  it('renders an empty sitemap', () => {
    const xml = buildSitemapXml(baseUrl, [])
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('</urlset>')
    expect(xml).not.toContain('<url>')
  })

  it('renders entries with absolute loc and lastmod', () => {
    const entries: SitemapEntry[] = [
      { path: '/', lastmod: '2026-01-01' },
      { path: '/blog/foo', lastmod: '2026-02-15' },
    ]
    const xml = buildSitemapXml(baseUrl, entries)
    expect(xml).toContain('<loc>https://example.com/</loc>')
    expect(xml).toContain('<loc>https://example.com/blog/foo</loc>')
    expect(xml).toContain('<lastmod>2026-01-01</lastmod>')
  })

  it('escapes XML-unsafe chars in paths', () => {
    const xml = buildSitemapXml(baseUrl, [{ path: '/x?y=1&z=2' }])
    expect(xml).toContain('<loc>https://example.com/x?y=1&amp;z=2</loc>')
  })
})
