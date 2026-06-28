// MEDIA-SVG — pure, deterministic SVG generators (Tier-1 code-generated media).
//
// These produce on-brand inline SVG *strings* with ZERO external dependency and
// ZERO API key: a geometric hero/og card and labeled charts. They are the
// PRIMARY media for every page — visuals lift dwell/engagement (a ranking
// signal), feed Google Images, and supply the og:image/hero source.
//
// PURITY: every function here is a pure string-producer. NO `Math.random`, NO
// `Date`, NO DOM/canvas, NO payload/next imports — same inputs ⇒ byte-identical
// output. All colors come from the `palette` argument (derived from the site
// brand). Layout entropy comes from a string `seed` hashed deterministically.
//
// SSR-SAFE: callers inline the returned string (e.g. dangerouslySetInnerHTML)
// or base64-encode it into a `data:image/svg+xml` URL for og:image. No runtime
// is required to render them.

/* ── palette ──────────────────────────────────────────────────────────────── */

/**
 * The flat color contract these generators draw with. Distinct from the site
 * `Brand.palette` (primary/primaryForeground/neutral) — this is the resolved,
 * fully-populated set the SVGs actually paint with. Use `resolveMediaPalette`
 * to derive it from a partial (e.g. from the brand's `primary`).
 */
export type MediaPalette = {
  /** Brand accent — dominant shapes, gradient start, bars. */
  primary: string
  /** Secondary accent — gradient end, supporting shapes. */
  secondary: string
  /** Bright highlight — small accents, the underline, the most-positive bar. */
  accent: string
  /** Card/background fill. */
  bg: string
  /** Foreground — title text + axis/labels (must read on `bg`). */
  fg: string
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Normalize a hex to lowercase `#rrggbb`, or null when invalid. */
function normHex(hex: string): string | null {
  const m = HEX_RE.exec(hex.trim())
  if (!m) return null
  let h = m[1].toLowerCase()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return `#${h}`
}

/** Parse a hex into [r,g,b] 0–255, or null when invalid. */
function toRgb(hex: string): [number, number, number] | null {
  const n = normHex(hex)
  if (!n) return null
  const v = Number.parseInt(n.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const clamp255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n))

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (c: number) => clamp255(c).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Mix two colors by `t` (0 ⇒ a, 1 ⇒ b). Falls back gracefully on bad hex. */
function mix(a: string, b: string, t: number): string {
  const ra = toRgb(a)
  const rb = toRgb(b)
  if (!ra || !rb) return normHex(a) ?? '#000000'
  return rgbToHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ])
}

/** Lighten toward white by `t`. */
const lighten = (hex: string, t: number): string => mix(hex, '#ffffff', t)
/** Darken toward black by `t`. */
const darken = (hex: string, t: number): string => mix(hex, '#000000', t)

