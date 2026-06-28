# project51 SEO Baseline — Implementation Plan

> **For agentic workers:** implement task-by-task; each task ends with a typecheck + commit. Steps use `- [ ]`.

**Goal:** Turn the project51 base template into a maximally-SEO'd baseline (audit 72→95+) so every deployed site inherits a perfect, high-ranking, AI-citable foundation — *before* we layer on the design system + brand-asset generation.

**Architecture:** Payload v3 collections/globals feed Next.js 16 App-Router routes. SEO lives in: `src/lib/seo/json-ld.ts` (schema), each route's `generateMetadata()` (meta/OG/canonical), `src/globals/SiteSettings.ts` (config), `src/lib/seo/{sitemap,feed}.ts`, `src/app/robots.ts`. We add small shared helpers + components and wire them everywhere, keeping changes additive and design-independent (so the design phase won't collide).

**Tech Stack:** Next.js 16 (App Router, RSC), Payload 3.85, TypeScript, Tailwind, schema-dts, next/image, next/og.

## Global Constraints
- TypeScript strict; reuse the existing `Concrete<T>`/`ctx<T>` schema helpers — never hand-roll `@context`.
- Every metadata change must be applied to ALL doc routes consistently: `blog/[slug]`, `services/[slug]`, `case-studies/[slug]`, `(marketing)/[slug]` (pages), AND the index pages `blog`, `services`, `case-studies`, `contact`, and the homepage (`(marketing)/layout.tsx` or `page.tsx`).
- `metadataBase` is already set → emit RELATIVE canonical/og paths (they resolve absolute). Images for OG must be ABSOLUTE.
- Structured data MUST match visible text. Don't promise FAQ/HowTo rich results (Google retired them) — keep markup for AI parsing only.
- Verify after each group: `pnpm typecheck` (or `pnpm exec tsc --noEmit`) must pass; build at the end.

---

## Coverage matrix (audit category → group that fixes it)

| Audit category (score) | Fixed in |
|---|---|
| Canonical (1/8) | A1 |
| OpenGraph/Twitter (5/10) | A2 + E (dynamic OG) |
| JSON-LD (7/12) | B1–B5 |
| Image alt & media (4/10) | A4 + E1 |
| Internal linking & breadcrumbs (7/10) | C1–C3 |
| Indexability (4/10) | D1–D2 |
| Sitemap (7/10) | D2 |
| Robots (6/8) | D1 |
| RSS (7/8) | D4 |
| Core Web Vitals (6/10) | E2–E3 |
| Mobile (8/10) | *(design phase — noted)* |
| Meta tags (8/10) | A1–A2 |
| Headings/semantics (9/10) | already strong |
| Agent/LLM SEO (9/12) | B/D3 + F |

---

## Group A — Critical quick-wins (highest ROI)

### A1. Self-referencing canonical on every route
**Files:** every `generateMetadata` (blog/services/case-studies/[slug]/page.tsx, the index pages, homepage layout).
- [ ] Add `alternates: { canonical: '/blog/' + slug }` (relative) to each doc route; index pages get their own (`'/blog'`, `'/'`).
**Why:** audit's #1 critical gap (1/8). Consolidates duplicate/param URLs.

### A2. og:image + Twitter large card + og:url/siteName/article meta
**Files:** a new helper `src/lib/seo/metadata.ts` (`buildOgImages(absUrl?)`, `resolveOgImage(doc, settings)`); wire into every `generateMetadata`.
- [ ] Resolve image = absolute heroImage ?? `settings.defaultMeta.image` ?? a default OG; set `openGraph.images:[{url,width:1200,height:630,alt}]`, `twitter:{card:'summary_large_image', images}`, `openGraph.url` (=canonical), `openGraph.siteName`, and for articles `article:{publishedTime,modifiedTime,authors,section,tags}`.
**Why:** OG 5/10 — imageless social cards halve referral CTR.

### A3. Render `keyTakeaways` as a visible block (+ optional ItemList)
**Files:** `blog/[slug]/page.tsx` (and case-studies); a `<KeyTakeaways>` component.
- [ ] Render `post.aeo.keyTakeaways` as a titled bullet list directly under `PageHeader`.
**Why:** authored-but-invisible today; #1 AEO win (snippet + AI-Overview extraction target).

### A4. Render the hero image (next/image, required alt)
**Files:** `blog/[slug]/page.tsx`, case-studies; reuse a `<Hero>`/`next/image`.
- [ ] Render `post.heroImage` as `next/image` (width/height, `priority`, alt from `media.alt`) above/under the header. Today it's fetched only for schema → zero visible imagery.
**Why:** Image 4/10; also feeds og:image.

---

## Group B — Schema enrichment (`src/lib/seo/json-ld.ts`)

### B1. `Article` → `BlogPosting` + enrich
- [ ] Add params + emit: `'@type':'BlogPosting'`, `publisher` (Organization+logo from settings), `mainEntityOfPage` (canonical), `wordCount`, `articleSection` (categories), `keywords` (tags), guarantee `image`+`author`. Keep `Article`/`CreativeWork` option for case studies.

