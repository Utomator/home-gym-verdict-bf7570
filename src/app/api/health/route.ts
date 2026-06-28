import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    return Response.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'health check failed')
    return Response.json({ ok: false }, { status: 503 })
  }
}
