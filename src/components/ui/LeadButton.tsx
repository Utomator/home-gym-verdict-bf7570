import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * LeadButton — shared, token-driven button primitive for the lead-gen sections.
 *
 * Distinctly named (`Lead*`) to avoid collisions with any future shared
 * `Button` primitive other section authors may add.
 *
 * THEMING: colors/radii come from the semantic token layer (CSS custom
 * properties). Fallbacks are baked in so the component renders sanely before
 * the `@theme` token foundation lands. Recolor the whole site from the tokens:
 *   --color-brand           primary fill
 *   --color-brand-fg        text on primary fill
 *   --color-brand-hover     primary fill hover
 *   --color-border          outline-variant border
 *   --color-fg              outline-variant text
 *   --color-surface-2       subtle hover surface
 *   --radius-pill           pill radius for CTAs
 */

type Variant = 'primary' | 'outline'
type Size = 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  size?: Size
  block?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand,#18181b)] ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface,#ffffff)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 rounded-[var(--radius-pill,9999px)]'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand,#18181b)] text-[var(--color-brand-fg,#ffffff)] ' +
    'hover:bg-[var(--color-brand-hover,#27272a)]',
  outline:
    'border border-[var(--color-border,#e4e4e7)] bg-transparent text-[var(--color-fg,#18181b)] ' +
    'hover:bg-[var(--color-surface-2,#f4f4f5)]',
}

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function LeadButton({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
