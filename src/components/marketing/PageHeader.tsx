import { Container } from '@/components/marketing/Container'

/**
 * PageHeader — the standard top-of-page banner for affiliate content-hub pages.
 *
 * Eyebrow (brand accent) + display headline + constrained-measure lede on a
 * subtle muted surface with a hairline. Token-driven and generous; matches the
 * maturity of the designed section blocks. Brings its own Container so callers
 * can drop it at the top of a page without extra wrappers.
 */
type Props = {
  eyebrow?: string
  title: string
  lede?: string
}

export function PageHeader({ eyebrow, title, lede }: Props) {
  return (
    <header className="border-b border-border bg-muted/40">
      <Container className="py-16 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {lede ? (
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {lede}
            </p>
          ) : null}
        </div>
      </Container>
    </header>
  )
}
