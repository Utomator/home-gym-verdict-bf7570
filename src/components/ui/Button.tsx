import Link from 'next/link'
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

/**
 * Button — the canonical action primitive for the marketing surface.
 *
 * Token-driven (shadcn/ui semantic classes: primary, muted, border, ring) so a
 * brand recolor at the @theme layer recolors every CTA. Three render modes:
 *   • default            → real <button>
 *   • href="/internal"   → next/link (or <a> for external/absolute hrefs)
 *   • asChild            → clones the single child element and merges classes
 *                          (Radix-style; use to style an arbitrary <a>/<Link>)
 * Variants and sizes are shared so every button across blocks matches.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const base = cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium no-underline',
  'transition-colors duration-150 select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
)

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
  icon: 'h-10 w-10',
}

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

type ButtonAsChild = CommonProps & {
  asChild: true
  href?: undefined
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    asChild?: false
    href?: undefined
  }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    asChild?: false
    href: string
  }

export type ButtonProps = ButtonAsChild | ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children } = props
  const classes = cn(base, variants[variant], sizes[size], className)

  // asChild: merge classes onto the single child element (Radix Slot pattern).
  if ('asChild' in props && props.asChild) {
    if (!isValidElement(children)) return null
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    })
  }

  // Link mode
  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    const isInternal = href.startsWith('/') && !href.startsWith('//')
    if (isInternal) {
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  // Native button
  const { variant: _v, size: _s, className: _c, children: _ch, type, ...rest } = props
  return (
    <button type={type ?? 'button'} className={classes} {...rest}>
      {children}
    </button>
  )
}
