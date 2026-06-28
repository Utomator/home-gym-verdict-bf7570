'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { type SubmitState, submitContact } from '../_actions/submit'

const initial: SubmitState = {}

const fieldClass =
  'mt-2 block w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10'
const labelClass = 'block text-sm font-medium text-zinc-900'
const errorClass = 'mt-2 text-sm text-red-600'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? 'Sending…' : 'Send message'}
    </button>
  )
}

export function ContactForm() {
  const [state, action] = useActionState(submitContact, initial)
  if ('ok' in state && state.ok) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Thanks — we'll be in touch.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Your message landed. Expect a reply within one business day.
        </p>
      </div>
    )
  }
  const errs = ('errors' in state ? state.errors : {}) ?? {}
  return (
    <form action={action} className="grid max-w-xl gap-6">
      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          required
          placeholder="Jane Doe"
          className={fieldClass}
        />
        {errs.name?.[0] ? <p className={errorClass}>{errs.name[0]}</p> : null}
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder="jane@company.com"
          className={fieldClass}
        />
        {errs.email?.[0] ? <p className={errorClass}>{errs.email[0]}</p> : null}
      </div>

      <div>
        <label htmlFor="contact-company" className={labelClass}>
          Company <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input id="contact-company" name="company" placeholder="Acme Inc" className={fieldClass} />
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="Tell us about the AI system you want to build."
          className={fieldClass}
        />
        {errs.message?.[0] ? <p className={errorClass}>{errs.message[0]}</p> : null}
      </div>

      {errs._form?.[0] ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errs._form[0]}
        </div>
      ) : null}

      <div>
        <Submit />
      </div>
    </form>
  )
}
