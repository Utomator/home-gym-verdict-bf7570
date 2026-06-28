'use server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { notifySlack } from '@/lib/slack'

const Schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().max(100).optional(),
  message: z.string().min(10).max(2000),
})

export type SubmitState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> }
  | Record<string, never>

export async function submitContact(_prev: SubmitState, fd: FormData): Promise<SubmitState> {
  const parsed = Schema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    company: fd.get('company') || undefined,
    message: fd.get('message'),
  })
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors }
  }

  const ua = (await headers()).get('user-agent') ?? undefined

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'submissions',
      overrideAccess: true,
      data: { ...parsed.data, source: 'contact-form', userAgent: ua },
    })
    await notifySlack({
      text: `New contact form submission from ${parsed.data.email}`,
    })
    return { ok: true }
  } catch (err) {
    logger.error({ err }, 'contact submission failed')
    return { ok: false, errors: { _form: ['Could not submit. Please try again.'] } }
  }
}
