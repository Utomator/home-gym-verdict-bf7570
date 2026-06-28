import { blocksHaveAffiliateRoundup, bodyHasSponsoredLink, outboundRel } from '@p51/engine'
import { describe, expect, it } from 'vitest'

describe('outboundRel', () => {
  it('keeps unflagged outbound links FOLLOWED (no nofollow/sponsored)', () => {
    // The core regression guard: editorial citations must not be suppressed.
    expect(outboundRel(undefined, true)).toBe('noopener noreferrer')
    expect(outboundRel('follow', true)).toBe('noopener noreferrer')
    expect(outboundRel(null, true)).toBe('noopener noreferrer')
  })

  it('emits no rel for a followed same-tab link', () => {
    expect(outboundRel(undefined, false)).toBe('')
  })

  it('adds sponsored + nofollow only when flagged sponsored', () => {
    expect(outboundRel('sponsored', true)).toBe('sponsored nofollow noopener noreferrer')
    expect(outboundRel('sponsored', false)).toBe('sponsored nofollow')
  })

  it('maps ugc and nofollow flags correctly', () => {
    expect(outboundRel('ugc', true)).toBe('ugc noopener noreferrer')
    expect(outboundRel('nofollow', true)).toBe('nofollow noopener noreferrer')
  })

  it('never duplicates tokens', () => {
    const rel = outboundRel('sponsored', true)
    const toks = rel.split(' ')
    expect(new Set(toks).size).toBe(toks.length)
  })
})

const link = (linkRel: string | undefined, text = 'x') => ({
  type: 'link',
  fields: { url: 'https://example.com', ...(linkRel ? { linkRel } : {}) },
  children: [{ type: 'text', text }],
})
const editorState = (children: unknown[]) => ({ root: { children } })

describe('bodyHasSponsoredLink', () => {
  it('detects a top-level sponsored link', () => {
    expect(bodyHasSponsoredLink(editorState([link('sponsored')]))).toBe(true)
  })

  it('detects a sponsored autolink node', () => {
    expect(bodyHasSponsoredLink(editorState([{ ...link('sponsored'), type: 'autolink' }]))).toBe(
      true,
    )
  })

  it('detects a sponsored link nested in a list', () => {
    const nested = editorState([
      { type: 'list', children: [{ type: 'listitem', children: [link('sponsored')] }] },
    ])
    expect(bodyHasSponsoredLink(nested)).toBe(true)
  })

  it('returns false for editorial / ugc / unflagged links only', () => {
    expect(bodyHasSponsoredLink(editorState([link(undefined), link('follow'), link('ugc')]))).toBe(
      false,
    )
  })

  it('returns false for empty or missing body', () => {
    expect(bodyHasSponsoredLink(editorState([]))).toBe(false)
    expect(bodyHasSponsoredLink(null)).toBe(false)
    expect(bodyHasSponsoredLink(undefined)).toBe(false)
  })
})

const roundupBlock = (items: { affiliateUrl?: string | null }[]) => ({
  blockType: 'productRoundup',
  items,
})

describe('blocksHaveAffiliateRoundup (gates the FTC disclosure for roundups)', () => {
  it('detects a productRoundup block whose item carries an affiliateUrl', () => {
    const body = [
      { blockType: 'richText', content: {} },
      roundupBlock([{ affiliateUrl: 'https://go.example/acme' }]),
    ]
    expect(blocksHaveAffiliateRoundup(body)).toBe(true)
  })

  it('detects when only the second item of the roundup has an affiliate link', () => {
    const body = [roundupBlock([{ affiliateUrl: null }, { affiliateUrl: 'https://go.example/b' }])]
    expect(blocksHaveAffiliateRoundup(body)).toBe(true)
  })

  it('returns false for a roundup whose items have no affiliate links', () => {
    expect(blocksHaveAffiliateRoundup([roundupBlock([{ affiliateUrl: '   ' }, {}])])).toBe(false)
  })

  it('returns false when there is no productRoundup block', () => {
    const body = [
      { blockType: 'richText', content: {} },
      { blockType: 'cta', heading: 'h', buttonLabel: 'go', buttonHref: '/x' },
    ]
    expect(blocksHaveAffiliateRoundup(body)).toBe(false)
  })

  it('returns false for non-array / nullish input', () => {
    expect(blocksHaveAffiliateRoundup(null)).toBe(false)
    expect(blocksHaveAffiliateRoundup(undefined)).toBe(false)
    expect(blocksHaveAffiliateRoundup({})).toBe(false)
  })
})
