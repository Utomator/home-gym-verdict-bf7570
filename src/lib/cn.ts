/**
 * cn — tiny, dependency-free className joiner.
 *
 * Accepts strings, numbers, arrays and objects ({ 'class': boolean }) and
 * filters out falsey values. This is intentionally lightweight (no clsx /
 * tailwind-merge dependency); it does NOT de-duplicate conflicting Tailwind
 * utilities, so author component class lists so the intended class wins
 * (e.g. let `className` from props come last).
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input))
    } else if (Array.isArray(input)) {
      const inner = cn(...input)
      if (inner) out.push(inner)
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) out.push(key)
      }
    }
  }
  return out.join(' ')
}
