// @ts-nocheck
import { getPayload } from 'payload'
import config from '../src/payload.config'

// --- Lexical builders (Payload v3 editor state) ---
const txt = (text: string, format = 0) => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})
const para = (children: unknown[]) => ({
  type: 'paragraph',
  children,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
})
const h2 = (text: string) => ({
  type: 'heading',
  tag: 'h2',
  children: [txt(text)],
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})
const link = (text: string, url: string, linkRel: string) => ({
  type: 'link',
  fields: { linkType: 'custom', url, newTab: true, linkRel },
  children: [txt(text)],
  format: '',
  indent: 0,
  version: 3,
  direction: 'ltr',
})
const doc = (children: unknown[]) => ({
  root: { type: 'root', children, format: '', indent: 0, version: 1, direction: 'ltr' },
})
const richPara = (s: string) => doc([para([txt(s)])])

// payload run awaits the module's TOP-LEVEL evaluation then exits, so all work
// must be top-level await (a fire-and-forget async fn would be killed mid-flight).
const payload = await getPayload({ config })

const jane = await payload.create({
    collection: 'people',
    data: {
      name: 'Dr. Jane Rivera',
      slug: 'jane-rivera',
      role: 'Principal SEO Engineer',
      bio: doc([
        para([
          txt(
            'Jane leads technical SEO and answer-engine research at Project51 Labs, focused on structured data and AI-citable content.',
          ),
        ]),
      ]),
      socials: [
        { platform: 'twitter', url: 'https://twitter.com/janerivera' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/janerivera' },
      ],
      expertise: [
        { value: 'Technical SEO' },
        { value: 'Structured Data' },
        { value: 'Answer Engine Optimization' },
      ],
      credentials: [{ value: 'PhD, Computer Science' }, { value: 'Google Analytics Certified' }],
      _status: 'published',
    },
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      organization: {
        name: 'Project51 Labs',
        tagline: 'Engineering content that ranks and gets cited.',
        foundingDate: '2021-03-01T00:00:00.000Z',
        sameAs: [
          { url: 'https://twitter.com/project51labs' },
          { url: 'https://www.linkedin.com/company/project51labs' },
        ],
        contactPoints: [{ contactType: 'customer support', email: 'hello@project51.example' }],
        founders: [jane.id],
      },
      contentSignals: { aiTrain: 'no', search: 'yes', aiInput: 'yes' },
      defaultMeta: {
        title: 'Project51 Labs',
        description: 'Engineering content that ranks and gets cited.',
      },
    },
  })

  const faq = [
    {
      question: 'How much can a smart thermostat save?',
      answer: richPara('Independent studies report 8–15% savings on heating and cooling.'),
    },
    {
      question: 'Do smart thermostats work without Wi-Fi?',
      answer: richPara('Most run scheduled setbacks locally; remote control needs Wi-Fi.'),
    },
  ]

  const posts = [
    {
      title: 'How Smart Thermostats Cut Heating Bills',
      slug: 'smart-thermostats-cut-heating-bills',
      excerpt: 'A programmable thermostat automates setbacks and can cut heating costs notably.',
      categories: [{ value: 'Home Energy' }],
      tags: [{ value: 'thermostats' }, { value: 'savings' }],
      answerSummary:
        'A smart thermostat cuts heating bills by automatically lowering the temperature when you are asleep or away — typically saving 8–15% on heating and cooling each year.',
      body: doc([
        h2('Why your thermostat is the biggest lever'),
        para([
          txt('A programmable thermostat automates setbacks. The '),
          link('U.S. Department of Energy', 'https://www.energy.gov/energysaver/thermostats', 'follow'),
          txt(' estimates up to 10% annual savings from scheduled setbacks.'),
        ]),
        h2('Our top pick'),
        para([
          txt('After testing, we recommend this model: '),
          link('see current price on Amazon', 'https://www.amazon.com/dp/B07XYZ123', 'sponsored'),
          txt('. It paid for itself within one season.'),
        ]),
      ]),
    },
    {
      title: 'Smart Thermostat Brands Compared',
      slug: 'smart-thermostat-brands-compared',
      excerpt: 'A side-by-side comparison of the leading smart thermostat brands.',
      categories: [{ value: 'Home Energy' }],
      tags: [{ value: 'thermostats' }, { value: 'comparison' }],
      answerSummary:
        'The best smart thermostat for most homes balances scheduling, geofencing, and HVAC compatibility; premium models add room sensors and energy reports.',
      body: doc([
        h2('How we compared'),
        para([txt('We scored each brand on scheduling, sensors, and compatibility.')]),
        h2('Where to buy'),
        para([
          txt('Our pick is available here: '),
          link('check the deal', 'https://www.amazon.com/dp/B08ABC456', 'sponsored'),
          txt('.'),
        ]),
      ]),
    },
    {
      title: 'A Practical Guide to Structured Data',
      slug: 'practical-guide-structured-data',
      excerpt: 'How JSON-LD structured data helps search engines and AI answer engines.',
      categories: [{ value: 'Technical SEO' }],
      tags: [{ value: 'schema' }, { value: 'json-ld' }],
      answerSummary:
        'Structured data is JSON-LD markup that describes your page to search engines and AI answer engines, making it eligible for rich results and easier to cite.',
      body: doc([
        h2('What is structured data'),
        para([
          txt('JSON-LD describes entities on a page. See the '),
          link('Schema.org docs', 'https://schema.org/docs/gs.html', 'follow'),
          txt(' for the vocabulary.'),
        ]),
        h2('Why it matters for AI'),
        para([txt('Answer engines reconcile entities faster when markup is explicit.')]),
      ]),
    },
  ]

  for (const p of posts) {
    await payload.create({
      collection: 'blog-posts',
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        author: jane.id,
        publishedAt: '2026-06-01T09:00:00.000Z',
        categories: p.categories,
        tags: p.tags,
        body: p.body,
        aeo: {
          answerSummary: p.answerSummary,
          keyTakeaways: [
            { point: 'Automating setbacks is the largest single saving lever.' },
            { point: 'Geofencing avoids heating an empty home.' },
            { point: 'Check HVAC compatibility before buying.' },
          ],
          faq,
          lastReviewedAt: '2026-06-15T00:00:00.000Z',
        },
        _status: 'published',
      },
    })
  }

  await payload.create({
    collection: 'pages',
    data: {
      title: 'About Project51 Labs',
      slug: 'about',
      body: [
        {
          blockType: 'richText',
          content: richPara(
            'Project51 Labs builds content systems engineered to rank in search and to be cited by AI answer engines.',
          ),
        },
        {
          blockType: 'cta',
          heading: 'Ready to rank and get cited?',
          subheading: 'Book a technical SEO audit.',
          buttonLabel: 'Get in touch',
          buttonHref: '/contact',
        },
      ],
      aeo: {
        answerSummary:
          'Project51 Labs is a content-engineering studio that builds sites optimized to rank in search engines and to be cited by AI answer engines.',
        keyTakeaways: [{ point: 'Content engineered for search + AI citation' }],
        faq: [],
        lastReviewedAt: '2026-06-08T00:00:00.000Z',
      },
      _status: 'published',
    },
  })

  const counts = {
    people: (await payload.count({ collection: 'people' })).totalDocs,
    blogPosts: (await payload.count({ collection: 'blog-posts' })).totalDocs,
    pages: (await payload.count({ collection: 'pages' })).totalDocs,
  }
  console.log('SEED_DONE', JSON.stringify(counts))
process.exit(0)
