import { env } from '@/lib/env'
import { MD_HEADERS } from '@/lib/markdown/lookups'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const e = env()
  return new Response(
    `---\ntitle: "Contact"\ncanonicalUrl: "${e.NEXT_PUBLIC_SERVER_URL}/contact"\n---\n\n# Contact\n\nUse the form at /contact.\n`,
    { headers: MD_HEADERS },
  )
}
