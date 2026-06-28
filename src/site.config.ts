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

const siteConfig: SiteBrief = {
  archetype: 'affiliate',
  business: { name: 'Home Gym Verdict' },
}

export default siteConfig
