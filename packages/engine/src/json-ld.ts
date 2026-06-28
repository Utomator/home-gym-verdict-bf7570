import type {
  AggregateRating,
  Article,
  BreadcrumbList,
  CollectionPage,
  FAQPage,
  ItemList,
  LocalBusiness,
  Offer,
  Organization,
  Person,
  Product,
  ProfilePage,
  Review,
  Service,
  WebPage,
  WebSite,
} from 'schema-dts'

// schema-dts emits unions like `Organization = OrganizationLeaf | ... | string`
// where the `string` arm represents an IRI reference. Object literals we build
// can never be IRIs, so we exclude `string` to keep property access ergonomic.
type Concrete<T> = Exclude<T, string>
type WithContext<T> = Concrete<T> & { '@context': 'https://schema.org' }

const ctx = <T>(o: Concrete<T>): WithContext<T> =>
  ({
    '@context': 'https://schema.org',
    ...(o as object),
  }) as WithContext<T>

export function organizationSchema(
  baseUrl: string,
  org: {
    name: string
    logoUrl?: string
    sameAs?: string[]
    description?: string
    foundingDate?: string
    contactPoints?: { contactType: string; email?: string; telephone?: string }[]
    founders?: { name: string; url?: string }[]
  },
): WithContext<Organization> {
  return ctx<Organization>({
    '@type': 'Organization',
    // Stable @id so other schema nodes (Article.publisher, Service.provider) can
    // reference this single Organization entity across pages instead of duplicating it.
    '@id': `${baseUrl}#organization`,
    name: org.name,
    url: baseUrl,
    ...(org.logoUrl ? { logo: org.logoUrl } : {}),
    ...(org.founders?.length
      ? {
          founder: org.founders.map((f) => ({
            '@type': 'Person' as const,
            name: f.name,
            ...(f.url ? { url: f.url } : {}),
          })),
        }
      : {}),
    ...(org.sameAs?.length ? { sameAs: org.sameAs } : {}),
    ...(org.description ? { description: org.description } : {}),
    ...(org.foundingDate ? { foundingDate: org.foundingDate } : {}),
    ...(org.contactPoints?.length
      ? {
          contactPoint: org.contactPoints.map((c) => ({
            '@type': 'ContactPoint' as const,
            contactType: c.contactType,
            ...(c.email ? { email: c.email } : {}),
            ...(c.telephone ? { telephone: c.telephone } : {}),
          })),
        }
      : {}),
  })
}

export function websiteSchema(baseUrl: string, siteName: string): WithContext<WebSite> {
  // SearchAction's `query-input` field is custom (not a typed schema-dts property),
  // so we cast the action through `unknown` to satisfy the broader Action union.
  const searchAction = {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  } as unknown as Concrete<WebSite>['potentialAction']
  return ctx<WebSite>({
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: siteName,
    url: baseUrl,
    potentialAction: searchAction,
  })
}

export function articleSchema(
  baseUrl: string,
  a: {
    title: string
    slug: string
    type?: 'BlogPosting' | 'Article'
    pathPrefix?: string
    publishedAt?: string | null
    updatedAt?: string | null
    authorName?: string
    authorUrl?: string
    heroImageUrl?: string
    imageWidth?: number
    imageHeight?: number
    imageCaption?: string
    description?: string
    wordCount?: number
    section?: string
    keywords?: string
    publisher?: { name: string; logoUrl?: string }
  },
): WithContext<Article> {
  const url = `${baseUrl}${a.pathPrefix ?? '/blog'}/${a.slug}`
  return ctx<Article>({
    // BlogPosting is the correct, richer subtype for blog content (Article kept for case studies).
    '@type': (a.type ?? 'BlogPosting') as 'Article',
    headline: a.title,
    url,
    mainEntityOfPage: url,
    ...(a.description ? { description: a.description } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    ...(a.updatedAt ? { dateModified: a.updatedAt } : {}),
    // Rich ImageObject when intrinsic dimensions are known (better Google Images
    // + article eligibility); falls back to a bare URL string otherwise.
    ...(a.heroImageUrl
      ? {
          image:
            a.imageWidth && a.imageHeight
              ? {
                  '@type': 'ImageObject' as const,
                  url: a.heroImageUrl,
                  // schema-dts types width/height as Distance (string), not number.
                  width: String(a.imageWidth),
                  height: String(a.imageHeight),
                  ...(a.imageCaption ? { caption: a.imageCaption } : {}),
                }
              : a.heroImageUrl,
        }
      : {}),
    ...(typeof a.wordCount === 'number' ? { wordCount: a.wordCount } : {}),
    ...(a.section ? { articleSection: a.section } : {}),
    ...(a.keywords ? { keywords: a.keywords } : {}),
    ...(a.publisher
      ? {
          publisher: {
            '@type': 'Organization',
            // Reference the single Organization node by @id (same as Service.provider).
            '@id': `${baseUrl}#organization`,
            name: a.publisher.name,
            ...(a.publisher.logoUrl
              ? { logo: { '@type': 'ImageObject', url: a.publisher.logoUrl } }
              : {}),
          },
        }
      : {}),
    ...(a.authorName
      ? {
          author: {
            '@type': 'Person',
            // Same @id as the /authors/[slug] ProfilePage Person so Google reconciles
            // the byline with the author-profile entity (E-E-A-T author graph).
            ...(a.authorUrl ? { '@id': `${a.authorUrl}#person`, url: a.authorUrl } : {}),
            name: a.authorName,
          },
        }
      : {}),
  })
}

export function faqPageSchema(
  qs: { question: string; answerText: string }[],
): WithContext<FAQPage> {
  if (qs.length === 0) throw new Error('faqPageSchema requires at least one question')
  return ctx<FAQPage>({
    '@type': 'FAQPage',
    mainEntity: qs.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answerText },
    })),
  })
}

