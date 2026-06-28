/**
 * BRAND GENERATOR.
 *
 * `generateBrand({ niche?, vibe? })` SELECTS the best-matching curated preset
 * (see brand-presets.ts) and returns a ready-to-use `Brand` for the Site Brief.
 *
 * Selection is DETERMINISTIC — no Date, no random. Given the same input it
 * always returns the same brand. This guarantees both MATURITY (we only ever
 * emit hand-picked presets) and VARIETY (different niches/vibes map to clearly
 * different identities).
 *
 * An image-generation tool can later derive a logo from the returned brand's
 * accent + display font; the token mechanism handles the rest of the recolor.
 */

import type { Brand } from '@/site.config'
import { type BrandPreset, BRAND_PRESETS, DEFAULT_PRESET_ID } from './brand-presets'

export type GenerateBrandInput = {
  /** Free-text niche / industry, e.g. "fintech for freelancers". */
  niche?: string
  /** Free-text vibe / aesthetic, e.g. "bold and energetic". */
  vibe?: string
}

/** Split free text into lowercased word tokens (alnum runs). */
function tokenize(input: string | undefined): string[] {
  if (!input) return []
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Score a preset against the input tokens. Vibe tokens are matched against the
 * preset's vibeTags and niche tokens against nicheTags, with cross-matching at
 * a lower weight so a niche word that happens to be a vibe tag still counts.
 */
function scorePreset(preset: BrandPreset, nicheToks: string[], vibeToks: string[]): number {
  const inVibe = (t: string) => preset.vibeTags.includes(t)
  const inNiche = (t: string) => preset.nicheTags.includes(t)

  let score = 0
  for (const t of nicheToks) {
    if (inNiche(t)) score += 3
    else if (inVibe(t)) score += 1
  }
  for (const t of vibeToks) {
    if (inVibe(t)) score += 3
    else if (inNiche(t)) score += 1
  }
  return score
}

/** Convert a preset into a Brand for the Site Brief. */
export function presetToBrand(preset: BrandPreset): Brand {
  return {
    palette: { ...preset.palette },
    fonts: { ...preset.fonts },
    radius: preset.radius,
  }
}

/** Look up a preset by id (used by tests / provisioners). */
export function getPresetById(id: string): BrandPreset | undefined {
  return BRAND_PRESETS.find((p) => p.id === id)
}

/**
 * Pick the best-matching preset for the given input. Deterministic:
 *   1. highest tag-overlap score wins;
 *   2. ties break by the preset's index in BRAND_PRESETS (earlier = preferred);
 *   3. a zero score (no signal / no match) falls back to the default preset.
 */
export function selectPreset(input: GenerateBrandInput = {}): BrandPreset {
  const nicheToks = tokenize(input.niche)
  const vibeToks = tokenize(input.vibe)

  let best: BrandPreset | undefined
  let bestScore = 0
  for (const preset of BRAND_PRESETS) {
    const score = scorePreset(preset, nicheToks, vibeToks)
    // Strict `>` keeps the earliest preset on ties (deterministic tiebreak).
    if (score > bestScore) {
      bestScore = score
      best = preset
    }
  }

  if (!best || bestScore === 0) {
    return getPresetById(DEFAULT_PRESET_ID) ?? BRAND_PRESETS[0]
  }
  return best
}

/**
 * Generate a mature, curated Brand from a niche/vibe brief. The entry point a
 * provisioner calls to populate `siteConfig.brand`.
 */
export function generateBrand(input: GenerateBrandInput = {}): Brand {
  return presetToBrand(selectPreset(input))
}
