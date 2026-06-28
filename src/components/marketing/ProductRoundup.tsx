import { outboundRel } from '@p51/engine'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { Check, Star, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/cn'
import { RichText } from './RichText'

/**
 * One roundup item as the Pages `productRoundup` block stores it (depth-resolved).
 * `blurb`/intro/verdict are Lexical states; the rest are plain scalars/arrays.
 */
export type RoundupItem = {
  id?: string | null
  name?: string | null
  slug?: string | null
  affiliateUrl?: string | null
  imageUrl?: string | null
  rating?: number | null
  price?: string | null
  badge?: string | null
  pros?: ({ value?: string | null; id?: string | null } | null)[] | null
  cons?: ({ value?: string | null; id?: string | null } | null)[] | null
  blurb?: SerializedEditorState | null
}

export type ProductRoundupBlock = {
  intro?: SerializedEditorState | null
  items?: RoundupItem[] | null
  verdict?: SerializedEditorState | null
}

const values = (rows?: ({ value?: string | null } | null)[] | null): string[] =>
  (rows ?? []).map((r) => r?.value).filter((v): v is string => Boolean(v?.trim()))

/** Affiliate CTA: rel="sponsored nofollow" (+noopener noreferrer for the new tab). */
const CTA_REL = outboundRel('sponsored', true)

function Rating({ rating }: { rating: number }) {
  const rounded = Math.round(Math.min(Math.max(rating, 0), 5))
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rated ${rating} out of 5`}>
      <span className="flex" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length star row, index is the identity
            key={i}
            className={cn(
              'size-4',
              i < rounded ? 'fill-primary text-primary' : 'fill-none text-muted-foreground/40',
            )}
            strokeWidth={2}
          />
        ))}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

export function RoundupCard({ item }: { item: RoundupItem }) {
  const name = item.name?.trim()
  if (!name) return null
  const href = item.affiliateUrl?.trim()
  const pros = values(item.pros)
  const cons = values(item.cons)

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {item.badge ? (
        <p className="bg-primary px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-primary-foreground">
          {item.badge}
        </p>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        {item.imageUrl ? (
          <div className="relative mb-4 aspect-[3/2] overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={item.imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-card-foreground">
            {name}
          </h3>
          {item.price ? (
            <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">
              {item.price}
            </span>
          ) : null}
        </div>

        {typeof item.rating === 'number' ? (
          <div className="mt-2">
            <Rating rating={item.rating} />
          </div>
        ) : null}

        {item.blurb ? (
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground [&>*:first-child]:mt-0">
            <RichText data={item.blurb} />
          </div>
        ) : null}

        {pros.length || cons.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pros.length ? (
              <ul className="grid list-none gap-1.5 pl-0">
                {pros.map((p) => (
                  <li key={`pro-${p}`} className="flex items-start gap-2 text-sm text-foreground">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {cons.length ? (
              <ul className="grid list-none gap-1.5 pl-0">
                {cons.map((c) => (
                  <li
                    key={`con-${c}`}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <X
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {href ? (
          <div className="mt-5 pt-1">
            <a
              href={href}
              rel={CTA_REL}
              target="_blank"
              className={cn(
                'inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5',
                'text-sm font-semibold text-primary-foreground no-underline transition-colors hover:bg-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {`View ${name}`}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  )
}

/**
 * ProductRoundup — renders a `productRoundup` Pages block as comparison cards.
 *
 * Every item CTA points at the pre-resolved `affiliateUrl` and carries
 * rel="sponsored nofollow" (via outboundRel) + opens in a new tab accessibly. The
 * presence of these links is what `productRoundupHasSponsoredLink` (used by the
 * page) detects to render the FTC AffiliateDisclosure near the top.
 */
export function ProductRoundup({ block }: { block: ProductRoundupBlock }) {
  const items = (block.items ?? []).filter((it): it is RoundupItem => Boolean(it?.name?.trim()))
  if (items.length === 0) return null
  return (
    <section className="not-prose my-10" aria-label="Product comparison">
      {block.intro ? (
        <div className="mb-6 [&>*:first-child]:mt-0">
          <RichText data={block.intro} />
        </div>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <RoundupCard key={item.id ?? `${item.name}-${i}`} item={item} />
        ))}
      </div>
      {block.verdict ? (
        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6 [&>*:first-child]:mt-0">
          <RichText data={block.verdict} />
        </div>
      ) : null}
    </section>
  )
}
