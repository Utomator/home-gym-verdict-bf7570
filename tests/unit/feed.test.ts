import { buildRssXml, lexicalToHtml } from '@p51/engine'
import { describe, expect, it } from 'vitest'

describe('buildRssXml', () => {
  it('renders channel + items', () => {
    const xml = buildRssXml({
      title: 'Project51 Blog',
      link: 'https://example.com/blog',
      description: 'Posts',
      items: [
        {
          title: 'A & B',
          link: 'https://example.com/blog/a',
          guid: 'https://example.com/blog/a',
          pubDate: new Date('2026-01-01T00:00:00Z'),
          description: 'desc',
        },
      ],
    })
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>A &amp; B</title>')
    expect(xml).toContain('<pubDate>Thu, 01 Jan 2026 00:00:00 GMT</pubDate>')
  })

  it('renders an empty feed without item entries', () => {
    const xml = buildRssXml({
      title: 't',
      link: 'https://x.com',
      description: 'd',
      items: [],
    })
    expect(xml).toContain('<channel>')
    expect(xml).not.toContain('<item>')
  })

  it('declares the content + dc namespaces and a self-link', () => {
    const xml = buildRssXml({
      title: 't',
      link: 'https://x.com/blog',
      description: 'd',
      selfLink: 'https://x.com/feed.xml',
      items: [],
    })
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"')
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"')
    expect(xml).toContain(
      '<atom:link href="https://x.com/feed.xml" rel="self" type="application/rss+xml"/>',
    )
  })

  it('emits language, ttl, and lastBuildDate from the newest item', () => {
    const xml = buildRssXml({
      title: 't',
      link: 'https://x.com/blog',
      description: 'd',
      language: 'en',
      ttlMinutes: 60,
      items: [
        {
          title: 'old',
          link: 'https://x.com/blog/old',
          guid: 'https://x.com/blog/old',
          pubDate: new Date('2026-01-01T00:00:00Z'),
        },
        {
          title: 'new',
          link: 'https://x.com/blog/new',
          guid: 'https://x.com/blog/new',
          pubDate: new Date('2026-02-01T00:00:00Z'),
        },
      ],
    })
    expect(xml).toContain('<language>en</language>')
    expect(xml).toContain('<ttl>60</ttl>')
    // lastBuildDate tracks the most recent pubDate, not the first item.
    expect(xml).toContain('<lastBuildDate>Sun, 01 Feb 2026 00:00:00 GMT</lastBuildDate>')
  })

  it('emits content:encoded (CDATA) and dc:creator per item', () => {
    const xml = buildRssXml({
      title: 't',
      link: 'https://x.com/blog',
      description: 'd',
      items: [
        {
          title: 'Post',
          link: 'https://x.com/blog/p',
          guid: 'https://x.com/blog/p',
          pubDate: new Date('2026-01-01T00:00:00Z'),
          description: 'excerpt',
          contentHtml: '<p>Hello <strong>world</strong></p>',
          author: 'Jane Doe',
        },
      ],
    })
    expect(xml).toContain('<dc:creator>Jane Doe</dc:creator>')
    expect(xml).toContain(
      '<content:encoded><![CDATA[<p>Hello <strong>world</strong></p>]]></content:encoded>',
    )
    // Excerpt still present as the plain <description>.
    expect(xml).toContain('<description>excerpt</description>')
  })

  it('splits a literal ]]> so it cannot terminate the CDATA section early', () => {
    const xml = buildRssXml({
      title: 't',
      link: 'https://x.com/blog',
      description: 'd',
      items: [
        {
          title: 'P',
          link: 'https://x.com/blog/p',
          guid: 'https://x.com/blog/p',
          pubDate: new Date('2026-01-01T00:00:00Z'),
          contentHtml: '<p>a]]>b</p>',
        },
      ],
    })
    // The raw, unsplit sequence must NOT survive inside the encoded content.
    expect(xml).toContain(']]]]><![CDATA[>')
    expect(xml).not.toContain('a]]>b')
  })
})

describe('lexicalToHtml', () => {
  it('serializes paragraphs, headings, formatting, lists, and links', () => {
    const html = lexicalToHtml({
      root: {
        children: [
          { type: 'heading', tag: 'h2', children: [{ text: 'Title' }] },
          {
            type: 'paragraph',
            children: [
              { text: 'Plain ' },
              { text: 'bold', format: 1 },
              { text: ' and ' },
              { text: 'code', format: 16 },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              { type: 'listitem', children: [{ text: 'one' }] },
              { type: 'listitem', children: [{ text: 'two' }] },
            ],
          },
          {
            type: 'paragraph',
            children: [
              { type: 'link', fields: { url: 'https://x.com' }, children: [{ text: 'x' }] },
            ],
          },
        ],
      },
    })
    expect(html).toContain('<h2>Title</h2>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>')
    expect(html).toContain('<a href="https://x.com">x</a>')
  })

  it('escapes text but keeps structural tags, and returns "" for empty input', () => {
    const html = lexicalToHtml({
      root: { children: [{ type: 'paragraph', children: [{ text: '<script>&"' }] }] },
    })
    expect(html).toBe('<p>&lt;script&gt;&amp;&quot;</p>')
    expect(lexicalToHtml(undefined)).toBe('')
    expect(lexicalToHtml({ root: { children: [] } })).toBe('')
  })
})
