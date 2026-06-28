import type { HTMLAttributes, ReactNode } from 'react'

/**
 * LeadContainer — width-constrained, horizontally-padded wrapper for lead-gen
 * sections. Distinctly named to avoid collision with the existing
 * `components/marketing/Container`. Mobile-first padding on the 4px scale.
 */

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  size?: 'narrow' | 'default'
}

const widths = {
  narrow: 'max-w-2xl',
  default: 'max-w-6xl',
} as const

export function LeadContainer({ children, size = 'default', className = '', ...rest }: Props) {
  return (
    <div className={`mx-auto w-full px-5 sm:px-6 lg:px-8 ${widths[size]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
