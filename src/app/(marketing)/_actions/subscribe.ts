'use server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { notifySlack } from '@/lib/slack'

/**
 * Newsletter / email-capture submit action.
 *
 * REUSES the existing Submissions write path (validate → store → notify),
 * exactly like submitContact / submitLead, but for a SINGLE email field. It
 * tags the row with a `source` so newsletter sign-ups are distinguishable from
 * contact/lead submissions in the admin.
 *
 * The Submissions collection requires `name` and `message`; an email-only
 * capture has neither, so we synthesise sensible placeholders ("Newsletter
 * subscriber" / a short note) to satisfy the schema WITHOUT a migration —
 * mirroring how submitLead folds phone into `message`.
 *
 * Anti-spam: a honeypot field (`company_url`) that real users never see. When
 * it is filled we return success but write nothing (don't tip off the bot).
 *
 * The write happens at REQUEST time via the Payload Local API (overrideAccess),
 * so no build-time DB read is introduced.
 */

// Allowlist of source tags a placement may request. Anything else falls back to
// the default — so a crafted `source` can't be persisted verbatim.
const SOURCE_TAGS = new Set([
  'newsletter',
  'blog-inline',
  'blog-footer',
  'sticky-cta',
  'exit-intent',
  'page-section',
])
const DEFAULT_SOURCE = 'newsletter'

const Schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export type SubscribeState =
  | { ok: true }
  | { ok: false; errors: { email?: string; _form?: string } }
  | Record<string, never>

function resolveSource(raw: FormDataEntryValue | null): string {
  return typeof raw === 'string' && SOURCE_TAGS.has(raw) ? raw : DEFAULT_SOURCE
}

export async function submitSubscribe(
  _prev: SubscribeState,
  fd: FormData,
): Promise<SubscribeState> {
  // Honeypot: a hidden field bots tend to autofill. Pretend success, persist
  // nothing. Real users leave it empty.
  const honeypot = fd.get('company_url')
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { ok: true }
  }

  const parsed = Schema.safeParse({ email: fd.get('email') })
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.email?.[0] ?? 'Enter a valid email address'
    return { ok: false, errors: { email: msg } }
  }

  const source = resolveSource(fd.get('source'))
  const ua = (await headers()).get('user-agent') ?? undefined

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'submissions',
      overrideAccess: true,
      // Submissions requires name + message; synthesise placeholders so an
      // email-only capture fits the existing schema (no migration).
      data: {
        name: 'Newsletter subscriber',
        email: parsed.data.email,
        message: `Newsletter signup (source: ${source}).`,
        source,
        userAgent: ua,
      },
    })
    await notifySlack({ text: `New ${source} subscriber: ${parsed.data.email}` })
    return { ok: true }
  } catch (err) {
    logger.error({ err }, 'newsletter subscription failed')
    return { ok: false, errors: { _form: 'Could not subscribe. Please try again.' } }
  }
}