export function serviceSchema(
  baseUrl: string,
  s: { title: string; slug: string; summary?: string; providerName: string },
): WithContext<Service> {
  return ctx<Service>({
    '@type': 'Service',
    name: s.title,
    url: `${baseUrl}/services/${s.slug}`,
    ...(s.summary ? { description: s.summary } : {}),
    // Reference the single Organization node by @id rather than duplicating it.
    provider: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: s.providerName,
      url: baseUrl,
    },
  })
}

/**
 * LocalBusiness node — for the lead-gen archetype's "service in a city" pages.
 *
 * Models the business as it serves ONE locality: the page's city/region become
 * the `areaServed`, the business name/phone/url anchor the entity, and the
 * service name doubles as the entity description. Pure data — composes
 * alongside `serviceSchema` (the Service) so a service-area page can emit both
 * the offered Service and the local entity providing it.
 */
export function localBusinessSchema(
  baseUrl: string,
  b: {
    name: string
    url?: string
    telephone?: string
    email?: string
    /** City / locality served, e.g. "Austin". */
    city?: string
    /** State / region, e.g. "TX". */
    region?: string
    /** Street address line, when known. */
    streetAddress?: string
    /** Service / page name, used as the entity description. */
    description?: string
    /** Geo map URL (e.g. a Google Maps place URL) → emitted as `hasMap`. */
    mapUrl?: string
  },
): WithContext<LocalBusiness> {
  const areaServed = [b.city, b.region].filter(Boolean).join(', ')
  return ctx<LocalBusiness>({
    '@type': 'LocalBusiness',
    name: b.name,
    url: b.url ?? baseUrl,
    ...(b.telephone ? { telephone: b.telephone } : {}),
    ...(b.email ? { email: b.email } : {}),
    ...(b.description ? { description: b.description } : {}),
    ...(b.mapUrl ? { hasMap: b.mapUrl } : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(b.city || b.region || b.streetAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(b.streetAddress ? { streetAddress: b.streetAddress } : {}),
            ...(b.city ? { addressLocality: b.city } : {}),
            ...(b.region ? { addressRegion: b.region } : {}),
          },
        }
      : {}),
  })
}

/** ItemList of named links — e.g. an archive's posts or related items. */
export function itemListSchema(items: { name: string; url: string }[]): WithContext<ItemList> {
  return ctx<ItemList>({
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  })
}

// ---------------------------------------------------------------------------
// Affiliate roundup / comparison schema (Product + Review + AggregateRating in an
// ItemList). Powers the high-commercial-intent "best X for Y" / "X vs Y" money
// pages. Pure data builders — composed by the [slug] Pages renderer when a
// `productRoundup` block is present. Respects the engine purity contract (no
// payload/next imports).
// ---------------------------------------------------------------------------

