import { describe, expect, it } from 'vitest'
import {
  BRAND_PRESETS,
  DEFAULT_PRESET_ID,
} from '@/lib/branding/brand-presets'
import {
  brandStyle,
  fontTokensCss,
  googleFontsHref,
  neutralTokens,
  parseHex,
  readableForeground,
  relativeLuminance,
  resolveBrandTokens,
  tokensToCss,
} from '@/lib/branding/brand-tokens'
import {
  generateBrand,
  getPresetById,
  presetToBrand,
  selectPreset,
} from '@/lib/branding/generate-brand'
import { NEUTRAL_RAMPS } from '@/lib/branding/neutrals'
import type { Brand } from '@/site.config'

describe('parseHex', () => {
  it('parses 6-digit hex with and without #', () => {
    expect(parseHex('#4f46e5')).toEqual([0x4f, 0x46, 0xe5])
    expect(parseHex('4f46e5')).toEqual([0x4f, 0x46, 0xe5])
  })
  it('expands 3-digit shorthand', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('#000')).toEqual([0, 0, 0])
  })
  it('returns null for garbage', () => {
    expect(parseHex('nope')).toBeNull()
    expect(parseHex('#12')).toBeNull()
    expect(parseHex('')).toBeNull()
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5)
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5)
  })
  it('is monotonic for grays', () => {
    expect(relativeLuminance([64, 64, 64])).toBeLessThan(relativeLuminance([192, 192, 192]))
  })
})

describe('readableForeground', () => {
  it('returns white on dark accents', () => {
    expect(readableForeground('#4f46e5')).toBe('#ffffff') // indigo
    expect(readableForeground('#1d4ed8')).toBe('#ffffff') // blue
    expect(readableForeground('#000000')).toBe('#ffffff')
  })
  it('returns near-black on light accents', () => {
    expect(readableForeground('#fbbf24')).toBe('#18181b') // amber
    expect(readableForeground('#ffffff')).toBe('#18181b')
  })
  it('falls back to white for invalid hex', () => {
    expect(readableForeground('not-a-color')).toBe('#ffffff')
  })
})

describe('neutralTokens', () => {
  it('maps the zinc ramp to the exact globals.css defaults', () => {
    const t = neutralTokens('zinc')
    expect(t.background).toBe('#ffffff')
    expect(t.foreground).toBe('#18181b') // zinc-900
    expect(t.muted).toBe('#f4f4f5') // zinc-100
    expect(t['muted-foreground']).toBe('#71717a') // zinc-500
    expect(t.border).toBe('#e4e4e7') // zinc-200
  })
  it('produces a distinct ramp per family', () => {
    expect(neutralTokens('slate').foreground).toBe(NEUTRAL_RAMPS.slate[900])
    expect(neutralTokens('stone').border).toBe(NEUTRAL_RAMPS.stone[200])
    expect(neutralTokens('slate').foreground).not.toBe(neutralTokens('zinc').foreground)
  })
})

describe('resolveBrandTokens', () => {
  it('reproduces the globals.css defaults when brand is undefined', () => {
    const t = resolveBrandTokens(undefined)
    expect(t.primary).toBe('#4f46e5')
    expect(t['primary-foreground']).toBe('#ffffff')
    expect(t.background).toBe('#ffffff')
    expect(t.foreground).toBe('#18181b')
    expect(t.muted).toBe('#f4f4f5')
    expect(t.border).toBe('#e4e4e7')
    expect(t.radius).toBe('0.625rem')
  })

  it('overrides the accent and derives a readable foreground', () => {
    const brand: Brand = { palette: { primary: '#dc2626' } }
    const t = resolveBrandTokens(brand)
    expect(t.primary).toBe('#dc2626')
    expect(t['primary-foreground']).toBe('#ffffff') // dark red → white text
    expect(t.ring).toBe('#dc2626')
  })

  it('respects an explicit primaryForeground', () => {
    const brand: Brand = {
      palette: { primary: '#fbbf24', primaryForeground: '#000000' },
    }
    expect(resolveBrandTokens(brand)['primary-foreground']).toBe('#000000')
  })

  it('swaps the neutral ramp', () => {
    const brand: Brand = { palette: { primary: '#0d9488', neutral: 'slate' } }
    const t = resolveBrandTokens(brand)
    expect(t.foreground).toBe(NEUTRAL_RAMPS.slate[900])
    expect(t.border).toBe(NEUTRAL_RAMPS.slate[200])
  })

  it('applies a custom radius', () => {
    expect(resolveBrandTokens({ palette: { primary: '#000' }, radius: 1 }).radius).toBe('1rem')
  })
})

describe('tokensToCss', () => {
  it('serializes into a :root block with --vars', () => {
    const css = tokensToCss({ primary: '#abcdef', radius: '1rem' })
    expect(css).toBe(':root{--primary:#abcdef;--radius:1rem;}')
  })
  it('accepts a custom selector', () => {
    expect(tokensToCss({ primary: '#000' }, '.scope')).toBe('.scope{--primary:#000;}')
  })
})

