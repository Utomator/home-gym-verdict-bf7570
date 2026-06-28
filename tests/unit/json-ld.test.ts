import {
  articleSchema,
  breadcrumbList,
  collectionPageSchema,
  faqPageSchema,
  itemListSchema,
  localBusinessSchema,
  organizationSchema,
  personSchema,
  serviceSchema,
  webPageSchema,
  websiteSchema,
} from '@p51/engine'
import { describe, expect, it } from 'vitest'

const baseUrl = 'https://example.com'

describe('json-ld generators', () => {
  it('organizationSchema produces valid Organization', () => {
    const o = organizationSchema(baseUrl, {
      name: 'Project51',
      logoUrl: 'https://example.com/logo.png',
      sameAs: ['https://x.com/p51'],
    })
    expect(o['@type']).toBe('Organization')
    expect(o.name).toBe('Project51')
    expect(o.url).toBe(baseUrl)
    expect(o.sameAs).toEqual(['https://x.com/p51'])
  })

  it('websiteSchema emits a valid SearchAction backed by the real /search route', () => {
    const w = websiteSchema(baseUrl, 'Project51')
    expect(w['@type']).toBe('WebSite')
    // The action must be a well-formed SearchAction (EntryPoint + query-input), not
    // just a string match — the /search page reads ?q= so this resolves, not 404s.
    const action = w.potentialAction as unknown as {
      '@type': string
      target: { '@type': string; urlTemplate: string }
      'query-input': string
    }
    expect(action['@type']).toBe('SearchAction')
    expect(action.target['@type']).toBe('EntryPoint')
    expect(action.target.urlTemplate).toBe(`${baseUrl}/search?q={search_term_string}`)
    expect(action['query-input']).toBe('required name=search_term_string')
  })

  it('articleSchema includes datePublished and author', () => {
    const a = articleSchema(baseUrl, {
      title: 't',
      slug: 'p',
      publishedAt: '2026-01-01',
      updatedAt: '2026-01-02',
      authorName: 'Jane',
      authorUrl: `${baseUrl}/people/jane`,
      heroImageUrl: `${baseUrl}/img.jpg`,
      description: 'd',
    })
    expect(a['@type']).toBe('BlogPosting')
    expect(a.mainEntityOfPage).toBe(`${baseUrl}/blog/p`)
    expect(a.datePublished).toBe('2026-01-01')
    expect(a.dateModified).toBe('2026-01-02')
    expect(a.author).toMatchObject({ '@type': 'Person', name: 'Jane' })
  })

  it('faqPageSchema rejects empty questions array', () => {
    expect(() => faqPageSchema([])).toThrow()
  })

  it('faqPageSchema renders questions and answers', () => {
    const f = faqPageSchema([{ question: 'q?', answerText: 'a.' }])
    expect(f['@type']).toBe('FAQPage')
    expect(f.mainEntity).toHaveLength(1)
  })

  it('serviceSchema includes provider', () => {
    const s = serviceSchema(baseUrl, {
      title: 'Consulting',
      slug: 'consulting',
      summary: 'help',
      providerName: 'Project51',
    })
    expect(s['@type']).toBe('Service')
    expect(s.provider).toMatchObject({ '@type': 'Organization', name: 'Project51' })
  })

  it('breadcrumbList builds positional list', () => {
    const b = breadcrumbList([
      { name: 'Home', url: baseUrl },
      { name: 'Blog', url: `${baseUrl}/blog` },
      { name: 'Post', url: `${baseUrl}/blog/p` },
    ])
    expect(b['@type']).toBe('BreadcrumbList')
    expect(b.itemListElement).toHaveLength(3)
    expect(b.itemListElement[0]).toMatchObject({ position: 1 })
  })

  it('organization + website + service share a stable @id graph', () => {
    const orgId = `${baseUrl}#organization`
    const o = organizationSchema(baseUrl, { name: 'P51' })
    expect(o['@id']).toBe(orgId)
    const w = websiteSchema(baseUrl, 'P51')
    expect(w['@id']).toBe(`${baseUrl}#website`)
    const s = serviceSchema(baseUrl, { title: 'C', slug: 'c', providerName: 'P51' })
    // provider references the org node by @id (not a duplicated inline org)
    expect(s.provider).toMatchObject({ '@id': orgId })
  })

  it('article author @id matches the ProfilePage Person @id for the same author', () => {
    const authorUrl = `${baseUrl}/authors/jane`
    const a = articleSchema(baseUrl, { title: 't', slug: 'p', authorName: 'Jane', authorUrl })
    const p = personSchema(baseUrl, { name: 'Jane', slug: 'jane' })
    // The byline Person and the profile Person must be the SAME entity node.
    expect((a.author as { '@id'?: string })['@id']).toBe(`${authorUrl}#person`)
    expect(p['@id']).toBe(`${authorUrl}#person`)
  })

  it('personSchema emits enriched E-E-A-T fields', () => {
    const p = personSchema(baseUrl, {
      name: 'Jane',
      slug: 'jane',
      jobTitle: 'Engineer',
      knowsAbout: ['SEO', 'AI'],
      credentials: ['PhD'],
    })
    expect(p.jobTitle).toBe('Engineer')
    expect(p.knowsAbout).toEqual(['SEO', 'AI'])
    expect(p.hasCredential).toMatchObject([{ '@type': 'EducationalOccupationalCredential' }])
  })

  it('itemList / collectionPage / webPage builders produce valid nodes', () => {
    const items = [
      { name: 'A', url: `${baseUrl}/blog/a` },
      { name: 'B', url: `${baseUrl}/blog/b` },
    ]
    const list = itemListSchema(items)
    expect(list['@type']).toBe('ItemList')
    // schema-dts types itemListElement as a broad union → cast through unknown to index.
    const listEls = list.itemListElement as unknown as Array<{ position: number; url: string }>
    expect(listEls).toHaveLength(2)
    expect(listEls[0]).toMatchObject({ position: 1, url: `${baseUrl}/blog/a` })

    const cp = collectionPageSchema(baseUrl, { name: 'Blog', url: `${baseUrl}/blog`, items })
    expect(cp['@type']).toBe('CollectionPage')
    expect(cp.isPartOf).toMatchObject({ '@id': `${baseUrl}#website` })
    const cpMain = cp.mainEntity as unknown as { itemListElement: unknown[] }
    expect(cpMain.itemListElement).toHaveLength(2)

    const wp = webPageSchema(baseUrl, { name: 'Home', url: baseUrl })
    expect(wp['@type']).toBe('WebPage')
    expect(wp.about).toMatchObject({ '@id': `${baseUrl}#organization` })
  })

  it('localBusinessSchema models a service-in-a-city entity', () => {
    const lb = localBusinessSchema(baseUrl, {
      name: 'Lone Star Plumbing',
      url: baseUrl,
      telephone: '+1 (555) 014-9920',
      email: 'hello@lonestar.example',
      city: 'Austin',
      region: 'TX',
      description: 'Emergency Plumbing in Austin',
      mapUrl: 'https://maps.example/austin',
    })
    expect(lb['@type']).toBe('LocalBusiness')
    expect(lb.name).toBe('Lone Star Plumbing')
    expect(lb.areaServed).toBe('Austin, TX')
    expect(lb.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'Austin',
      addressRegion: 'TX',
    })
    expect(lb.hasMap).toBe('https://maps.example/austin')
  })

  it('localBusinessSchema omits address when no locality fields are given', () => {
    const lb = localBusinessSchema(baseUrl, { name: 'Solo Co' })
    expect(lb.address).toBeUndefined()
    expect(lb.areaServed).toBeUndefined()
    expect(lb.url).toBe(baseUrl)
  })
})
