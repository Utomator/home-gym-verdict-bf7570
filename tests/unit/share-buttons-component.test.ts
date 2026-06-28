import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ShareButtons } from '@/components/marketing/ShareButtons'

const url = 'https://example.com/blog/post-one'
const title = 'A & B: The Post'

const render = () => renderToStaticMarkup(createElement(ShareButtons, { url, title }))

describe('ShareButtons component', () => {
  const html = render()

  it('renders X / LinkedIn / Facebook anchors with encoded share URLs', () => {
    expect(html).toContain('https://twitter.com/intent/tweet')
    expect(html).toContain(`url=${encodeURIComponent(url)}`)
    expect(html).toContain('https://www.linkedin.com/sharing/share-offsite/')
    expect(html).toContain('https://www.facebook.com/sharer/sharer.php')
  })

  it('encodes the ampersand from the title (no raw "A & B")', () => {
    expect(html).not.toContain('text=A & B')
    expect(html).toContain('%26')
  })

  it('uses rel="noopener noreferrer" and opens in a new tab (no tracking script)', () => {
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
    // No analytics/tracking script tag rendered.
    expect(html).not.toContain('<script')
  })

  it('gives each network link an accessible name via aria-label', () => {
    expect(html).toContain('aria-label="Share on X"')
    expect(html).toContain('aria-label="Share on LinkedIn"')
    expect(html).toContain('aria-label="Share on Facebook"')
  })

  it('renders the copy-link control as a button with an accessible name', () => {
    expect(html).toContain('aria-label="Copy link to clipboard"')
  })
})
