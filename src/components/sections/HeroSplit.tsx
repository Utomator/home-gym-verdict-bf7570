import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/cn'

/**
 * HeroSplit — two-column hero: copy on one side, a media slot on the other.
 *
 * Left-aligned eyebrow / headline / lede / CTAs paired with an `image` slot
 * (pass any node: next/image, <img>, a video, an illustration). Stacks to a
 * single column on mobile. Token-driven; content-via-props. Server component.
 */
export type HeroCta = { label: string; href: string }

export type HeroSplitProps = {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
  footnote?: ReactNode
  /** Media slot rendered in the second column. */
  image?: ReactNode
  /** Place the media on the left at desktop widths instead of the right. */
  mediaPosition?: 'left' | 'right'
  className?: string
}

export function HeroSplit({
  eyebrow,
  title,
  lede,
  primaryCta,
  secondaryCta,
  footnote,
  image,
  mediaPosition = 'right',
  className,
}: HeroSplitProps) {
  return (
    <section className={cn('overflow-hidden bg-background', className)}>
      <Container
        size="wide"
        className="grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28"
      >
        {/* Copy */}
        <div className={cn(mediaPosition === 'left' ? 'lg:order-2' : 'lg:order-1')}>
          {eyebrow ? (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3.5 py-1 text-sm font-medium text-foreground">
              {eyebrow}
            </span>
          ) : null}

          <h1
            className={cn(
              'max-w-xl font-[family-name:var(--font-display)] font-semibold tracking-tight text-foreground',
              'text-4xl leading-[1.1] sm:text-5xl lg:text-[3.25rem]',
              eyebrow ? 'mt-6' : '',
            )}
          >
            {title}
          </h1>

          {lede ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{lede}</p>
          ) : null}

          {primaryCta || secondaryCta ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {primaryCta ? (
                <Button href={primaryCta.href} size="lg" className="w-full sm:w-auto">
                  {primaryCta.label}
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button
                  href={secondaryCta.href}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          ) : null}

          {footnote ? <div className="mt-8 text-sm text-muted-foreground">{footnote}</div> : null}
        </div>

        {/* Media slot */}
        <div className={cn(mediaPosition === 'left' ? 'lg:order-1' : 'lg:order-2')}>
          <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-lg">
            {image ?? (
              <div className="flex aspect-[4/3] w-full items-center justify-center text-sm text-muted-foreground">
                Image
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
