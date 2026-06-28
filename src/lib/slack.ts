import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export async function notifySlack(payload: { text: string; blocks?: unknown[] }): Promise<void> {
  const e = env()
  if (!e.SLACK_WEBHOOK_URL) {
    logger.debug({ payload }, 'slack webhook not configured; skipping')
    return
  }
  try {
    const r = await fetch(e.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) logger.warn({ status: r.status }, 'slack webhook non-200')
  } catch (err) {
    logger.warn({ err }, 'slack webhook failed')
  }
}
