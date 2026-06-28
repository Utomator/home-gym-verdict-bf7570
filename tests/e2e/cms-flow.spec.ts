import { expect, test } from '@playwright/test'

const ADMIN_EMAIL = process.env.PAYLOAD_TEST_EMAIL ?? 'spacebar.post@gmail.com'
const ADMIN_PASSWORD = process.env.PAYLOAD_TEST_PASSWORD ?? 'spacebar.post@gmail.com!@#'

const STAMP = Date.now().toString(36)
const POST_TITLE = `Playwright Field Note ${STAMP}`
const POST_SLUG = `playwright-field-note-${STAMP}`

test.describe.configure({ mode: 'serial' })

test('login as the admin user', async ({ page }) => {
  await login(page)
  await expect(page).toHaveURL(/\/admin(?!\/login)/)
  await page.screenshot({ path: 'test-results/screens/admin-dashboard.png', fullPage: true })
})

test('create a BlogPost via admin and publish it', async ({ page }) => {
  await login(page)
  await page.goto('/admin/collections/blog-posts/create', { waitUntil: 'networkidle' })
  await page.waitForSelector('input[name="title"]', { state: 'visible', timeout: 30000 })

  await page.fill('input[name="title"]', POST_TITLE)
  await page.fill('input[name="slug"]', POST_SLUG)
  await page.fill(
    'textarea[name="excerpt"]',
    'A test post written by Playwright to validate the CMS pipeline.',
  )

  // Lexical editor — focus the first contenteditable inside the body field area
  const lexical = page.locator('[contenteditable="true"]').first()
  await lexical.click()
  await page.keyboard.type(
    'This is the body of the Playwright field note. Lorem ipsum dolor sit amet.',
  )

  await clickPublish(page)
  await expect(page.locator('body')).toContainText(/published successfully|Published/i, {
    timeout: 20000,
  })
  await page.screenshot({ path: 'test-results/screens/admin-blog-created.png', fullPage: true })
})

test('public marketing site shows the new BlogPost in the index', async ({ page }) => {
  await page.goto('/blog', { waitUntil: 'networkidle' })
  await expect
    .poll(
      async () => {
        await page.reload({ waitUntil: 'networkidle' })
        return await page.locator('a', { hasText: POST_TITLE }).count()
      },
      { timeout: 30000, intervals: [3000, 3000, 5000, 5000, 5000, 5000] },
    )
    .toBeGreaterThan(0)

  await page.click(`a:has-text("${POST_TITLE}")`)
  await page.waitForURL(`**/blog/${POST_SLUG}`)
  await expect(page.locator('h1')).toContainText(POST_TITLE)
  // Body text we typed should appear too
  await expect(page.locator('article')).toContainText(/Lorem ipsum dolor sit amet/)
})

test('blog post is reachable via Accept: text/markdown', async ({ request }) => {
  const r = await request.get(`/blog/${POST_SLUG}`, { headers: { accept: 'text/markdown' } })
  expect(r.status()).toBe(200)
  expect(r.headers()['content-type']).toContain('text/markdown')
  const md = await r.text()
  expect(md).toMatch(/^---/)
  expect(md).toContain(POST_TITLE)
})

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.fill('input[name="email"]', ADMIN_EMAIL)
  await page.fill('input[name="password"]', ADMIN_PASSWORD)
  await Promise.all([
    page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }),
    page.click('button:has-text("Login"), [type="submit"]'),
  ])
  await page.waitForLoadState('networkidle')
}

async function clickPublish(page: import('@playwright/test').Page) {
  // Payload v3.84 button label is "Publish changes" while in draft state.
  const publish = page.getByRole('button', { name: /^publish( changes)?$/i }).first()
  await publish.waitFor({ state: 'visible', timeout: 10000 })
  await publish.click()
}
