import { test } from '@playwright/test'

test('inspect blog-posts create DOM for body field', async ({ page }) => {
  await page.goto('/admin/login')
  await page.fill('input[name="email"]', 'spacebar.post@gmail.com')
  await page.fill('input[name="password"]', 'spacebar.post@gmail.com!@#')
  await Promise.all([
    page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }),
    page.click('button:has-text("Login")'),
  ])
  await page.goto('/admin/collections/blog-posts/create', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  // search the rendered HTML for hints about the body field
  const html = await page.content()
  console.log('=== includes "field-body":', html.includes('field-body'))
  console.log('=== includes "data-field":', html.includes('data-field'))
  console.log('=== includes "lexical":', html.includes('lexical'))
  console.log('=== includes "richText":', html.includes('richText') || html.includes('rich-text'))

  // Find anything that might be the Body label
  const labels = await page.evaluate(() => {
    const out: { text: string; for: string | null }[] = []
    for (const lbl of Array.from(document.querySelectorAll('label'))) {
      out.push({ text: lbl.textContent?.trim() ?? '', for: lbl.getAttribute('for') })
    }
    // Also get all element ids that contain 'body' or 'rich'
    const matches: string[] = []
    for (const el of Array.from(
      document.querySelectorAll(
        '[id*="body" i], [id*="rich" i], [class*="rich" i], [class*="lexical" i]',
      ),
    )) {
      matches.push(`${el.tagName}#${el.id}.${(el as HTMLElement).className}`)
    }
    return { labels: out, bodyMatches: matches }
  })
  console.log('=== labels ===')
  for (const l of result(labels.labels)) console.log(JSON.stringify(l))
  console.log('=== body/lexical-related selectors ===')
  for (const m of labels.bodyMatches.slice(0, 20)) console.log(m)
})

function result<T>(x: T[]): T[] {
  return x
}
