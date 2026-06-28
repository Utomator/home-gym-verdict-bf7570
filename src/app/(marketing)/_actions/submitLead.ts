'use server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getPayloadClient } from '@/lib/payload'
import { notifySlack } from '@/lib/slack'
import siteConfig from '@/site.config'

/**
 * Lead-funnel submit action.
 *
 * Mirrors the existing contact submit action (validate → store → notify) but
 * for the landing LeadForm fields (name / email / phone / message). On success
 * it:
 *   (a) STORES the lead in the `submissions` collection (source: 'lead-form');
 *   (b) fires the existing Slack notification (no-ops when unconfigured);
 *   (c) attempts an auto-respond EMAIL via `sendLeadAutoRespond`, which is a
 *       fully-structured handler that GUARD-NO-OPS until an email adapter is
 *       configured on the Payload instance (see TODO below).
 *
 * Storage + Slack always run; email is best-effort and never fails the submit.
 */

const LeadSchema = z.object({
  name: z.string().min(1, 'Please enter your name').max(100),
  email: z.string().email('Enter a valid email'),
  phone: z.string().max(40).optional(),
  message: z.string().min(10, 'Tell us a little more (10+ characters)').max(2000),
})

export type LeadField = 'name' | 'email' | 'phone' | 'message' | 'form'
export type LeadSubmitState =
  | { ok: true }
  | { ok: false; errors: Partial<Record<LeadField, string>> }
  | Record<string, never>

/**
 * Auto-respond email handler.
 *
 * GATED: payload.config.ts has NO `email` key, so Payload falls back to its
 * built-in `console` adapter (name === 'console'), which only logs "Email
 * attempted without being configured" instead of sending. This handler treats
 * that fallback as "no adapter" and NO-OPS — the submit still succeeds.
 *
 * TODO(email): wire a real adapter (e.g. @payloadcms/email-nodemailer or
 * @payloadcms/email-resend) into `email` in payload.config.ts. Once its adapter
 * `name` is anything other than 'console', this handler starts sending with no
 * further change here.
 */
async function sendLeadAutoRespond(lead: {
  name: string
  email: string
}): Promise<{ sent: boolean; reason?: string }> {
  const payload = await getPayloadClient()

  // Capability guard: a real adapter exposes a non-'console' name. Payload's
  // default console fallback is treated as unconfigured.
  const adapterName = (payload as { email?: { name?: string } }).email?.name
  const hasRealAdapter = typeof adapterName === 'string' && adapterName !== 'console'
  if (!hasRealAdapter) {
    logger.debug(
      { to: lead.email, adapter: adapterName ?? null },
      'lead auto-respond skipped: no email adapter configured',
    )
    return { sent: false, reason: 'no-adapter' }
  }

  const businessName = siteConfig.business.name
  try {
    await payload.sendEmail({
      to: lead.email,
      subject: `Thanks for reaching out to ${businessName}`,
      text:
        `Hi ${lead.name},\n\n` +
        `Thanks for getting in touch with ${businessName}. ` +
        `We've received your message and will reply within one business day.\n\n` +
        `— The ${businessName} team`,
    })
    return { sent: true }
  } catch (err) {
    // Adapter present but send failed — log and continue (never fail the lead).
    logger.warn({ err }, 'lead auto-respond email failed')
    return { sent: false, reason: 'send-failed' }
  }
}

export async function submitLead(
  _prev: LeadSubmitState,
  fd: FormData,
): Promise<LeadSubmitState> {
  const parsed = LeadSchema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone') || undefined,
    message: fd.get('message'),
  })
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors
    const errors: Partial<Record<LeadField, string>> = {}
    for (const key of ['name', 'email', 'phone', 'message'] as const) {
      const msg = flat[key]?.[0]
      if (msg) errors[key] = msg
    }
    return { ok: false, errors }
  }

  const ua = (await headers()).get('user-agent') ?? undefined

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'submissions',
      overrideAccess: true,
      // The phone is folded into the stored message so it lands in the existing
      // Submissions schema without a migration.
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.phone
          ? `${parsed.data.message}\n\nPhone: ${parsed.data.phone}`
          : parsed.data.message,
        source: 'lead-form',
        userAgent: ua,
      },
    })

    await notifySlack({ text: `New lead from ${parsed.data.email}` })

    // Best-effort auto-respond; gated until an email adapter is configured.
    await sendLeadAutoRespond({ name: parsed.data.name, email: parsed.data.email })

    return { ok: true }
  } catch (err) {
    logger.error({ err }, 'lead submission failed')
    return { ok: false, errors: { form: 'Could not submit. Please try again.' } }
  }
}
