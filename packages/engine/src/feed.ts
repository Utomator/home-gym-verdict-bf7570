export type RssItem = {
  title: string
  link: string
  guid: string
  pubDate: Date
  description?: string
  /**
   * Full article body as HTML, emitted as `<content:encoded>` (CDATA-wrapped).
   * Lets aggregators and feed-based AI crawlers ingest the whole post, not just
   * the excerpt. Omitted → no content:encoded element for that item.
   */
  contentHtml?: string
  /** Author byline → `<dc:creator>` (Dublin Core). Omitted when unknown. */
  author?: string
}

export type RssChannel = {
  title: string
  link: string
  description: string
  // Absolute URL of the feed itself, used for the atom:self self-link (optional).
  selfLink?: string
  /** Optional language tag for `<language>` (e.g. 'en'). */
  language?: string
  /**
   * Optional `<ttl>` in minutes — how long an aggregator may cache the feed
   * before refetching. Omitted → no ttl element.
   */
  ttlMinutes?: number
  items: RssItem[]
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// content:encoded carries raw HTML, so it is wrapped in CDATA rather than
// entity-escaped. Guard against a literal `]]>` inside the body closing the
// CDATA section early by splitting the sequence across two sections.
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

export function buildRssXml(c: RssChannel): string {
  const items = c.items
    .map(
      (i) => `
    <item>
      <title>${xmlEscape(i.title)}</title>
      <link>${xmlEscape(i.link)}</link>
      <guid isPermaLink="true">${xmlEscape(i.guid)}</guid>
      <pubDate>${i.pubDate.toUTCString()}</pubDate>${
        i.author ? `\n      <dc:creator>${xmlEscape(i.author)}</dc:creator>` : ''
      }
      ${i.description ? `<description>${xmlEscape(i.description)}</description>` : ''}${
        i.contentHtml ? `\n      <content:encoded>${cdata(i.contentHtml)}</content:encoded>` : ''
      }
    </item>`,
    )
    .join('')

  // Use the most recent item's pubDate as lastBuildDate (avoids a non-deterministic
  // Date.now()); fall back to nothing when there are no items.
  const latest = c.items.reduce<Date | undefined>(
    (acc, i) => (!acc || i.pubDate > acc ? i.pubDate : acc),
    undefined,
  )
  const lastBuildDate = latest ? `\n    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>` : ''
  const selfLinkTag = c.selfLink
    ? `\n    <atom:link href="${xmlEscape(c.selfLink)}" rel="self" type="application/rss+xml"/>`
    : ''
  const languageTag = c.language ? `\n    <language>${xmlEscape(c.language)}</language>` : ''
  const ttlTag =
    typeof c.ttlMinutes === 'number' ? `\n    <ttl>${Math.round(c.ttlMinutes)}</ttl>` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(c.title)}</title>
    <link>${xmlEscape(c.link)}</link>${selfLinkTag}
    <description>${xmlEscape(c.description)}</description>${languageTag}${ttlTag}${lastBuildDate}${items}
  </channel>
</rss>
`
}
