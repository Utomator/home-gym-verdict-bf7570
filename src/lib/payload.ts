import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@/payload.config'

let cached: Payload | undefined

export async function getPayloadClient(): Promise<Payload> {
  if (cached) return cached
  cached = await getPayload({ config })
  return cached
}
