/**
 * SITE BRIEF — generated per-site by the provisioner (do not edit by hand).
 *
 * Self-contained: re-declares the SiteBrief / Brand types so it type-checks
 * standalone (this is the leaf module that DEFINES them). The provisioner
 * resolves the brand to a plain literal at provision time — no imports.
 */

export type SiteArchetype = 'affiliate' | 'leadgen' | 'landing'

export type SocialLink = {
  platform: string
  url: string
}

export type BusinessBrief = {
  name: string
  tagline?: string
  phone?: string
  whatsapp?: string
  email?: string
  location?: string
  socials?: SocialLink[]
}

export type LandingBrief = {
  headline: string
  subhead: string
  cta: string
  sections?: string[]
}

export type NeutralFamily = 'zinc' | 'slate' | 'stone' | 'gray' | 'neutral'

export type Brand = {
  palette: {
    primary: string
    primaryForeground?: string
    neutral?: NeutralFamily
  }
  fonts?: {
    display: string
    text: string
  }
  radius?: number
}

export type SiteBrief = {
  archetype: SiteArchetype
  business: BusinessBrief
  landing?: LandingBrief
  brand?: Brand
}

/**
 * Brand FLOOR aligned to DESIGN.md (binding source of truth).
 *
 * The (marketing) layout re-emits these as :root token overrides at runtime via
 * brandStyle(), so they win over globals.css for the standard shadcn tokens —
 * primary, the neutral ramp, radius. The orange "seal" accent (#ea580c) and the
 * raw-aesthetic decorative tokens are NOT expressible here, so they live under
 * custom names in globals.css (which brandStyle never overrides). Fonts are wired
 * with next/font in (marketing)/layout.tsx, so `fonts` is intentionally omitted
 * (setting it would make brandStyle fight next/font for --font-sans/--font-display).
 */
const siteConfig: SiteBrief = {
  archetype: 'affiliate',
  business: {
    name: 'Home Gym Verdict',
    tagline: 'Small Space. Big Strength. Honest Reviews.',
  },
  brand: {
    palette: {
      primary: '#1e40af', // DESIGN §3 — deep brand blue (replaces template indigo)
      primaryForeground: '#ffffff',
      neutral: 'slate', // cool, sturdy ink ramp (slate-900 #0f172a == --ink)
    },
    radius: 0.25, // DESIGN §6 — tight, no-nonsense corners
  },
}

export default siteConfig
