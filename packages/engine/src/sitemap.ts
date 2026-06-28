export type SitemapEntry = {
  path: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function buildSitemapXml(baseUrl: string, entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const loc = xmlEscape(`${baseUrl}${e.path}`)
      const parts = [`    <loc>${loc}</loc>`]
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`)
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`)
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ]
    .filter(Boolean)
    .join('\n')
}
