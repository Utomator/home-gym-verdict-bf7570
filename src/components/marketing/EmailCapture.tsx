'use client'
import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'
import { type SubscribeState, submitSubscribe } from '@/app/(marketing)/_actions/subscribe'
import { cn } from '@/lib/cn'

/**
 * EmailCapture — newsletter / lead email-capture form.
 *
 * Wires to the `submitSubscribe` server action (REQUEST-time write to the
 * Submissions collection, tagged via the `source` prop). Two layouts:
 *   • variant="inline"  → compact one-row band for mid-content / footers.
 *   • variant="section" → a full bordered card with eyebrow + heading.
 *
 * Accessibility: labelled email input (visible label in section, sr-only inline),
 * aria-invalid + aria-describedby on error, role="status"/"alert" for the
 * success/error live regions. Anti-spam: a visually hidden honeypot field
 * (`company_url`) the server treats as a bot signal.
 *
 * Theming uses the semantic token classes (text-primary / border-border /
 * bg-muted / text-foreground), so rebranding the site recolors this too.
 */

const initial: SubscribeState = {}

type Props = {
  variant?: 'inline' | 'section'
  /** Submissions `source` tag (allowlisted server-side). */
  source?: string
  eyebrow?: string
  heading?: string
  description?: string
  placeholder?: string
  submitLabel?: string
  successMessage?: string
  className?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Subscribing…' : label}
    </button>
  )
}

export function EmailCapture({
  variant = 'inline',
  source = 'newsletter',
  eyebrow = 'Newsletter',
  heading = 'Get new posts in your inbox',
  description = 'Practical, no-fluff updates. Unsubscribe anytime.',
  placeholder = 'you@example.com',
  submitLabel = 'Subscribe',
  successMessage = 'You are subscribed — check your inbox to confirm.',
  className,
}: Props) {
  const [state, action] = useActionState(submitSubscribe, initial)
  const emailId = useId()
  const errorId = useId()

  const ok = 'ok' in state && state.ok
  const emailError = 'errors' in state ? state.errors.email : undefined
  const formError = 'errors' in state ? state.errors._form : undefined

  const section = variant === 'section'

  const Form = ok ? (
    <p
      role="status"
      className={cn(
        'flex items-center gap-2 rounded-md bg-primary/10 px-4 py-3 text-sm font-medium text-primary',
        section && 'justify-center',
      )}
    >
      <CheckIcon className="size-4 shrink-0" />
      {successMessage}
    </p>
  ) : (
    <form
      action={action}
      noValidate
      className={cn('flex w-full flex-col gap-3 sm:flex-row', section && 'mx-auto max-w-md')}
    >
      <div className="flex-1">
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={placeholder}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? errorId : undefined}
          className="block w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 aria-[invalid=true]:border-red-500"
        />
      </div>
      {/* Honeypot: hidden from sighted + AT users; bots fill it → server drops it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${emailId}-hp`}>Do not fill this field</label>
        <input
          id={`${emailId}-hp`}
          type="text"
          name="company_url"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="source" value={source} />
      <SubmitButton label={submitLabel} />
    </form>
  )

  if (section) {
    return (
      <section
        className={cn('rounded-2xl border border-border bg-muted px-6 py-12 sm:px-12', className)}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h2>
          {description ? (
            <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <div className="mt-8 w-full">{Form}</div>
          {emailError && !ok ? (
            <p id={errorId} role="alert" className="mt-3 text-sm text-red-600">
              {emailError}
            </p>
          ) : null}
          {formError && !ok ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {formError}
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border bg-muted/40 p-5 sm:p-6', className)}>
      {heading ? <p className="text-sm font-semibold text-foreground">{heading}</p> : null}
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{Form}</div>
      {emailError && !ok ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-600">
          {emailError}
        </p>
      ) : null}
      {formError && !ok ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {formError}
        </p>
      ) : null}
    </div>
  )
}

function CheckIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
