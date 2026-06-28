import { renderContentSignal } from '@p51/engine'
import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const ALLOW_AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-Web',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
]
const DENY_BOTS = ['CCBot']

export async function GET(): Promise<Response> {
  const e = env()

  if (!e.SITE_INDEXABLE) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const policy = settings.contentSignals ?? { aiTrain: 'no', search: 'yes', aiInput: 'yes' }

  const lines: string[] = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    // Keep the OpenAPI descriptor crawlable even though /api/ is otherwise blocked.
    'Allow: /api/openapi.json',
    'Disallow: /api/',
    '',
    ...ALLOW_AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    ...DENY_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Disallow: /', '']),
    `Sitemap: ${e.NEXT_PUBLIC_SERVER_URL}/sitemap.xml`,
    // LLM index: structured discovery file for AI crawlers and agents.
    `# LLM index: ${e.NEXT_PUBLIC_SERVER_URL}/llms.txt`,
    `Allow: /llms.txt`,
    '',
    renderContentSignal({
      aiTrain: policy.aiTrain as 'yes' | 'no',
      search: policy.search as 'yes' | 'no',
      aiInput: policy.aiInput as 'yes' | 'no',
    }),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
