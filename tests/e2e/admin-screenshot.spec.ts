import { test } from '@playwright/test'

test('screenshot admin login', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/admin/login', { waitUntil: 'networkidle' })
  // Wait for Payload to actually render the login form
  await page.waitForSelector('button:has-text("Login"), input[type="email"]', { timeout: 15000 })
  await page.screenshot({ path: 'test-results/screens/admin-login.png', fullPage: true })
})
