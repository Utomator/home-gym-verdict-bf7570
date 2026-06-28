import { describe, expect, it } from 'vitest'
import {
  serializeBlocks,
  serializeLexicalField,
  serializeToMarkdown,
} from '@/lib/markdown/payload-to-md'

const para = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
})

const lexicalRoot = (children: unknown[]) => ({
  root: {
    children,
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
  },
})

describe('serializeToMarkdown', () => {
  it('emits frontmatter + paragraph body', () => {
    const out = serializeToMarkdown({
      frontmatter: {
        title: 'Hello',
        author: 'Jane',
        publishedAt: '2026-01-01',
        canonicalUrl: 'https://example.com/blog/hello',
        answerSummary: 'A summary.',
      },
      lexical: lexicalRoot([para('Body text.')]),
    })
    expect(out).toMatch(/^---\n/)
    expect(out).toContain('title: "Hello"')
    expect(out).toContain('author: "Jane"')
    expect(out).toContain('canonicalUrl: "https://example.com/blog/hello"')
    expect(out).toContain('answerSummary: "A summary."')
    expect(out).toContain('Body text.')
  })

  it('escapes double quotes in frontmatter values', () => {
    const out = serializeToMarkdown({
      frontmatter: {
        title: 'He said "hi"',
        canonicalUrl: 'https://x.com/a',
      },
      lexical: lexicalRoot([para('p')]),
    })
    expect(out).toContain('title: "He said \\"hi\\""')
  })

  it('omits undefined frontmatter keys', () => {
    const out = serializeToMarkdown({
      frontmatter: {
        title: 't',
        canonicalUrl: 'https://x.com/',
        // author/publishedAt deliberately absent
      },
      lexical: lexicalRoot([para('p')]),
    })
    expect(out).not.toContain('author:')
    expect(out).not.toContain('publishedAt:')
  })

  it('returns trailing newline after body', () => {
    const out = serializeToMarkdown({
      frontmatter: { title: 't', canonicalUrl: 'https://x.com/' },
      lexical: lexicalRoot([para('one')]),
    })
    expect(out.endsWith('\n')).toBe(true)
  })

  // ── Item 16 regression: the /md/* mirror serializes a REAL post body without
  // dropping content. A published post mixes headings, lists, links, and inline
  // formatting — exactly the node types whose mishandling produced the audit's
  // "/md returned 404 / serialization inconsistency". These lock each node type.
  it('serializes a realistic mixed blog body (heading, list, link, formatting)', () => {
    const out = serializeToMarkdown({
      frontmatter: { title: 'Guide', canonicalUrl: 'https://x.com/blog/guide' },
      lexical: lexicalRoot([
        { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Setup' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Bold', format: 1 },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'code', format: 16 },
          ],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            { type: 'listitem', children: [{ type: 'text', text: 'one' }] },
            { type: 'listitem', children: [{ type: 'text', text: 'two' }] },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              fields: { url: 'https://ref.example/x' },
              children: [{ type: 'text', text: 'ref' }],
            },
          ],
        },
      ]),
    })
    expect(out).toContain('## Setup')
    expect(out).toContain('**Bold** and `code`')
    expect(out).toContain('- one')
    expect(out).toContain('- two')
    expect(out).toContain('[ref](https://ref.example/x)')
  })

  it('numbers ordered lists', () => {
    const out = serializeToMarkdown({
      frontmatter: { title: 't', canonicalUrl: 'https://x.com/' },
      lexical: lexicalRoot([
        {
          type: 'list',
          listType: 'number',
          children: [
            { type: 'listitem', children: [{ type: 'text', text: 'first' }] },
            { type: 'listitem', children: [{ type: 'text', text: 'second' }] },
          ],
        },
      ]),
    })
    expect(out).toContain('1. first')
    expect(out).toContain('2. second')
  })
})

describe('serializeLexicalField', () => {
  it('serializes a richText field root to markdown', () => {
    const field = lexicalRoot([para('Field body.')])
    expect(serializeLexicalField(field)).toContain('Field body.')
  })

  it('returns empty string for an absent field', () => {
    expect(serializeLexicalField(null)).toBe('')
    expect(serializeLexicalField(undefined)).toBe('')
    expect(serializeLexicalField({})).toBe('')
  })
})

describe('serializeBlocks (pages bodies)', () => {
  it('serializes richText + cta blocks and skips unknown blocks', () => {
    const out = serializeBlocks([
      { blockType: 'richText', content: lexicalRoot([para('Intro prose.')]) },
      {
        blockType: 'cta',
        heading: 'Get started',
        subheading: 'Today.',
        buttonLabel: 'Go',
        buttonHref: '/contact',
      },
      { blockType: 'unknownBlock', content: lexicalRoot([para('hidden')]) },
    ])
    expect(out).toContain('Intro prose.')
    expect(out).toContain('## Get started')
    expect(out).toContain('Today.')
    expect(out).toContain('[Go](/contact)')
    expect(out).not.toContain('hidden')
  })

  it('returns empty string for a non-array body', () => {
    expect(serializeBlocks(undefined)).toBe('')
    expect(serializeBlocks(null)).toBe('')
  })
})
