import { env } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { getMdMirrorContentTypes } from '@/lib/registry/content-registry'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const e = env()
  const payload = await getPayloadClient()
  const link = (anchor: string) => ({
    anchor: `${e.NEXT_PUBLIC_SERVER_URL}${anchor}`,
    'service-desc': [
      {
        href: `${e.NEXT_PUBLIC_SERVER_URL}/api/openapi.json`,
        type: 'application/openapi+json',
      },
    ],
    'service-doc': [
      {
        href: `${e.NEXT_PUBLIC_SERVER_URL}/api/openapi.json`,
        type: 'application/openapi+json',
      },
    ],
    status: [
      {
        href: `${e.NEXT_PUBLIC_SERVER_URL}/api/health`,
        type: 'application/json',
      },
    ],
  })
  // Advertise the Payload REST endpoint (`/api/<collection-slug>`) for each
  // active document-content collection. We use the md-mirror types produced via
  // `serialize` — the real document-body collections (blog-posts, pages) — and
  // exclude the bespoke author/profile type (people, via 'profile'), which has
  // no document body to query here. A landing app mounting only Pages advertises
  // just `/api/pages`; no collection list is hardcoded.
  const contentEndpoints = getMdMirrorContentTypes(payload).filter(
    (t) => t.mdMirror.via === 'serialize',
  )
  const body = {
    linkset: contentEndpoints.map((t) => link(`/api/${t.collection}`)),
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'content-type': 'application/linkset+json; charset=utf-8' },
  })
}
