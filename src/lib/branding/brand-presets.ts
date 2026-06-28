/**
 * CURATED BRAND PRESETS.
 *
 * ~10 hand-picked, MATURE brand identities — each a tasteful accent + neutral
 * ramp, a vetted Google Fonts display+text PAIRING, and a base radius. These
 * are the universe `generateBrand` selects from, so output is always polished
 * and varied (curated, never random).
 *
 * Each preset carries `vibeTags` (aesthetic adjectives) and `nicheTags`
 * (industry/topic words) used for deterministic tag-overlap matching.
 *
 * NOTE: a logo is intentionally NOT part of a preset. An image-generation tool
 * can later produce a wordmark/mark from the brand's accent + display font and
 * attach it via the CMS SiteSettings.organization.logo — the token mechanism
 * here recolors everything else.
 */

import type { Brand } from '@/site.config'

export type BrandPreset = {
  id: string
  /** Aesthetic adjectives, lowercased. */
  vibeTags: string[]
  /** Industry / topic words, lowercased. */
  nicheTags: string[]
  palette: Brand['palette']
  fonts: NonNullable<Brand['fonts']>
  radius: number
}

export const BRAND_PRESETS: readonly BrandPreset[] = [
  {
    id: 'indigo-modern',
    vibeTags: ['modern', 'professional', 'trustworthy', 'clean', 'corporate', 'default'],
    nicheTags: ['saas', 'software', 'technology', 'startup', 'b2b', 'productivity'],
    palette: { primary: '#4f46e5', neutral: 'zinc' },
    fonts: { display: 'Space Grotesk', text: 'Inter' },
    radius: 0.625,
  },
  {
    id: 'editorial-warm',
    vibeTags: ['editorial', 'elegant', 'warm', 'sophisticated', 'literary', 'refined'],
    nicheTags: ['publishing', 'media', 'blog', 'magazine', 'writing', 'journalism', 'lifestyle'],
    palette: { primary: '#b45309', neutral: 'stone' },
    fonts: { display: 'Fraunces', text: 'Inter' },
    radius: 0.5,
  },
  {
    id: 'fresh-emerald',
    vibeTags: ['fresh', 'natural', 'calm', 'organic', 'healthy', 'optimistic'],
    nicheTags: ['health', 'wellness', 'fitness', 'sustainability', 'environment', 'food', 'outdoors'],
    palette: { primary: '#059669', neutral: 'gray' },
    fonts: { display: 'Plus Jakarta Sans', text: 'Inter' },
    radius: 0.75,
  },
  {
    id: 'bold-crimson',
    vibeTags: ['bold', 'energetic', 'confident', 'vibrant', 'striking', 'dynamic'],
    nicheTags: ['sports', 'entertainment', 'gaming', 'events', 'agency', 'marketing'],
    palette: { primary: '#dc2626', neutral: 'neutral' },
    fonts: { display: 'Sora', text: 'Inter' },
    radius: 0.5,
  },
  {
    id: 'finance-navy',
    vibeTags: ['serious', 'authoritative', 'stable', 'premium', 'corporate', 'institutional'],
    nicheTags: ['finance', 'fintech', 'banking', 'legal', 'insurance', 'consulting', 'enterprise'],
    palette: { primary: '#1d4ed8', neutral: 'slate' },
    fonts: { display: 'Newsreader', text: 'Inter' },
    radius: 0.375,
  },
  {
    id: 'luxe-violet',
    vibeTags: ['luxury', 'creative', 'premium', 'expressive', 'artistic', 'distinctive'],
    nicheTags: ['fashion', 'beauty', 'design', 'art', 'creative', 'agency', 'portfolio'],
    palette: { primary: '#7c3aed', neutral: 'zinc' },
    fonts: { display: 'Sora', text: 'Inter' },
    radius: 1.0,
  },
  {
    id: 'coastal-teal',
    vibeTags: ['calm', 'friendly', 'approachable', 'fresh', 'modern', 'trustworthy'],
    nicheTags: ['travel', 'hospitality', 'realestate', 'healthcare', 'community', 'nonprofit'],
    palette: { primary: '#0d9488', neutral: 'slate' },
    fonts: { display: 'Plus Jakarta Sans', text: 'Inter' },
    radius: 0.75,
  },
  {
    id: 'sunset-amber',
    vibeTags: ['warm', 'friendly', 'inviting', 'optimistic', 'playful', 'energetic'],
    nicheTags: ['food', 'restaurant', 'coffee', 'retail', 'ecommerce', 'local', 'hospitality'],
    palette: { primary: '#ea580c', neutral: 'stone' },
    fonts: { display: 'Fraunces', text: 'Inter' },
    radius: 0.875,
  },
  {
    id: 'mono-graphite',
    vibeTags: ['minimal', 'monochrome', 'understated', 'editorial', 'refined', 'clean'],
    nicheTags: ['portfolio', 'design', 'architecture', 'photography', 'studio', 'agency'],
    palette: { primary: '#27272a', neutral: 'zinc' },
    fonts: { display: 'Space Grotesk', text: 'Inter' },
    radius: 0.25,
  },
  {
    id: 'rose-boutique',
    vibeTags: ['elegant', 'soft', 'feminine', 'boutique', 'warm', 'refined'],
    nicheTags: ['beauty', 'wedding', 'fashion', 'lifestyle', 'wellness', 'events', 'retail'],
    palette: { primary: '#e11d48', neutral: 'stone' },
    fonts: { display: 'Newsreader', text: 'Inter' },
    radius: 0.625,
  },
  {
    id: 'cyber-sky',
    vibeTags: ['modern', 'techy', 'innovative', 'bright', 'energetic', 'futuristic'],
    nicheTags: ['saas', 'ai', 'technology', 'developer', 'data', 'cloud', 'startup'],
    palette: { primary: '#0284c7', neutral: 'slate' },
    fonts: { display: 'Sora', text: 'Inter' },
    radius: 0.625,
  },
] as const

/** The fallback preset id when nothing matches (the default indigo theme). */
export const DEFAULT_PRESET_ID = 'indigo-modern'
