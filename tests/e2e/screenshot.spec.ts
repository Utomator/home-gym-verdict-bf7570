import { test } from '@playwright/test'

const ROUTES = ['/', '/blog', '/contact']

for (const route of ROUTES) {
  test(`screenshot ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(route)
    const safe = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-')
    await page.screenshot({ path: `test-results/screens/${safe}.png`, fullPage: true })
  })
}