/** Rotate hue of a hex by `deg` degrees (keeps S/L) for a derived accent. */
function rotateHue(hex: string, deg: number): string {
  const rgb = toRgb(hex)
  if (!rgb) return normHex(hex) ?? '#000000'
  let [r, g, b] = rgb.map((c) => c / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  h = (((h + deg / 360) % 1) + 1) % 1
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return rgbToHex([r * 255, g * 255, b * 255])
}

/** WCAG relative luminance (0 black → 1 white). */
function luminance(hex: string): number {
  const rgb = toRgb(hex)
  if (!rgb) return 0
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
}

/** Pick near-black or white for readable text on `bg`. */
function readableOn(bg: string): string {
  return luminance(bg) > 0.5 ? '#18181b' : '#ffffff'
}

/**
 * Derive a complete {primary,secondary,accent,bg,fg} from a partial. Only
 * `primary` is needed; every other slot is filled deterministically from it
 * (secondary = darkened analog, accent = hue-rotated highlight, bg = white, fg
 * = contrast-derived). Pass overrides to pin any slot. Invalid hexes fall back
 * to the indigo default so a generator never throws on bad brand input.
 */
export function resolveMediaPalette(partial?: Partial<MediaPalette>): MediaPalette {
  const primary = normHex(partial?.primary ?? '') ?? '#4f46e5'
  const bg = normHex(partial?.bg ?? '') ?? '#ffffff'
  const secondary = normHex(partial?.secondary ?? '') ?? darken(rotateHue(primary, -18), 0.15)
  const accent = normHex(partial?.accent ?? '') ?? lighten(rotateHue(primary, 28), 0.08)
  const fg = normHex(partial?.fg ?? '') ?? readableOn(bg)
  return { primary, secondary, accent, bg, fg }
}

/* ── deterministic hashing / RNG ──────────────────────────────────────────── */

/** FNV-1a 32-bit hash of a string → unsigned int. Deterministic, no deps. */
function hashStr(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** A tiny deterministic PRNG (mulberry32) seeded from a string. */
function seededRng(seed: string): () => number {
  let a = hashStr(seed) || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── escaping / formatting ────────────────────────────────────────────────── */

/** Escape text for use inside SVG text/markup (XML-safe). */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Round to ≤2 decimals and drop a trailing `.0` so output stays compact + stable. */
function num(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}

/**
 * Greedy word-wrap into at most `maxLines` lines of ~`maxChars` each. Pure
 * (no DOM measurement) — chars-per-line is an approximation tuned for the
 * headline font size. The last line is ellipsized when text overflows.
 */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > maxChars && line) {
      lines.push(line)
      line = w
      if (lines.length === maxLines) break
    } else {
      line = next
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  // Overflow → ellipsize the final line.
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length
    if (consumed < words.length) {
      let last = lines[maxLines - 1]
      while (last.length > maxChars - 1 && last.includes(' ')) {
        last = last.slice(0, last.lastIndexOf(' '))
      }
      lines[maxLines - 1] = `${last}…`
    }
  }
  return lines.length ? lines : ['']
}

/* ── 1. branded hero / og card ────────────────────────────────────────────── */

export type BrandedHeroOptions = {
  title: string
  subtitle?: string
  palette?: Partial<MediaPalette>
  /** Layout seed; defaults to the title so each post looks distinct but stable. */
  seed?: string
  width?: number
  height?: number
}

/**
 * An on-brand geometric hero: a diagonal brand gradient, a deterministic field
 * of circles/grid lines drawn from the palette, and the wrapped title (+ optional
 * subtitle) with an accent underline. Safe as BOTH an inline page hero and a
 * 1200×630 og card (default size). Deterministic: same inputs ⇒ identical bytes.
 */
export function brandedHeroSvg(opts: BrandedHeroOptions): string {
  const { title, subtitle, width = 1200, height = 630 } = opts
  const pal = resolveMediaPalette(opts.palette)
  const seed = opts.seed ?? title
  const rng = seededRng(`hero:${seed}`)

  const gradFrom = pal.primary
  const gradTo = mix(pal.secondary, pal.primary, 0.25)
  const onGrad = readableOn(mix(gradFrom, gradTo, 0.5))
  const idp = `h${(hashStr(seed) % 0xffff).toString(16)}`

  // --- deterministic decorative shapes (circles) in the gradient field ---
  const shapes: string[] = []
  const blobCount = 5 + Math.floor(rng() * 3) // 5–7
  for (let i = 0; i < blobCount; i++) {
    const cx = num(rng() * width)
    const cy = num(rng() * height)
    const r = num(40 + rng() * (Math.min(width, height) * 0.4))
    const fill = rng() > 0.5 ? pal.accent : lighten(pal.primary, 0.25)
    const op = num(0.06 + rng() * 0.1)
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`)
  }
  // A couple of thin accent rings for depth.
  for (let i = 0; i < 2; i++) {
    const cx = num(rng() * width)
    const cy = num(rng() * height)
    const r = num(80 + rng() * (Math.min(width, height) * 0.35))
    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${pal.accent}" stroke-width="2" opacity="0.18"/>`,
    )
  }

  // --- title block ---
  const pad = Math.round(width * 0.06)
  const titleSize = title.length > 90 ? 52 : title.length > 55 ? 62 : 74
  const maxChars = Math.max(12, Math.floor((width - pad * 2) / (titleSize * 0.52)))
  const lines = wrap(title, maxChars, 3)
  const lineH = Math.round(titleSize * 1.12)
  // Vertically center the block, biased slightly above the midline.
  const blockH = lines.length * lineH + (subtitle ? 56 : 0)
  let ty = Math.round(height / 2 - blockH / 2 + titleSize * 0.8)

  const titleSpans = lines
    .map((ln, i) => {
      const y = ty + i * lineH
      return `<text x="${pad}" y="${y}" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${titleSize}" font-weight="700" letter-spacing="-0.02em" fill="${onGrad}">${esc(ln)}</text>`
    })
    .join('')
  ty += (lines.length - 1) * lineH

  const underlineY = ty + Math.round(titleSize * 0.55)
  const underline = `<rect x="${pad}" y="${underlineY}" width="${Math.round(width * 0.1)}" height="6" rx="3" fill="${pal.accent}"/>`

  const subtitleEl = subtitle
    ? `<text x="${pad}" y="${underlineY + 52}" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="30" font-weight="500" fill="${mix(onGrad, gradFrom, 0.12)}" opacity="0.92">${esc(subtitle.slice(0, 120))}</text>`
    : ''

  const a11yTitle = `${title}${subtitle ? ` — ${subtitle}` : ''}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${idp}-t ${idp}-d"><title id="${idp}-t">${esc(a11yTitle)}</title><desc id="${idp}-d">${esc(`Branded hero graphic for "${title}".`)}</desc><defs><linearGradient id="${idp}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${gradFrom}"/><stop offset="1" stop-color="${gradTo}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="${gradFrom}"/><rect width="${width}" height="${height}" fill="url(#${idp}-g)"/><g>${shapes.join('')}</g>${titleSpans}${underline}${subtitleEl}</svg>`
}

