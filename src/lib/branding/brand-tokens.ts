/**
 * BRAND → TOKEN OVERRIDES.
 *
 * Pure functions that turn a `Brand` (from the Site Brief) into the exact set
 * of :root CSS-variable overrides that recolor + retype the whole site, plus
 * the matching Google Fonts <link> href. Consumed by the (marketing) and
 * (preview) root layouts, which emit the result as an inline <style>.
 *
 * Deterministic + side-effect free (no Date/random/DOM) so it is trivially
 * testable and SSR-safe.
 */

import type { Brand, NeutralFamily } from '@/site.config'
import { DEFAULT_NEUTRAL, NEUTRAL_RAMPS } from './neutrals'

/** The default brand, mirroring the values baked into globals.css :root. */
export const DEFAULT_RADIUS_REM = 0.625
const DEFAULT_PRIMARY = '#4f46e5'
const DEFAULT_PRIMARY_FOREGROUND = '#ffffff'

/* ── color math (sRGB, WCAG relative luminance) ───────────────────────────── */

/** Parse a #rgb / #rrggbb hex into [r,g,b] 0–255. Returns null when invalid. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * Pick black or white text for the strongest contrast on `bgHex`.
 * Falls back to white when the hex can't be parsed.
 */
export function readableForeground(bgHex: string): string {
  const rgb = parseHex(bgHex)
  if (!rgb) return '#ffffff'
  // Threshold ~0.4 keeps mid-tone accents (indigo/teal/violet) on white text,
  // while light accents (amber/lime) correctly flip to near-black.
  return relativeLuminance(rgb) > 0.45 ? '#18181b' : '#ffffff'
}

/* ── token resolution ─────────────────────────────────────────────────────── */

/** Map of CSS custom-property name → value (without the leading `--`). */
export type TokenOverrides = Record<string, string>

/**
 * Derive the semantic neutral tokens from a ramp family. Mirrors the mapping in
 * globals.css :root so the default ('zinc') reproduces the existing values.
 */
export function neutralTokens(family: NeutralFamily): TokenOverrides {
  const r = NEUTRAL_RAMPS[family]
  return {
    background: '#ffffff',
    foreground: r[900],

    card: '#ffffff',
    'card-foreground': r[900],

    muted: r[100],
    'muted-foreground': r[500],

    accent: r[100],
    'accent-foreground': r[900],

    secondary: r[100],
    'secondary-foreground': r[800],

    border: r[200],
    input: r[200],
  }
}

/**
 * Resolve a Brand (possibly undefined) into the full set of token overrides.
 * Undefined ⇒ the default brand, which reproduces globals.css exactly (so an
 * unbranded site renders identically whether or not the <style> is emitted).
 */
export function resolveBrandTokens(brand?: Brand): TokenOverrides {
  const primary = brand?.palette.primary ?? DEFAULT_PRIMARY
  const primaryForeground =
    brand?.palette.primaryForeground ??
    (brand ? readableForeground(primary) : DEFAULT_PRIMARY_FOREGROUND)
  const neutral = brand?.palette.neutral ?? DEFAULT_NEUTRAL
  const radius = brand?.radius ?? DEFAULT_RADIUS_REM

  return {
    ...neutralTokens(neutral),
    primary,
    'primary-foreground': primaryForeground,
    // The focus ring leans on the accent so it tracks the brand automatically.
    ring: primary,
    radius: `${radius}rem`,
  }
}

/** Serialize token overrides into a CSS `:root { … }` block. */
export function tokensToCss(tokens: TokenOverrides, selector = ':root'): string {
  const body = Object.entries(tokens)
    .map(([k, v]) => `--${k}:${v};`)
    .join('')
  return `${selector}{${body}}`
}

/* ── fonts ────────────────────────────────────────────────────────────────── */

/**
 * Build a single fonts.googleapis.com CSS href that loads BOTH brand families
 * with a sensible weight range. Returns null when no brand fonts are set.
 */
export function googleFontsHref(brand?: Brand): string | null {
  if (!brand?.fonts) return null
  const families = [brand.fonts.display, brand.fonts.text]
    // de-dupe when display === text
    .filter((f, i, a) => a.indexOf(f) === i)
    .map((f) => `family=${f.trim().replace(/\s+/g, '+')}:wght@400;500;600;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/** CSS that points --font-display / --font-sans at the brand fonts. */
export function fontTokensCss(brand?: Brand, selector = ':root'): string {
  if (!brand?.fonts) return ''
  const display = JSON.stringify(brand.fonts.display)
  const text = JSON.stringify(brand.fonts.text)
  return `${selector}{--font-display:${display},ui-sans-serif,system-ui,sans-serif;--font-sans:${text},ui-sans-serif,system-ui,sans-serif;}`
}

/**
 * One-stop helper for layouts: the full inline <style> body (tokens + fonts)
 * plus the Google Fonts href to <link>. When `brand` is undefined the style
 * still reproduces the defaults, so emitting it is always safe + idempotent.
 */
export function brandStyle(brand?: Brand, selector = ':root'): {
  css: string
  fontsHref: string | null
} {
  const css = tokensToCss(resolveBrandTokens(brand), selector) + fontTokensCss(brand, selector)
  return { css, fontsHref: googleFontsHref(brand) }
}