### B2. `Organization` — add `contactPoint` + `foundingDate`
- [ ] Emit `contactPoint` (from `organization.contactPoints`) and `foundingDate` (field exists, never emitted).

### B3. `Person` / author → `ProfilePage` + sameAs
- [ ] Add `personSchema()` + author pages (Group C5) so author has an `@id` URL; link from BlogPosting.author.

### B4. Fix `WebSite.SearchAction`
- [ ] Either add a real `/search` route (D5) OR drop the action. Plan: add `/search` (value + fixes the invalid action).

### B5. `ImageObject` + `speakable` (AEO)
- [ ] Add ImageObject to BlogPosting.image (url/width/height/caption); add `speakable` cssSelector for the answer capsule.

---

## Group C — Internal linking & taxonomy

### C1. Visible breadcrumb trail
- [ ] New `<Breadcrumbs>` (ordered `<ol>` of real `<a>`), render on all deep routes from the same array passed to `breadcrumbList()`.

### C2. Category + tag archive routes
- [ ] Add `/blog/category/[slug]` + `/blog/tag/[slug]` (or `/topics/[slug]`) list routes; link from posts. (Check BlogPosts taxonomy fields first.) Revives dead taxonomy → topical clusters.

### C3. "Related / next read" block
- [ ] On each post, query 3 related (same category/tag), render links. Engagement + crawl depth.

### C4. Table of contents + jump links
- [ ] Derive H2s from body, render a sticky/inline ToC with anchor links. (Engagement + AI section targeting.)

### C5. Author pages (`/authors/[slug]`) + bylines
- [ ] Visible byline → author page (People collection) with bio + sameAs + ProfilePage schema (E-E-A-T).

---

## Group D — Indexability, crawl & feeds

### D1. Robots fixes (read `src/app/robots.ts` first)
- [ ] Keep AI-bot allowlist; ensure `/api/openapi.json` discoverable; production sites must serve a real allow (the `SITE_INDEXABLE` binary gate must be flippable per-site for prod).

### D2. Per-route indexability + gate sitemap on it
- [ ] Replace blanket noindex behavior so production is indexable; `sitemap.ts` must NOT list URLs while noindex (mixed signals today).

### D3. AEO endpoints fixes
- [ ] Fix `/md/<slug>` 404 (audit found it 404'd while llms-full worked); add `.well-known/llms.txt`.

### D4. RSS autodiscovery + completeness
- [ ] Add `<link rel="alternate" type="application/rss+xml">` in `<head>`; add `lastBuildDate` + `atom:self` to feed.xml.

### D5. `/search` route (fixes B4) + IndexNow on publish
- [ ] Minimal search page (Payload query). Confirm `.well-known/indexnow` + the indexnow workflow fire on publish/update.

---

## Group E — Image & performance (CWV)

### E1. next/image everywhere + alt enforcement in RichText
- [ ] RichText image serializer → next/image with alt; WebP/AVIF via R2/next config; explicit width/height (no CLS).

### E2. Dynamic OG image generation (next/og) — code, not AI
- [ ] `src/app/(og)/og/[...].tsx` `ImageResponse` route generating branded 1200×630 OG cards from title+brand colors. Free, on-brand, fixes "imageless" at scale (fits the media strategy).

### E3. ISR / caching (off blanket `force-dynamic`)
- [ ] Move home/blog/sitemap/feed to ISR / `revalidate` + on-demand revalidation on publish. Cuts TTFB (crawler-timeout risk) — extractability gate.

---

## Group F — AEO / answer-first rendering

### F1. Answer-capsule rendering convention
- [ ] Render `aeo.answerSummary` as a styled "quick answer" block (already the lede) + ensure `speakable` selector targets it.

### F2. Sitewide head completeness
- [ ] Ensure homepage/index `generateMetadata` exist (audit: index pages had none) with title/description/canonical/OG.

---

## Group G — Affiliate / monetization render hooks (forward-looking)

### G1. `rel="sponsored"` at the render layer + `<Disclosure>` component
- [ ] RichText link serializer marks outbound affiliate links `rel="sponsored noopener"`; a `<Disclosure>` block renderable above first affiliate link (FTC). Workers can't publish a bare affiliate `<a>`.

---

## Verification
- [ ] `pnpm install` + `pnpm typecheck` pass after each group.
- [ ] `pnpm build` passes at the end.
- [ ] Re-run the SEO audit against a fresh deploy → expect 95+, every category ≥ its target.
- [ ] Commit per task; final commit tags the baseline.

## Maximization notes (beyond the audit — the "even better")
Dynamic OG images (E2), author E-E-A-T pages (C5), ToC + related posts (C3/C4), `/search` (D5), ImageObject/speakable (B5), ISR (E3), affiliate render guards (G1), RSS autodiscovery (D4), `.well-known/llms.txt` (D3). These push past "fix the audit" into "structurally engineered to rank + be cited."