/* ── 2a. vertical bar chart ───────────────────────────────────────────────── */

export type ChartDatum = { label: string; value: number }

export type BarChartOptions = {
  data: ChartDatum[]
  palette?: Partial<MediaPalette>
  width?: number
  height?: number
  title?: string
}

/**
 * A clean labeled vertical bar chart. Brand-colored bars (accent on the max),
 * value labels above each bar, x-axis category labels, and an accessible
 * <title>/<desc>. Deterministic; safe to inline. Empty data ⇒ a valid empty SVG.
 */
export function barChartSvg(opts: BarChartOptions): string {
  const { data, width = 800, height = 450, title } = opts
  const pal = resolveMediaPalette(opts.palette)
  const idp = `bc${(hashStr(`${title ?? ''}:${data.map((d) => d.label + d.value).join(',')}`) % 0xffff).toString(16)}`

  const padL = 56
  const padR = 24
  const padTop = title ? 64 : 32
  const padBottom = 64
  const plotW = width - padL - padR
  const plotH = height - padTop - padBottom

  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0))
  const maxV = Math.max(1, ...values)
  const maxIdx = values.indexOf(Math.max(...values))

  const n = data.length || 1
  const gap = plotW / n
  const barW = Math.min(gap * 0.62, 120)

  const titleEl = title
    ? `<text x="${padL}" y="36" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" font-weight="700" fill="${pal.fg}">${esc(title)}</text>`
    : ''

  // Faint horizontal gridlines (quarters).
  const grid: string[] = []
  for (let i = 1; i <= 4; i++) {
    const gy = num(padTop + (plotH * i) / 4)
    grid.push(
      `<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" stroke="${mix(pal.fg, pal.bg, 0.88)}" stroke-width="1"/>`,
    )
  }

  const bars = data
    .map((d, i) => {
      const v = Number.isFinite(d.value) ? d.value : 0
      const bh = (Math.max(0, v) / maxV) * plotH
      const x = padL + gap * i + (gap - barW) / 2
      const y = padTop + plotH - bh
      const fill = i === maxIdx ? pal.accent : pal.primary
      const valLabel = `<text x="${num(x + barW / 2)}" y="${num(y - 8)}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="15" font-weight="600" fill="${pal.fg}">${esc(num(v))}</text>`
      const catLabel = `<text x="${num(x + barW / 2)}" y="${num(padTop + plotH + 24)}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" fill="${mix(pal.fg, pal.bg, 0.25)}">${esc(d.label.slice(0, 18))}</text>`
      return `<rect x="${num(x)}" y="${num(y)}" width="${num(barW)}" height="${num(bh)}" rx="4" fill="${fill}"/>${valLabel}${catLabel}`
    })
    .join('')

  // Axis line.
  const axis = `<line x1="${padL}" y1="${padTop + plotH}" x2="${width - padR}" y2="${padTop + plotH}" stroke="${mix(pal.fg, pal.bg, 0.55)}" stroke-width="2"/>`

  const a11yTitle = title ?? 'Bar chart'
  const desc = data
    .map((d) => `${d.label}: ${num(Number.isFinite(d.value) ? d.value : 0)}`)
    .join(', ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${idp}-t ${idp}-d"><title id="${idp}-t">${esc(a11yTitle)}</title><desc id="${idp}-d">${esc(desc)}</desc><rect width="${width}" height="${height}" fill="${pal.bg}"/>${titleEl}<g>${grid.join('')}</g>${axis}<g>${bars}</g></svg>`
}