describe('google fonts', () => {
  it('returns null without brand fonts', () => {
    expect(googleFontsHref(undefined)).toBeNull()
    expect(googleFontsHref({ palette: { primary: '#000' } })).toBeNull()
    expect(fontTokensCss(undefined)).toBe('')
  })

  it('builds a css2 href with both families (spaces → +)', () => {
    const href = googleFontsHref({
      palette: { primary: '#000' },
      fonts: { display: 'Space Grotesk', text: 'Inter' },
    })
    expect(href).toContain('https://fonts.googleapis.com/css2?')
    expect(href).toContain('family=Space+Grotesk:wght@400;500;600;700')
    expect(href).toContain('family=Inter:wght@400;500;600;700')
    expect(href).toContain('display=swap')
  })

  it('de-dupes when display === text', () => {
    const href = googleFontsHref({
      palette: { primary: '#000' },
      fonts: { display: 'Inter', text: 'Inter' },
    })
    expect(href?.match(/family=Inter/g)?.length).toBe(1)
  })

  it('wires --font-display and --font-sans', () => {
    const css = fontTokensCss({
      palette: { primary: '#000' },
      fonts: { display: 'Sora', text: 'Inter' },
    })
    expect(css).toContain('--font-display:"Sora"')
    expect(css).toContain('--font-sans:"Inter"')
  })
})

describe('brandStyle', () => {
  it('emits tokens with no font href when brand is undefined', () => {
    const { css, fontsHref } = brandStyle(undefined)
    expect(fontsHref).toBeNull()
    expect(css).toContain('--primary:#4f46e5')
    expect(css).not.toContain('--font-display')
  })
  it('emits tokens + fonts when branded', () => {
    const { css, fontsHref } = brandStyle({
      palette: { primary: '#7c3aed', neutral: 'zinc' },
      fonts: { display: 'Sora', text: 'Inter' },
    })
    expect(css).toContain('--primary:#7c3aed')
    expect(css).toContain('--font-display:"Sora"')
    expect(fontsHref).toContain('fonts.googleapis.com')
  })
})

describe('brand presets', () => {
  it('ships ~10 mature presets with the required shape', () => {
    expect(BRAND_PRESETS.length).toBeGreaterThanOrEqual(10)
    for (const p of BRAND_PRESETS) {
      expect(p.id).toBeTruthy()
      expect(parseHex(p.palette.primary)).not.toBeNull()
      expect(p.fonts.display).toBeTruthy()
      expect(p.fonts.text).toBeTruthy()
      expect(p.vibeTags.length).toBeGreaterThan(0)
      expect(p.nicheTags.length).toBeGreaterThan(0)
      expect(typeof p.radius).toBe('number')
    }
  })
  it('has unique ids', () => {
    const ids = BRAND_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('has a resolvable default preset', () => {
    expect(getPresetById(DEFAULT_PRESET_ID)).toBeDefined()
  })
})

describe('generateBrand / selectPreset', () => {
  it('is deterministic for the same input', () => {
    const a = generateBrand({ niche: 'fintech', vibe: 'serious' })
    const b = generateBrand({ niche: 'fintech', vibe: 'serious' })
    expect(a).toEqual(b)
  })

  it('selects finance-navy for a finance niche', () => {
    expect(selectPreset({ niche: 'finance' }).id).toBe('finance-navy')
    expect(selectPreset({ niche: 'banking fintech' }).id).toBe('finance-navy')
  })

  it('selects fresh-emerald for wellness', () => {
    expect(selectPreset({ niche: 'health wellness fitness' }).id).toBe('fresh-emerald')
  })

  it('selects by vibe when niche is absent', () => {
    expect(selectPreset({ vibe: 'luxury creative' }).id).toBe('luxe-violet')
  })

  it('different niches map to different brands (variety)', () => {
    const finance = generateBrand({ niche: 'finance' })
    const food = generateBrand({ niche: 'restaurant food coffee' })
    expect(finance.palette.primary).not.toBe(food.palette.primary)
  })

  it('falls back to the default preset on no signal', () => {
    expect(selectPreset({}).id).toBe(DEFAULT_PRESET_ID)
    expect(selectPreset({ niche: 'zzzzz qqqqq' }).id).toBe(DEFAULT_PRESET_ID)
  })

  it('breaks ties by preset index (earliest wins)', () => {
    // 'modern' is a vibe tag shared by several presets; the earliest in
    // BRAND_PRESETS must win deterministically.
    const firstModern = BRAND_PRESETS.find((p) => p.vibeTags.includes('modern'))
    expect(selectPreset({ vibe: 'modern' }).id).toBe(firstModern?.id)
  })

  it('presetToBrand yields a valid Brand', () => {
    const brand = presetToBrand(BRAND_PRESETS[0])
    expect(brand.palette.primary).toBe(BRAND_PRESETS[0].palette.primary)
    expect(brand.fonts?.display).toBe(BRAND_PRESETS[0].fonts.display)
    // resolves into tokens cleanly
    expect(resolveBrandTokens(brand).primary).toBe(BRAND_PRESETS[0].palette.primary)
  })

  it('every preset produces a readable accent foreground', () => {
    for (const p of BRAND_PRESETS) {
      const fg = resolveBrandTokens(presetToBrand(p))['primary-foreground']
      expect(['#ffffff', '#18181b']).toContain(fg)
    }
  })
})
