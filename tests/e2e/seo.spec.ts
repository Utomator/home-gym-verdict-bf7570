import { expect, test } from '@playwright/test'

test('robots.txt exists', async ({ request }) => {
  const r = await request.get('/robots.txt')
  expect(r.status()).toBe(200)
  const text = await r.text()
  // SITE_INDEXABLE=false → "User-agent: * / Disallow: /"
  // SITE_INDEXABLE=true  → contains Sitemap: line
  if (text.includes('Sitemap:')) {
    expect(text).toMatch(/Sitemap:\s*https?:\/\/.+\/sitemap\.xml/)
  } else {
    expect(text).toMatch(/Disallow:\s*\//)
  }
})

test('sitemap.xml is well-formed', async ({ request }) => {
  const r = await request.get('/sitemap.xml')
  expect(r.status()).toBe(200)
  const xml = await r.text()
  expect(xml).toContain('<urlset')
})

test('feed.xml is well-formed', async ({ request }) => {
  const r = await request.get('/feed.xml')
  expect(r.status()).toBe(200)
  const xml = await r.text()
  expect(xml).toContain('<rss')
})

test('Accept: text/markdown returns markdown on home', async ({ request }) => {
  const r = await request.get('/', { headers: { accept: 'text/markdown' } })
  expect(r.status()).toBe(200)
  expect(r.headers()['content-type']).toContain('text/markdown')
  expect(await r.text()).toMatch(/^---/)
})

test('llms.txt resolves', async ({ request }) => {
  const r = await request.get('/llms.txt')
  expect(r.status()).toBe(200)
})

test('well-known api-catalog resolves', async ({ request }) => {
  const r = await request.get('/.well-known/api-catalog')
  expect(r.status()).toBe(200)
  expect(r.headers()['content-type']).toContain('linkset+json')
})

test('well-known mcp server-card resolves', async ({ request }) => {
  const r = await request.get('/.well-known/mcp/server-card.json')
  expect(r.status()).toBe(200)
  const j = await r.json()
  expect(j.transport.type).toBe('http')
})