/** A single roundup item, as the Pages `productRoundup` block stores it. */
export type RoundupItem = {
  name: string
  /** Pre-resolved affiliate URL (rel=sponsored on the page) — emitted as Offer.url. */
  affiliateUrl?: string
  imageUrl?: string
  /** 0–5 star rating. Emitted as an AggregateRating when present. */
  rating?: number | null
  /** Display price string, e.g. "$49/mo" or "$129". Emitted as Offer.price. */
  price?: string | null
  pros?: string[]
  cons?: string[]
  /** Short plain-text summary used as Product.description. */
  description?: string
  /** e.g. "Best overall" — emitted as a positiveNotes review when present. */
  badge?: string
}

/**
 * AggregateRating node from a 0–5 rating. `reviewCount` defaults to 1 (the
 * editor's own assessment) so Google has a non-zero count, which it requires for
 * the rating to be eligible. Clamps the value into [0,5].
 */
export function aggregateRatingSchema(
  rating: number,
  opts: { reviewCount?: number; bestRating?: number } = {},
): Concrete<AggregateRating> {
  const best = opts.bestRating ?? 5
  const value = Math.min(Math.max(rating, 0), best)
  return {
    '@type': 'AggregateRating',
    // ratingValue/bestRating/worstRating accept Number|Text → strings serialize cleanly.
    ratingValue: String(value),
    bestRating: String(best),
    worstRating: '0',
    // reviewCount is typed as Integer in schema-dts → keep it numeric.
    reviewCount: Math.max(1, opts.reviewCount ?? 1),
  }
}

/**
 * Editorial Review node carrying the page's verdict (pros as positiveNotes, cons
 * as negativeNotes, badge/blurb as the review body). `author` is the publishing
 * Organization (the site itself reviews the product). Omitted entirely when there
 * is nothing to say.
 */
export function reviewSchema(
  baseUrl: string,
  r: {
    itemName: string
    publisherName: string
    rating?: number | null
    pros?: string[]
    cons?: string[]
    body?: string
  },
): Concrete<Review> | undefined {
  const pros = (r.pros ?? []).filter(Boolean)
  const cons = (r.cons ?? []).filter(Boolean)
  const hasRating = typeof r.rating === 'number'
  if (!pros.length && !cons.length && !r.body && !hasRating) return undefined
  return {
    '@type': 'Review',
    name: `${r.itemName} review`,
    author: { '@type': 'Organization', '@id': `${baseUrl}#organization`, name: r.publisherName },
    ...(r.body ? { reviewBody: r.body } : {}),
    ...(hasRating
      ? {
          reviewRating: {
            '@type': 'Rating',
            ratingValue: String(Math.min(Math.max(r.rating as number, 0), 5)),
            bestRating: '5',
            worstRating: '0',
          },
        }
      : {}),
    // ItemList of pro/con bullets — `positiveNotes`/`negativeNotes` are the schema.org
    // way to express pros & cons that Google's pros-and-cons rich result reads.
    ...(pros.length
      ? {
          positiveNotes: {
            '@type': 'ItemList',
            itemListElement: pros.map((p, i) => ({
              '@type': 'ListItem' as const,
              position: i + 1,
              name: p,
            })),
          },
        }
      : {}),
    ...(cons.length
      ? {
          negativeNotes: {
            '@type': 'ItemList',
            itemListElement: cons.map((c, i) => ({
              '@type': 'ListItem' as const,
              position: i + 1,
              name: c,
            })),
          },
        }
      : {}),
  } as Concrete<Review>
}

/**
 * Product node for one roundup item: name + image + an Offer (affiliate URL +
 * price) + the AggregateRating + the editorial Review. Built defensively so a
 * sparse item (just a name) still yields a valid Product with no missing-required
 * fields or empty/`undefined` properties.
 */
export function productSchema(
  baseUrl: string,
  item: RoundupItem,
  publisherName: string,
): Concrete<Product> {
  const hasRating = typeof item.rating === 'number'
  const review = reviewSchema(baseUrl, {
    itemName: item.name,
    publisherName,
    rating: item.rating,
    pros: item.pros,
    cons: item.cons,
    body: item.badge ?? item.description,
  })
  // An Offer is only valid with a price; emit one only when we have a price string.
  const offer: Concrete<Offer> | undefined = item.price
    ? {
        '@type': 'Offer',
        price: String(item.price),
        ...(item.affiliateUrl ? { url: item.affiliateUrl } : {}),
        availability: 'https://schema.org/InStock',
      }
    : undefined
  return {
    '@type': 'Product',
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
    ...(item.imageUrl ? { image: item.imageUrl } : {}),
    ...(item.affiliateUrl ? { url: item.affiliateUrl } : {}),
    ...(hasRating ? { aggregateRating: aggregateRatingSchema(item.rating as number) } : {}),
    ...(review ? { review } : {}),
    ...(offer ? { offers: offer } : {}),
  } as Concrete<Product>
}

