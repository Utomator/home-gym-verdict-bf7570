import { expect, test } from '@playwright/test'

test('home page renders hero headline', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText(/Software that ships/i)
})

test('Project51 brand appears in the header', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header').getByText('Project51').first()).toBeVisible()
})

test('home emits Organization JSON-LD', async ({ page }) => {
  await page.goto('/')
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
  expect(ld).toContain('"@type":"Organization"')
})

test('home emits WebSite JSON-LD with SearchAction', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  expect(html).toContain('"@type":"WebSite"')
  expect(html).toContain('search?q={search_term_string}')
})

test('blog index renders heading even without posts', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.locator('h1')).toContainText(/Field notes/i)
})

test('admin route is reachable and branded', async ({ page }) => {
  await page.goto('/admin')
  // Either the dashboard or the login screen, both branded with " · Project51"
  await expect(page).toHaveTitle(/(Dashboard|Login).*Project51/)
})

test('soft-launch noindex meta is present when SITE_INDEXABLE=false', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  // Either the meta tag (Next emits robots from generateMetadata) or no tag (when SITE_INDEXABLE=true).
  // On the soft-launch temp domain we expect noindex.
  if (process.env.E2E_EXPECT_INDEXABLE !== 'true') {
    expect(html).toMatch(/<meta name="robots" content="noindex/i)
  }
})
