import { describe, expect, it } from 'vitest'
import { shareTargets } from '@/components/marketing/share-urls'

const url = 'https://example.com/blog/best-standing-desks'
const title = 'The Best Standing Desks of 2026 & Why'

describe('shareTargets', () => {
  const targets = shareTargets(url, title)
  const byId = (id: string) => targets.find((t) => t.id === id)

  it('emits X / LinkedIn / Facebook targets plus a copy action', () => {
    expect(targets.map((t) => t.id).sort()).toEqual(['copy', 'facebook', 'linkedin', 'x'].sort())
  })

  it('URL-encodes the page url and title into the X share link', () => {
    const x = byId('x')
    expect(x?.href).toContain('https://twitter.com/intent/tweet')
    expect(x?.href).toContain(`url=${encodeURIComponent(url)}`)
    expect(x?.href).toContain(`text=${encodeURIComponent(title)}`)
    // The raw ampersand from the title must be percent-encoded, not literal.
    expect(x?.href).not.toContain('2026 & Why')
    expect(x?.href).toContain('%26')
  })

  it('builds a LinkedIn share link with the encoded url', () => {
    const li = byId('linkedin')
    expect(li?.href).toContain('https://www.linkedin.com/sharing/share-offsite/')
    expect(li?.href).toContain(`url=${encodeURIComponent(url)}`)
  })

  it('builds a Facebook sharer link with the encoded url', () => {
    const fb = byId('facebook')
    expect(fb?.href).toContain('https://www.facebook.com/sharer/sharer.php')
    expect(fb?.href).toContain(`u=${encodeURIComponent(url)}`)
  })

  it('marks copy as the non-href action and the rest as real links', () => {
    expect(byId('copy')?.href).toBeUndefined()
    for (const id of ['x', 'linkedin', 'facebook']) {
      expect(byId(id)?.href?.startsWith('https://')).toBe(true)
    }
  })

  it('gives every target an accessible label', () => {
    for (const t of targets) {
      expect(typeof t.label).toBe('string')
      expect(t.label.length).toBeGreaterThan(0)
    }
  })
})
