import type { ReactNode } from 'react'
import { LeadButton } from '../ui/LeadButton'
import { LeadContainer } from '../ui/LeadContainer'
import { AlertCircle, Check, Loader, Send } from './_icons'

/**
 * LeadForm — lead-capture section (name / email / phone / message).
 *
 * PRESENTATIONAL ONLY. It renders a native <form> with named fields and
 * surfaces idle / submitting / success / error states from props — wire it to
 * a server action / fetch handler later by passing `action`, `status`, and
 * per-field `errors`. No client JS of its own, so it stays a server component.
 *
 * THEMING: every color comes from the semantic token layer (see LeadButton).
 * Tokens used here: --color-surface, --color-surface-2, --color-fg,
 * --color-fg-muted, --color-border, --color-brand, --color-danger,
 * --color-success, --radius-lg, --radius-md.
 */

export type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error'

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'form', string>>

type Props = {
  eyebrow?: string
  heading?: string
  description?: string
  submitLabel?: string
  /** Server action or form endpoint. Optional so it can render standalone. */
  action?: string | ((formData: FormData) => void | Promise<void>)
  status?: LeadFormStatus
  errors?: FieldErrors
  /** Slot under the button — e.g. a privacy note. */
  footnote?: ReactNode
}

const labelClass = 'block text-sm font-medium text-[var(--color-fg,#18181b)]'
const fieldClass =
  'mt-2 block w-full rounded-[var(--radius-md,0.5rem)] border border-[var(--color-border,#e4e4e7)] ' +
  'bg-[var(--color-surface,#ffffff)] px-4 py-2.5 text-sm text-[var(--color-fg,#18181b)] ' +
  'placeholder:text-[var(--color-fg-muted,#71717a)] transition-colors ' +
  'focus:border-[var(--color-brand,#18181b)] focus:outline-none ' +
  'focus:ring-2 focus:ring-[var(--color-brand,#18181b)]/15 ' +
  'aria-[invalid=true]:border-[var(--color-danger,#dc2626)]'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-danger,#dc2626)]"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

export function LeadForm({
  eyebrow = 'Get in touch',
  heading = 'Tell us about your project',
  description = 'Share a few details and we will get back to you within one business day.',
  submitLabel = 'Send message',
  action,
  status = 'idle',
  errors = {},
  footnote,
}: Props) {
  const submitting = status === 'submitting'

  if (status === 'success') {
    return (
      <section className="py-20 sm:py-24">
        <LeadContainer size="narrow">
          <div className="flex flex-col items-center rounded-[var(--radius-lg,0.75rem)] border border-[var(--color-border,#e4e4e7)] bg-[var(--color-surface-2,#f4f4f5)] px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-[var(--radius-pill,9999px)] bg-[var(--color-success,#16a34a)]/10 text-[var(--color-success,#16a34a)]">
              <Check className="size-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--color-fg,#18181b)]">
              Thanks — your message is on its way.
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[var(--color-fg-muted,#71717a)]">
              We have received your details and will reply within one business day.
            </p>
          </div>
        </LeadContainer>
      </section>
    )
  }

  return (
    <section className="py-20 sm:py-24">
      <LeadContainer size="narrow">
        <div className="max-w-prose">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand,#18181b)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-fg,#18181b)] sm:text-4xl">
            {heading}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-[var(--color-fg-muted,#71717a)]">
              {description}
            </p>
          ) : null}
        </div>

        <form action={action} className="mt-10 grid gap-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="lead-name" className={labelClass}>
                Name
              </label>
              <input
                id="lead-name"
                name="name"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'lead-name-error' : undefined}
                className={fieldClass}
              />
              <FieldError id="lead-name-error" message={errors.name} />
            </div>

            <div>
              <label htmlFor="lead-email" className={labelClass}>
                Email
              </label>
              <input
                id="lead-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jane@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'lead-email-error' : undefined}
                className={fieldClass}
              />
              <FieldError id="lead-email-error" message={errors.email} />
            </div>
          </div>

          <div>
            <label htmlFor="lead-phone" className={labelClass}>
              Phone{' '}
              <span className="font-normal text-[var(--color-fg-muted,#71717a)]">(optional)</span>
            </label>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'lead-phone-error' : undefined}
              className={fieldClass}
            />
            <FieldError id="lead-phone-error" message={errors.phone} />
          </div>

          <div>
            <label htmlFor="lead-message" className={labelClass}>
              Message
            </label>
            <textarea
              id="lead-message"
              name="message"
              required
              rows={5}
              placeholder="Tell us what you are looking to build."
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'lead-message-error' : undefined}
              className={`${fieldClass} resize-y`}
            />
            <FieldError id="lead-message-error" message={errors.message} />
          </div>

          {errors.form ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-[var(--radius-md,0.5rem)] border border-[var(--color-danger,#dc2626)]/30 bg-[var(--color-danger,#dc2626)]/5 px-4 py-3 text-sm text-[var(--color-danger,#dc2626)]"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <LeadButton type="submit" size="lg" disabled={submitting} aria-busy={submitting}>
              {submitting ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {submitLabel}
                </>
              )}
            </LeadButton>
            {footnote ? (
              <p className="text-sm text-[var(--color-fg-muted,#71717a)]">{footnote}</p>
            ) : null}
          </div>
        </form>
      </LeadContainer>
    </section>
  )
}
