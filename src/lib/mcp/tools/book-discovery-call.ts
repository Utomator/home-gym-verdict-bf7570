import { z } from 'zod'
import { parseEnv } from '@/lib/env'
import type { ToolDef } from './types'

const Input = z.object({})

type Out = { bookingUrl: string }

export const bookDiscoveryCall: ToolDef<typeof Input, Out> = {
  name: 'book_discovery_call',
  description: 'Return the Calendly discovery-call booking URL.',
  inputSchema: Input,
  handler: async () => {
    const env = parseEnv()
    if (!env.CALENDLY_BOOKING_URL) {
      throw new Error('CALENDLY_BOOKING_URL is not configured')
    }
    return { bookingUrl: env.CALENDLY_BOOKING_URL }
  },
}
