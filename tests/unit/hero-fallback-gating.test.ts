import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Default (unbranded) site config ⇒ CodeGenHero falls back to the engine indigo.
vi.mock('@/site.config', () => ({
  default: { archetype: 'affiliate', business: { name: 'Test Co' } },
}))
// Mock next/image the same way the page renders it, so we can detect the uploaded
// hero branch by its <img> while keeping the test in the `node` env.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', { src: props.src, alt: props.alt, 'data-uploaded-hero': 'true' }),
}))

import Image from 'next/image'
import { CodeGenHero } from '@/components/marketing/CodeGenHero'

type MediaLike = {
  url?: string | null
  width?: number | null
  height?: number | null
  alt?: string | null
}

/**
 * Mirrors the EXACT hero gate the blog/[slug] + [slug] pages use:
 *   hero?.url ? <uploaded Image/> : <CodeGenHero fallback/>
 * Tests the contract that the code-generated hero is used iff there is no
 * uploaded image — without booting the server component's Payload/DB stack.
 */
function HeroZone({ hero, title }: { hero?: MediaLike; title: string }): ReactNode {
  return hero?.url
    ? createElement(Image as never, {
        src: hero.url,
        alt: hero.alt ?? title,
        width: hero.width ?? 1200,
        height: hero.height ?? 630,
      })
    : createElement(CodeGenHero, { title })
}

const render = (hero: MediaLike | undefined, title: string) =>
  renderToStaticMarkup(createElement(HeroZone, { hero, title }))

describe('hero fallback gating', () => {
  it('uses the code-generated hero (inline <svg>) when there is NO uploaded image', () => {
    const html = render(undefined, 'No Hero Image Post')
    expect(html).toContain('<svg')
    expect(html).toContain('No Hero Image Post')
    // The uploaded-image branch did NOT render.
    expect(html).not.toContain('data-uploaded-hero')
  })

  it('uses the code-generated hero when the media object lacks a url', () => {
    const html = render({ alt: 'orphan' }, 'Urlless Media Post')
    expect(html).toContain('<svg')
    expect(html).not.toContain('data-uploaded-hero')
  })

  it('uses the uploaded image (NOT the fallback) when a heroImage is present', () => {
    const html = render({ url: 'https://cdn.example.com/hero.jpg', alt: 'Real hero' }, 'Has Hero')
    // The uploaded image rendered…
    expect(html).toContain('data-uploaded-hero')
    expect(html).toContain('https://cdn.example.com/hero.jpg')
    // …and the code-generated SVG fallback did NOT.
    expect(html).not.toContain('<svg')
  })
})