/* ── 2b. horizontal comparison bars ───────────────────────────────────────── */

export type ComparisonBarsOptions = {
  data: ChartDatum[]
  palette?: Partial<MediaPalette>
  width?: number
  height?: number
  title?: string
  /** Max scale value; defaults to the data max. Useful for fixed ratings (e.g. 5 or 10). */
  max?: number
}

/**
 * Horizontal labeled bars for "X vs Y" comparisons and roundup ratings. Each row
 * shows its label, a brand-colored track-and-bar, and the value. The longest bar
 * gets the bright accent. Accessible + deterministic. Empty data ⇒ valid SVG.
 */
export function comparisonBarsSvg(opts: ComparisonBarsOptions): string {
  const { data, width = 800, title } = opts
  const pal = resolveMediaPalette(opts.palette)
  const idp = `cb${(hashStr(`${title ?? ''}:${data.map((d) => d.label + d.value).join(',')}`) % 0xffff).toString(16)}`

  const rowH = 44
  const rowGap = 16
  const padX = 24
  const padTop = title ? 60 : 28
  const padBottom = 24
  const labelW = Math.min(220, Math.round(width * 0.3))
  const valueW = 64
  const trackX = padX + labelW + 12
  const trackW = width - trackX - valueW - padX

  const n = data.length
  const height = opts.height ?? padTop + n * rowH + Math.max(0, n - 1) * rowGap + padBottom

  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0))
  const maxV = Math.max(1, opts.max ?? Math.max(...values, 0))
  const maxIdx = values.indexOf(Math.max(...values, Number.NEGATIVE_INFINITY))

  const titleEl = title
    ? `<text x="${padX}" y="34" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" font-weight="700" fill="${pal.fg}">${esc(title)}</text>`
    : ''

  const rows = data
    .map((d, i) => {
      const v = Number.isFinite(d.value) ? d.value : 0
      const y = padTop + i * (rowH + rowGap)
      const barLen = Math.max(0, Math.min(1, v / maxV)) * trackW
      const fill = i === maxIdx ? pal.accent : pal.primary
      const track = mix(pal.fg, pal.bg, 0.9)
      const label = `<text x="${padX}" y="${num(y + rowH / 2 + 5)}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16" font-weight="600" fill="${pal.fg}">${esc(d.label.slice(0, 28))}</text>`
      const trackRect = `<rect x="${trackX}" y="${num(y + rowH / 2 - 9)}" width="${num(trackW)}" height="18" rx="9" fill="${track}"/>`
      const barRect = `<rect x="${trackX}" y="${num(y + rowH / 2 - 9)}" width="${num(barLen)}" height="18" rx="9" fill="${fill}"/>`
      const valLabel = `<text x="${width - padX}" y="${num(y + rowH / 2 + 5)}" text-anchor="end" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16" font-weight="700" fill="${pal.fg}">${esc(num(v))}</text>`
      return `${label}${trackRect}${barRect}${valLabel}`
    })
    .join('')

  const a11yTitle = title ?? 'Comparison chart'
  const desc = data
    .map((d) => `${d.label}: ${num(Number.isFinite(d.value) ? d.value : 0)}`)
    .join(', ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${idp}-t ${idp}-d"><title id="${idp}-t">${esc(a11yTitle)}</title><desc id="${idp}-d">${esc(desc)}</desc><rect width="${width}" height="${height}" fill="${pal.bg}"/>${titleEl}<g>${rows}</g></svg>`
}

/* ── data-URI helper ──────────────────────────────────────────────────────── */

/**
 * Wrap any of the above SVG strings into a `data:image/svg+xml` URL suitable for
 * an og:image / <img src>. Uses base64 so it round-trips through scrapers that
 * mishandle percent-encoding. Pure — no Buffer/Node dependency.
 */
export function svgToDataUri(svg: string): string {
  // btoa needs latin1; SVGs here are ASCII-safe, but guard non-ASCII just in case.
  const b64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(svg)))
      : // Node fallback without importing Buffer types into the engine.
        ((
          globalThis as { Buffer?: { from(s: string, e: string): { toString(e: string): string } } }
        ).Buffer?.from(svg, 'utf-8').toString('base64') ?? '')
  return `data:image/svg+xml;base64,${b64}`
}
