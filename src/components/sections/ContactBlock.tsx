import type { ReactNode } from 'react'
import { LeadContainer } from '../ui/LeadContainer'
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from './_icons'

/**
 * ContactBlock — direct-contact section: click-to-call, mailto, WhatsApp
 * click-to-chat (link built from a raw number), and a Google Map embed slot.
 *
 * Server component, no client JS. Pass a `mapEmbedSrc` (a Google Maps
 * "embed a map" iframe URL) to fill the map slot; otherwise a neutral
 * placeholder renders so the layout never collapses.
 *
 * THEMING via the semantic token layer (see LeadButton). Tokens used:
 * --color-surface, --color-surface-2, --color-fg, --color-fg-muted,
 * --color-border, --color-brand, --color-brand-fg, --radius-lg, --radius-md,
 * --radius-pill.
 */

type Props = {
  eyebrow?: string
  heading?: string
  description?: string
  /** Display + tel: number. Symbols/spaces are stripped for the tel: href. */
  phone?: string
  email?: string
  /** Raw WhatsApp number (any format). Non-digits are stripped for wa.me. */
  whatsapp?: string
  /** Optional pre-filled WhatsApp message. */
  whatsappMessage?: string
  /** Display address shown next to the map. */
  address?: string
  /** Google Maps embed iframe `src`. Omit to show a placeholder. */
  mapEmbedSrc?: string
}

const sanitizeTel = (v: string) => v.replace(/[^\d+]/g, '')
const sanitizeWa = (v: string) => v.replace(/\D/g, '')

type ContactItem = {
  icon: ReactNode
  label: string
  value: string
  href: string
  external?: boolean
}

function ContactRow({ icon, label, value, href, external }: ContactItem) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-4 rounded-[var(--radius-md,0.5rem)] border border-transparent px-4 py-3.5 no-underline transition-colors hover:border-[var(--color-border,#e4e4e7)] hover:bg-[var(--color-surface-2,#f4f4f5)]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-pill,9999px)] bg-[var(--color-brand,#18181b)]/8 text-[var(--color-brand,#18181b)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-fg-muted,#71717a)]">
          {label}
        </span>
        <span className="block truncate text-[15px] font-medium text-[var(--color-fg,#18181b)]">
          {value}
        </span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-[var(--color-fg-muted,#71717a)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brand,#18181b)]" />
    </a>
  )
}

export function ContactBlock({
  eyebrow = 'Contact',
  heading = 'Talk to a human',
  description = 'Reach us whichever way is easiest — we usually reply the same day.',
  phone,
  email,
  whatsapp,
  whatsappMessage,
  address,
  mapEmbedSrc,
}: Props) {
  const items: ContactItem[] = []

  if (phone) {
    items.push({
      icon: <Phone className="size-5" />,
      label: 'Call us',
      value: phone,
      href: `tel:${sanitizeTel(phone)}`,
    })
  }
  if (email) {
    items.push({
      icon: <Mail className="size-5" />,
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
    })
  }
  if (whatsapp) {
    const waNumber = sanitizeWa(whatsapp)
    const query = whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''
    items.push({
      icon: <MessageCircle className="size-5" />,
      label: 'WhatsApp',
      value: 'Chat with us',
      href: `https://wa.me/${waNumber}${query}`,
      external: true,
    })
  }

  return (
    <section className="py-20 sm:py-24">
      <LeadContainer>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-brand,#18181b)]">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-fg,#18181b)] sm:text-4xl">
              {heading}
            </h2>
            {description ? (
              <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--color-fg-muted,#71717a)]">
                {description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-1.5">
              {items.map((item) => (
                <ContactRow key={item.label} {...item} />
              ))}
            </div>

            {address ? (
              <p className="mt-8 flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-fg-muted,#71717a)]">
                <MapPin className="mt-0.5 size-5 shrink-0 text-[var(--color-brand,#18181b)]" />
                <span>{address}</span>
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[var(--radius-lg,0.75rem)] border border-[var(--color-border,#e4e4e7)] bg-[var(--color-surface-2,#f4f4f5)]">
            {mapEmbedSrc ? (
              <iframe
                src={mapEmbedSrc}
                title="Map showing our location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="aspect-[4/3] w-full border-0 lg:aspect-auto lg:h-full lg:min-h-[24rem]"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-center lg:aspect-auto lg:h-full lg:min-h-[24rem]">
                <MapPin className="size-8 text-[var(--color-fg-muted,#71717a)]" />
                <p className="px-6 text-sm text-[var(--color-fg-muted,#71717a)]">
                  Map embed slot — pass a Google Maps <code>mapEmbedSrc</code> URL to display your
                  location here.
                </p>
              </div>
            )}
          </div>
        </div>
      </LeadContainer>
    </section>
  )
}
