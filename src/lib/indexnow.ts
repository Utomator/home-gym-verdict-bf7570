import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export async function pingIndexNow(urls: string[]): Promise<void> {
  const e = env()
  if (!e.INDEXNOW_KEY || !e.SITE_INDEXABLE) return
  if (urls.length === 0) return
  const host = new URL(e.NEXT_PUBLIC_SERVER_URL).host
  const keyLocation = `${e.NEXT_PUBLIC_SERVER_URL}/.well-known/indexnow/${e.INDEXNOW_KEY}.txt`

  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        host,
        key: e.INDEXNOW_KEY,
        keyLocation,
        urlList: urls,
      }),
    })
    logger.info({ status: r.status, urls: urls.length }, 'indexnow ping')
  } catch (err) {
    logger.warn({ err }, 'indexnow ping failed')
  }
}
