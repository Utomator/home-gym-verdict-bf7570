import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Container — the canonical horizontal-rhythm wrapper for the marketing surface.
 *
 * Thin alias over the design-system Container: centers content, applies the
 * shared responsive gutters, and caps the measure at one of three widths so the
 * affiliate content-hub pages share one max-width grid with the designed blocks.
 * Token-driven and polymorphic via `as`; forwards `className` + DOM props.
 */
export type ContainerSize = 'narrow' | 'default' | 'wide'

const sizes: Record<ContainerSize, string> = {
  narrow: 'max-w-3xl', // ~65ch reading measure
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
}

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  size?: ContainerSize
  as?: ElementType
}

export function Container({ children, size = 'wide', as, className, ...rest }: Props) {
  const Tag = as ?? 'div'
  return (
    <Tag className={cn('mx-auto w-full px-6 sm:px-8 lg:px-10', sizes[size], className)} {...rest}>
      {children}
    </Tag>
  )
}
