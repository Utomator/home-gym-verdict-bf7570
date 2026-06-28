import type { ReactNode } from 'react'
import { LeadButton } from '../ui/LeadButton'
import { LeadContainer } from '../ui/LeadContainer'
import { AlertCircle, Check, Loader, Mail } from './_icons'

/**
 * NewsletterOptIn — compact email-capture band for newsletter sign-ups.
 *
 * PRESENTATIONAL ONLY: renders a native <form> with a single `email` field and
 * surfaces idle / submitting / success / error states from props. Wire it to a
 * server action / endpoint later via `action` + `status`. Server component.
 *
 * THEMING via the semantic token layer (see LeadButton). Tokens used:
 * --color-brand, --color-brand-fg, --color-fg, --color-fg-muted,
 * --color-border, --color-surface, --color-danger, --color-success,
 * --radius-lg, --radius-md, --radius-pill.
 */

export type NewsletterStatus = 'idle' | 'submitting' | 'success' | 'error'

type Props = {
  eyebrow?: string
  heading?: string
  description?: string
  placeholder?: string
  submitLabel?: string
  action?: string | ((formData: FormData) => void | Promise<void>)
  status?: NewsletterStatus
  /** Error message shown under the field when status is `error`. */
  error?: string
  /** Slot for a privacy/consent note under the field. */
  consentNote?: ReactNode
}

export function NewsletterOptIn({
  eyebrow = 'Newsletter',
  heading = 'Stay in the loop',
  description = 'Occasional updates, no spam. Unsubscribe anytime.',
  placeholder = 'you@company.com',
  submitLabel = 'Subscribe',
  action,
  status = 'idle',
  error,
  consentNote = 'We respect your inbox. Unsubscribe with one click.',
}: Props) {
  const submitting = status === 'submitting'
  const success = status === 'success'

  return (
    <section className="py-20 sm:py-24">
      <LeadContainer>
        <div className="overflow-hidden rounded-[var(--radius-lg,0.75rem)] border border-[var(--color-border,#e4e4e7)] bg-[var(--color-surface-2,#f4f4f5)] px-6 py-14 sm:px-12 sm:py-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-[var(--radius-pill,9999px)] bg-[var(--color-brand,#18181b)]/8 text-[var(--color-brand,#18181b)]">
              <Mail className="size-6" />
            </span>

            {eyebrow ? (
              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[var(--color-brand,#18181b)]">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-fg,#18181b)] sm:text-4xl">
              {heading}
            </h2>
            {description ? (
              <p className="mt-4 text-base leading-relaxed text-[var(--color-fg-muted,#71717a)]">
                {description}
              </p>
            ) : null}

            {success ? (
              <p
                role="status"
                className="mt-8 flex items-center gap-2 rounded-[var(--radius-pill,9999px)] bg-[var(--color-success,#16a34a)]/10 px-5 py-3 text-sm font-medium text-[var(--color-success,#16a34a)]"
              >
                <Check className="size-4" />
                You are subscribed — check your inbox to confirm.
              </p>
            ) : (
              <form
                action={action}
                noValidate
                className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
              >
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="block w-full rounded-[var(--radius-md,0.5rem)] border border-[var(--color-border,#e4e4e7)] bg-[var(--color-surface,#ffffff)] px-4 py-3 text-sm text-[var(--color-fg,#18181b)] placeholder:text-[var(--color-fg-muted,#71717a)] transition-colors focus:border-[var(--color-brand,#18181b)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand,#18181b)]/15 aria-[invalid=true]:border-[var(--color-danger,#dc2626)]"
                  />
                </div>
                <LeadButton type="submit" size="lg" disabled={submitting} aria-busy={submitting}>
                  {submitting ? (
                    <>
                      <Loader className="size-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    submitLabel
                  )}
                </LeadButton>
              </form>
            )}

            {error && !success ? (
              <p
                id="newsletter-error"
                role="alert"
                className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-danger,#dc2626)]"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            {consentNote && !success ? (
              <p className="mt-4 text-xs text-[var(--color-fg-muted,#71717a)]">{consentNote}</p>
            ) : null}
          </div>
        </div>
      </LeadContainer>
    </section>
  )
}
