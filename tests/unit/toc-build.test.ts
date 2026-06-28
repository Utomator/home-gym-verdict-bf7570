import { extractHeadings, slugifyHeading } from '@p51/engine'
import { describe, expect, it } from 'vitest'

/**
 * The blog/[slug] TableOfContents is fed by extractHeadings(post.body). These
 * tests lock in that a Lexical body produces ordered anchor headings whose ids
 * match slugifyHeading — i.e. the ToC links resolve to the rendered headings.
 */

const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text }],
})
const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
})

const body = {
  root: {
    children: [
      heading('h2', 'Getting Started'),
      paragraph('Intro copy that should be ignored.'),
      heading('h3', 'Install the CLI'),
      heading('h2', 'Advanced Usage & Tips'),
    ],
  },
}

describe('extractHeadings → TableOfContents data', () => {
  it('extracts h2/h3 headings in document order', () => {
    const out = extractHeadings(body)
    expect(out.map((h) => h.text)).toEqual([
      'Getting Started',
      'Install the CLI',
      'Advanced Usage & Tips',
    ])
    expect(out.map((h) => h.level)).toEqual([2, 3, 2])
  })

  it('derives anchor ids via slugifyHeading so links match rendered headings', () => {
    const out = extractHeadings(body)
    expect(out[0].id).toBe(slugifyHeading('Getting Started'))
    expect(out[0].id).toBe('getting-started')
    // Special chars stripped, spaces collapsed to single hyphens.
    expect(out[2].id).toBe('advanced-usage-tips')
  })

  it('ignores non-heading nodes and unsupported heading levels', () => {
    const withH1H4 = {
      root: {
        children: [heading('h1', 'Title'), heading('h4', 'Too Deep'), heading('h2', 'Kept')],
      },
    }
    const out = extractHeadings(withH1H4)
    expect(out.map((h) => h.text)).toEqual(['Kept'])
  })

  it('returns an empty list for an empty / malformed body', () => {
    expect(extractHeadings(null)).toEqual([])
    expect(extractHeadings({ root: { children: [] } })).toEqual([])
  })
})
