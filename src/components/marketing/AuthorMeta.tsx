import { Award, Github, Globe, Linkedin, type LucideIcon, Twitter } from 'lucide-react'

type Social = { platform?: string | null; url?: string | null }
type ValueItem = { value?: string | null; id?: string | null }

type Props = {
  expertise?: ValueItem[] | null
  credentials?: ValueItem[] | null
  socials?: Social[] | null
}

// Map each People.socials platform to an icon + accessible label. `mastodon`
// has no dedicated lucide glyph, so it shares the generic Globe (still labelled).
const SOCIAL_META: Record<string, { icon: LucideIcon; label: string }> = {
  github: { icon: Github, label: 'GitHub' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  twitter: { icon: Twitter, label: 'Twitter' },
  mastodon: { icon: Globe, label: 'Mastodon' },
  website: { icon: Globe, label: 'Website' },
}

const cleanValues = (items?: ValueItem[] | null): string[] =>
  (items ?? []).map((i) => i?.value).filter((v): v is string => Boolean(v))

/**
 * Visible E-E-A-T trust block for an author profile — renders expertise chips,
 * credentials, and social links. Google prefers structured data backed by
 * VISIBLE content, so these mirror the Person schema's knowsAbout / hasCredential
 * / sameAs. Social links use rel="me" (the IndieWeb/Mastodon verification
 * convention) and rel="noopener" for safety. Renders nothing when all empty.
 */
export function AuthorMeta({ expertise, credentials, socials }: Props) {
  const expertiseValues = cleanValues(expertise)
  const credentialValues = cleanValues(credentials)
  const socialLinks = (socials ?? []).filter((s): s is { platform: string; url: string } =>
    Boolean(s?.platform && s?.url),
  )

  if (expertiseValues.length === 0 && credentialValues.length === 0 && socialLinks.length === 0) {
    return null
  }

  return (
    <div className="mt-8 grid gap-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-7">
      {expertiseValues.length > 0 ? (
        <section aria-label="Areas of expertise">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Expertise
          </h2>
          <ul className="mt-3 flex list-none flex-wrap gap-2 pl-0">
            {expertiseValues.map((value) => (
              <li
                key={value}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {credentialValues.length > 0 ? (
        <section aria-label="Credentials">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Credentials
          </h2>
          <ul className="mt-3 grid list-none gap-2 pl-0">
            {credentialValues.map((value) => (
              <li
                key={value}
                className="flex items-start gap-2.5 text-pretty leading-relaxed text-foreground"
              >
                <Award
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {socialLinks.length > 0 ? (
        <section aria-label="Social profiles">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Find me on
          </h2>
          <ul className="mt-3 flex list-none flex-wrap gap-3 pl-0">
            {socialLinks.map((social) => {
              const meta = SOCIAL_META[social.platform] ?? { icon: Globe, label: social.platform }
              const Icon = meta.icon
              return (
                <li key={social.url}>
                  <a
                    href={social.url}
                    rel="me noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="size-4" strokeWidth={2} aria-hidden />
                    {meta.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
