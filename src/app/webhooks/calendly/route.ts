import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { verifyCalendlyHmac } from '@/lib/webhooks/calendly-hmac'

export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  const e = env()
  if (!e.CALENDLY_WEBHOOK_SECRET) {
    return new Response('Not configured', { status: 503 })
  }

  const header = req.headers.get('calendly-webhook-signature')
  const body = await req.text()
  if (!header || !verifyCalendlyHmac({ secret: e.CALENDLY_WEBHOOK_SECRET, header, body })) {
    return new Response('Bad signature', { status: 401 })
  }

  let parsed: { event?: string; payload?: { invitee?: { email?: string } } }
  try {
    parsed = JSON.parse(body)
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'webhook-events',
    overrideAccess: true,
    data: {
      source: 'calendly',
      eventType: parsed.event ?? 'unknown',
      payload: parsed,
      processedAt: new Date().toISOString(),
    },
  })

  // Best-effort: link to a Submissions row by email
  const email = parsed.payload?.invitee?.email
  if (email) {
    const { docs } = await payload.find({
      collection: 'submissions',
      where: { email: { equals: email } },
      limit: 1,
      sort: '-createdAt',
      depth: 0,
    })
    if (docs[0]) {
      logger.info({ submissionId: docs[0].id, email }, 'calendly→submission match')
    }
  }

  return Response.json({ ok: true })
}
