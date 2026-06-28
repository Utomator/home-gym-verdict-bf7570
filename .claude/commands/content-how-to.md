# /content-how-to — author a `how-to` page (affiliate)

Author ONE on-recipe `how-to` page for this affiliate site, following the scaffold below exactly. Use the canonical `category_slug` from the platform claim step verbatim. Read DESIGN.md first; match the site's design language.

> Selection recipe: this archetype plans ~2 `how-to` page(s).

```
CONTENT SCAFFOLD — page_type: how-to (How-to / instructions); search intent: informational.
  STRUCTURE (ordered sections):
    1. H1 'How to [task]' (natural-language query)
    2. Answer-first capsule: the task + time/difficulty/prereqs
    3. Key takeaways / TL;DR steps
    4. Prerequisites / what you need
    5. Numbered steps, each with an annotated screenshot of the exact UI control
    6. Troubleshooting / common errors
    7. Alternative methods
    8. FAQ
    9. Author byline + 'last verified' date
  REQUIRED CONTENT BLOCKS:
    - NUMBERED STEPS: give an ordered, numbered step list — each step an action-verb heading + a concise instruction; list required tools/time/materials up front. Keep all instructions in text (SSR-readable).
    - FAQ / Q&A: add a FAQ section of direct question + self-contained 40-80 word answer pairs (verbatim people-also-ask phrasing where available); no 'as mentioned above'.
    - ANSWER-FIRST CAPSULE: lead the page (and every H2/H3 phrased as the implied question) with a self-contained 40-80 word direct answer, then expand with proof/list/table. Wire the top capsule into answer_summary (rendered as the lede + og:description).
    - KEY TAKEAWAYS: produce 3-5 scannable key_takeaways and present them as a visible bullet block near the top (not just metadata) — this is the highest-leverage AEO fix.
    - AUTHOR E-E-A-T: include a named author byline linking to the author/profile page; surface honest datePublished/dateModified; disclose AI-assisted production where relevant. Trust is the top E-E-A-T element.
    - INTERNAL LINKS: use real <a href> links with descriptive anchor text (never 'click here'); link up to the relevant pillar/hub and across to related pages so nothing orphans.
    - IMAGE CUES: include real, optimized imagery with descriptive, keyword-rich alt text and descriptive filenames, placed near the relevant text; keep concrete numbers in TEXT, not baked into images. A visual roughly every 300-700 words.
    - SNIPPABILITY: short paragraphs, bulleted/numbered lists, descriptive subheads, one topic per section; keep all important content in served HTML text (no key facts trapped in images/JS).
    - FRESHNESS: set datePublished, and dateModified only on substantial change (never fake-redate); surface current-year stats and visible dates.
    - SCREENSHOT EVIDENCE: capture annotated, first-hand screenshots of the real, public UI as experience proof (numbered step badges + one consistent arrow color, no UI occlusion), with descriptive alt text + a caption, placed immediately adjacent to the step/claim it proves.
    - MONETIZATION COMPLIANCE: put rel='sponsored' on every affiliate/paid link AND a conspicuous, in-body FTC affiliate disclosure ABOVE the first affiliate link (never footer/About-only), in the content's language. Add original per-item analysis (no thin-affiliate merchant copy).
  SCHEMA (JSON-LD @types, must MATCH visible text): HowTo, BlogPosting, ProfilePage, BreadcrumbList, ImageObject.
  FLAGS: monetized=yes; screenshots=required (first-hand evidence).
```