/**
 * ItemList of Product entries — the JSON-LD for an affiliate roundup / comparison
 * page. Each `itemListElement` is a positional `ListItem` wrapping the Product,
 * which is the shape Google reads for "best of" carousels. Skips items with no
 * name so the list never carries an invalid (nameless) Product.
 */
export function productRoundupSchema(
  baseUrl: string,
  r: { name: string; items: RoundupItem[]; publisherName: string; url?: string },
): WithContext<ItemList> {
  const products = r.items.filter((it) => it.name?.trim())
  return ctx<ItemList>({
    '@type': 'ItemList',
    name: r.name,
    ...(r.url ? { url: r.url } : {}),
    numberOfItems: products.length,
    itemListElement: products.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      item: productSchema(baseUrl, item, r.publisherName),
    })),
  })
}

/** CollectionPage wrapping an ItemList — for blog/archive/taxonomy/search list pages. */
export function collectionPageSchema(
  baseUrl: string,
  p: { name: string; url: string; description?: string; items: { name: string; url: string }[] },
): WithContext<CollectionPage> {
  return ctx<CollectionPage>({
    '@type': 'CollectionPage',
    name: p.name,
    url: p.url,
    ...(p.description ? { description: p.description } : {}),
    isPartOf: { '@id': `${baseUrl}#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: p.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: it.url,
      })),
    },
  })
}

/** Generic WebPage node (e.g. the homepage), anchored to the WebSite + Organization. */
export function webPageSchema(
  baseUrl: string,
  p: { name: string; url: string; description?: string },
): WithContext<WebPage> {
  return ctx<WebPage>({
    '@type': 'WebPage',
    name: p.name,
    url: p.url,
    ...(p.description ? { description: p.description } : {}),
    isPartOf: { '@id': `${baseUrl}#website` },
    about: { '@id': `${baseUrl}#organization` },
  })
}

type BreadcrumbListItem = {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}
type BreadcrumbListSchema = WithContext<BreadcrumbList> & {
  itemListElement: BreadcrumbListItem[]
}

export function breadcrumbList(items: { name: string; url: string }[]): BreadcrumbListSchema {
  return ctx<BreadcrumbList>({
    '@type': 'BreadcrumbList',
    itemListElement: items.map(
      (i, n): BreadcrumbListItem => ({
        '@type': 'ListItem',
        position: n + 1,
        name: i.name,
        item: i.url,
      }),
    ),
  }) as BreadcrumbListSchema
}

export function personSchema(
  baseUrl: string,
  p: {
    name: string
    slug: string
    bio?: string
    sameAs?: string[]
    imageUrl?: string
    jobTitle?: string
    knowsAbout?: string[]
    credentials?: string[]
  },
): WithContext<Person> {
  const url = `${baseUrl}/authors/${p.slug}`
  return ctx<Person>({
    '@type': 'Person',
    '@id': `${url}#person`,
    name: p.name,
    url,
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
    ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
    ...(p.bio ? { description: p.bio } : {}),
    ...(p.knowsAbout?.length ? { knowsAbout: p.knowsAbout } : {}),
    ...(p.credentials?.length
      ? {
          hasCredential: p.credentials.map((c) => ({
            '@type': 'EducationalOccupationalCredential' as const,
            name: c,
          })),
        }
      : {}),
    ...(p.sameAs?.length ? { sameAs: p.sameAs } : {}),
  })
}

export function profilePageSchema(person: WithContext<Person>): WithContext<ProfilePage> {
  return ctx<ProfilePage>({
    '@type': 'ProfilePage',
    mainEntity: person,
  })
}

// Plain-text extraction for FAQ answers (Lexical → plain text). Used when emitting
// FAQPage JSON-LD from rich answers. The full Lexical → markdown serializer lands
// in Phase F; this lightweight helper covers what JSON-LD needs.
export function lexicalToPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[]; root?: unknown }
  if (typeof n.text === 'string') return n.text
  if (n.root) return lexicalToPlainText(n.root)
  return (n.children ?? []).map(lexicalToPlainText).join(' ').replace(/\s+/g, ' ').trim()
}
