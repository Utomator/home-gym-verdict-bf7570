import { expect, test } from '@playwright/test'

test('contact page renders form fields', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.locator('h1')).toContainText(/Start a project/i)
  await expect(page.locator('input[name="name"]')).toBeVisible()
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('textarea[name="message"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('contact form happy path: submit and see thanks', async ({ page }) => {
  await page.goto('/contact')
  const stamp = Date.now()
  await page.fill('input[name="name"]', 'Playwright Bot')
  await page.fill('input[name="email"]', `playwright+${stamp}@example.com`)
  await page.fill('input[name="company"]', 'Project51 QA')
  await page.fill(
    'textarea[name="message"]',
    'Automated submission from Playwright. This message exceeds ten characters to satisfy zod validation.',
  )
  await page.click('button[type="submit"]')
  await expect(page.getByText("Thanks — we'll be in touch.")).toBeVisible({ timeout: 15000 })
})

test('contact form: client-side validation rejects bad email', async ({ page }) => {
  await page.goto('/contact')
  await page.fill('input[name="name"]', 'A')
  await page.fill('input[name="email"]', 'not-an-email')
  await page.fill('textarea[name="message"]', 'message of sufficient length to pass zod')
  await page.click('button[type="submit"]')
  // The browser's built-in validity (type="email") should block submission;
  // the form stays visible and no "Thanks" message appears within 2s.
  await expect(page.getByText("Thanks — we'll be in touch.")).not.toBeVisible({ timeout: 2000 })
})
