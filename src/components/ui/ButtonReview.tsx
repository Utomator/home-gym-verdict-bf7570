import type { AnchorHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Shared, token-driven button/link primitive for the review-oriented section
 * components (ReviewCard, ProductCard, Testimonial, FaqAccordion, CtaBanner).
 *
 * Named `ButtonReview` to avoid colliding with any other agent's `Button`
 * primitive landing in src/components/ui/. It is intentionally minimal: a
 * styled anchor that maps a `variant`/`size` to the semantic token classes
 * exposed by the @theme layer in globals.css. Recolor the brand at the token
 * layer and every button on the site follows.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none ' +
  'disabled:opacity-50 no-underline'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-muted text-foreground hover:bg-muted/70 border border-border',
  ghost: 'text-foreground hover:bg-muted',
  // High-contrast solid button for placement on a brand/dark surface
  // (e.g. the solid CtaBanner): an opaque light fill with dark text.
  inverse: 'border border-transparent bg-background text-foreground hover:bg-background/90',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: Size
}

export function ButtonReview({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </a>
  )
}
