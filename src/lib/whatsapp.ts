/**
 * Build a click-to-chat wa.me link from a phone number + optional prefilled text.
 *
 * Pure, dependency-free, and safe on both server and client — used by the
 * landing lead funnel's WhatsApp CTA (works today, no backend required).
 *
 * The number is normalised to digits only (wa.me requires the full
 * international number with NO "+", spaces, dashes, or parentheses). Returns
 * `undefined` when no usable number is supplied so callers can omit the button.
 */
export function waMeLink(rawNumber?: string, text?: string): string | undefined {
  if (!rawNumber) return undefined
  const digits = rawNumber.replace(/[^\d]/g, '')
  if (!digits) return undefined
  const base = `https://wa.me/${digits}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}
