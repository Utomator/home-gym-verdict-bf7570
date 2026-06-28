'use client'

import { useActionState } from 'react'
import { type LeadSubmitState, submitLead } from '@/app/(marketing)/_actions/submitLead'
import { waMeLink } from '@/lib/whatsapp'
import { LeadForm, type LeadFormStatus } from './LeadForm'
import { MessageCircle } from './_icons'

/**
 * LeadFormSection — the CLIENT wiring around the presentational <LeadForm>.
 *
 * - Drives idle / submitting / success / error state via `useActionState` over
 *   the `submitLead` server action (validate → store in Submissions → Slack →
 *   gated auto-respond email). The `isPending` flag from useActionState gives us
 *   the submitting state directly, so no nested <form> / useFormStatus is needed
 *   — the action is handed straight to LeadForm's own `action` prop.
 * - Renders a WhatsApp click-to-chat button below the form when a number is
 *   supplied (pure frontend wa.me link — works today, no backend).
 */

const initial: LeadSubmitState = {}

type Props = {
  eyebrow?: string
  heading?: string
  description?: string
  submitLabel?: string
  /** WhatsApp number (international format). Renders the chat CTA when present. */
  whatsapp?: string
  /** Prefilled WhatsApp message. */
  whatsappText?: string
  footnote?: string
}

export function LeadFormSection({
  eyebrow,
  heading,
  description,
  submitLabel,
  whatsapp,
  whatsappText,
  footnote,
}: Props) {
  const [state, action, isPending] = useActionState(submitLead, initial)

  let status: LeadFormStatus = 'idle'
  if (isPending) status = 'submitting'
  else if ('ok' in state && state.ok) status = 'success'
  else if ('ok' in state && !state.ok) status = 'error'

  const errs = 'errors' in state ? state.errors : {}
  const success = status === 'success'
  const wa = waMeLink(whatsapp, whatsappText)

  return (
    <div>
      <LeadForm
        eyebrow={eyebrow}
        heading={heading}
        description={description}
        submitLabel={submitLabel}
        action={action}
        status={status}
        errors={errs}
        footnote={footnote}
      />

      {wa && !success ? (
        <div className="-mt-12 pb-20 sm:pb-24">
          <div className="mx-auto w-full max-w-3xl px-6 sm:px-8 lg:px-10">
            <div className="flex flex-col items-start gap-3 rounded-[var(--radius-lg,0.75rem)] border border-[var(--color-border,#e4e4e7)] bg-[var(--color-surface-2,#f4f4f5)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-fg-muted,#71717a)]">
                Prefer to chat now? Message us on WhatsApp for a fast reply.
              </p>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[var(--radius-pill,9999px)] bg-[var(--color-brand,#18181b)] px-5 py-2.5 text-sm font-medium text-[var(--color-brand-fg,#ffffff)] no-underline transition-colors hover:bg-[var(--color-brand-hover,#27272a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand,#18181b)] focus-visible:ring-offset-2"
              >
                <MessageCircle className="size-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
