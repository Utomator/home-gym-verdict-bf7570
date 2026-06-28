# DESIGN.md — Home Gym Verdict  ·  binding design source of truth
<!-- DESIGN.md ≡ MASTER.md (spec §5.1). Re-read this file before building EVERY page and before
     generating ANY image. The brand-floor tokens in src/site.config.ts are a STARTING POINT you
     are EXPECTED to override — shipping the template unchanged is a FAILURE. -->

## 0. Identity
- Site: Home Gym Verdict  (home-gym-verdict-bf7570)
- Archetype: affiliate
- Niche: home gym equipment reviews for small apartments  ·  Audience: Urban apartment dwellers and small-space inhabitants, typically aged 25-45, who are health-conscious, budget-aware, and committed to fitness but constrained by limited living space.
- One-line concept: Home Gym Verdict is the definitive guide for urban dwellers seeking to maximize their fitness in minimal space, offering honest, in-depth reviews of compact home gym equipment.
- Positioning (why us, not them): We cut through the marketing fluff with rigorous, space-conscious evaluations, providing actionable insights specifically for small apartment living, unlike general review sites.

## 1. Voice & tone (from approved branding)
- Display name: Home Gym Verdict
- Tagline: Small Space. Big Strength. Honest Reviews.
- Persona: The knowledgeable, slightly gritty, and honest fitness friend who helps you find the best gear without wasting your space or money.
- Tone keywords: Authentic, Concise, Empathetic, Authoritative, Practical, Encouraging
- Voice summary: Direct, no-nonsense, and highly informative, with a friendly, approachable tone that speaks from experience and empathy for small-space challenges.

## 2. Design direction (the look — NOT the generic template theme)
- Vibe: efficient, sturdy, no-nonsense, resourceful
- Mood: authoritative, practical, empowering, trustworthy
- Chosen style: Anti-Polish / Raw Aesthetic
- Density: balanced
- Reference notes: Layouts with visible, slightly skewed grid lines; review scores presented with hand-drawn circle fills; subtle, quick micro-interactions on CTA buttons mimicking a 'stamp' or 'seal' of approval.

## 3. Color system (apply as semantic CSS vars in globals.css — NOT raw hex in components)
| token | value | usage |
|-------|-------|-------|
| --primary | #1e40af | brand actions, links, emphasis |
| --secondary / --accent | #ea580c | secondary highlights |
| --neutral | #EFF6FF | surfaces, borders, muted text |
- The template default indigo `#4f46e5` MUST be gone from globals.css after your edits.

## 4. Typography
- Display font: Architects Daughter
- Text font: Annie Use Your Telescope
- Base 16px; deliberate type scale and heading treatment (not the default).

## 5. Layout & section order (homepage)
hero → trust-bar → value-props → recommended-products → comparison-data → guide-grid → FAQ → CTA
- Do NOT ship the template's default section order.

## 6. Components to differentiate (NOT template defaults)
- Hero: bespoke, art-directed, on-brand — the single strongest first impression.
- Cards / roundup / product blocks: restyled to the brand, not default shadcn.
- Buttons / CTAs, radius 0.25rem, shadows, motion: deliberate and cohesive.

## 7. ART DIRECTION & MEDIA (the media contract — every generated image must follow this)
- Image style token block (prepended to every generate_image prompt):
  > On-brand art direction for Home Gym Verdict (home gym equipment reviews for small apartments). Visual mood: authoritative, practical, empowering, trustworthy. Style: Anti-Polish / Raw Aesthetic. Color grade aligned to primary #1e40af and accent #ea580c. Composition density: balanced. Avoid: Slick, glossy gradients or over-polished 3D elements; Generic stock photography of large, pristine gyms; Flimsy or delicate font pairings; Excessive whitespace that feels empty, not intentional. Cohesive, editorial, premium; consistent lighting and palette across every asset; no generic stock look, no clip-art, no template filler.
- Illustration / photography direction: authoritative, practical, empowering, trustworthy
- Per-purpose guidance: hero = wide, art-directed, on-brand scene; product = clean, consistent
  lighting/background; inline = supportive editorial imagery; icon/illustration = one cohesive set.
- Avoid: Slick, glossy gradients or over-polished 3D elements, Generic stock photography of large, pristine gyms, Flimsy or delicate font pairings, Excessive whitespace that feels empty, not intentional, Animations that feel slow or purely decorative.
- The machine-readable companion is `art-direction.json` next to this file; the platform feeds
  its `image_style_token_block` into the image generator so media stays on-brand.

## 8. Anti-patterns to AVOID
- Slick, glossy gradients or over-polished 3D elements
- Generic stock photography of large, pristine gyms
- Flimsy or delicate font pairings
- Excessive whitespace that feels empty, not intentional
- Animations that feel slow or purely decorative

## 9. Acceptance contract (what proves this DESIGN was applied)
- `src/app/globals.css` semantic tokens reflect §3 (the default indigo `#4f46e5` is gone).
- At least 2 components in `src/components/**` restyled per §6.
- Homepage composition matches §5 (not the template's default order).
- `pnpm exec tsc --noEmit` and `pnpm build` pass.
