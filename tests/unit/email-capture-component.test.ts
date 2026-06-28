import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// The action is a 'use server' module; stub it so the client component renders
// in a plain node test without pulling in Payload.
vi.mock('@/app/(marketing)/_actions/subscribe', () => ({
  submitSubscribe: vi.fn(),
}))

import { EmailCapture } from '@/components/marketing/EmailCapture'

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(EmailCapture, props as never))

describe('EmailCapture component', () => {
  it('renders an accessible, labelled email input', () => {
    const html = render()
    expect(html).toContain('type="email"')
    expect(html).toContain('name="email"')
    expect(html).toContain('required')
    // A <label> is associated with the input (sr-only is still a real label).
    expect(html).toContain('Email address')
    expect(html).toContain('<label')
  })

  it('includes a hidden honeypot field for anti-spam', () => {
    const html = render()
    expect(html).toContain('name="company_url"')
    expect(html).toContain('tabindex="-1"')
  })

  it('forwards the configured source tag as a hidden field', () => {
    const html = render({ source: 'blog-footer' })
    expect(html).toContain('name="source"')
    expect(html).toContain('value="blog-footer"')
  })

  it('defaults the source to "newsletter"', () => {
    const html = render()
    expect(html).toContain('value="newsletter"')
  })

  it('renders an eyebrow + heading in the section variant', () => {
    const html = render({ variant: 'section', heading: 'Join the list', eyebrow: 'Newsletter' })
    expect(html).toContain('Join the list')
    expect(html).toContain('Newsletter')
  })

  it('uses brand token classes (not hardcoded brand colors)', () => {
    const html = render({ variant: 'section' })
    expect(html).toContain('text-primary')
    expect(html).toContain('border-border')
    // No raw hex brand color baked into the markup.
    expect(html).not.toMatch(/#4f46e5/i)
  })
})
