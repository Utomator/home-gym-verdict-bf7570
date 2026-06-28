import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const orgName = settings.organization?.name ?? 'My Website'
  const body = {
    openapi: '3.1.0',
    info: { title: `${orgName} Public API`, version: '0.1.0' },
    servers: [{ url: e.NEXT_PUBLIC_SERVER_URL }],
    paths: {
      '/api/blog-posts': {
        get: {
          summary: 'List published blog posts',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/pages': {
        get: {
          summary: 'List published pages',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/api/health': {
        get: {
          summary: 'Liveness/readiness',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/openapi+json; charset=utf-8' },
  })
}
