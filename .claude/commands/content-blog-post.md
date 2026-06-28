# /content-blog-post — author a `blog_post` page (affiliate)

Author ONE on-recipe `blog_post` page for this affiliate site, following the scaffold below exactly. Use the canonical `category_slug` from the platform claim step verbatim. Read DESIGN.md first; match the site's design language.

> Selection recipe: this archetype plans ~6 `blog_post` page(s).

```
CONTENT SCAFFOLD — page_type: guide (In-depth guide / definitive guide); search intent: informational.
  STRUCTURE (ordered sections):
    1. H1 '[Topic]: the complete guide (2026)'
    2. Answer-first capsule defining the topic + scope
    3. Sticky table of contents (jump links)
    4. Key takeaways
    5. Sequential chaptered sections, each a self-contained answer capsule
    6. Diagrams/data per chapter
    7. Examples / case snippets
    8. Comparison tables where choices exist
    9. Expert quotes + cited statistics throughout
    10. FAQ
    11. Further-reading internal links to spokes
    12. Author byline + reviewed-by
    13. Honest last-updated
  REQUIRED CONTENT BLOCKS:
    - EVIDENCE + QUOTATIONS: back key factual claims with a concrete statistic (with year) + an outbound link to a REAL authoritative source, and include expert quotations — citing sources, adding statistics, and adding quotations are the top-3 AI-visibility levers.
    - CITATIONS / PROVENANCE: every key claim carries a concrete stat (with year) and a link to a REAL source — never a hallucinated URL.
    - FAQ / Q&A: add a FAQ section of direct question + self-contained 40-80 word answer pairs (verbatim people-also-ask phrasing where available); no 'as mentioned above'.
    - ANSWER-FIRST CAPSULE: lead the page (and every H2/H3 phrased as the implied question) with a self-contained 40-80 word direct answer, then expand with proof/list/table. Wire the top capsule into answer_summary (rendered as the lede + og:description).
    - KEY TAKEAWAYS: produce 3-5 scannable key_takeaways and present them as a visible bullet block near the top (not just metadata) — this is the highest-leverage AEO fix.
    - AUTHOR E-E-A-T: include a named author byline linking to the author/profile page; surface honest datePublished/dateModified; disclose AI-assisted production where relevant. Trust is the top E-E-A-T element.
    - INTERNAL LINKS: use real <a href> links with descriptive anchor text (never 'click here'); link up to the relevant pillar/hub and across to related pages so nothing orphans.
    - IMAGE CUES: include real, optimized imagery with descriptive, keyword-rich alt text and descriptive filenames, placed near the relevant text; keep concrete numbers in TEXT, not baked into images. A visual roughly every 300-700 words.
    - SNIPPABILITY: short paragraphs, bulleted/numbered lists, descriptive subheads, one topic per section; keep all important content in served HTML text (no key facts trapped in images/JS).
    - FRESHNESS: set datePublished, and dateModified only on substantial change (never fake-redate); surface current-year stats and visible dates.
    - MONETIZATION COMPLIANCE: put rel='sponsored' on every affiliate/paid link AND a conspicuous, in-body FTC affiliate disclosure ABOVE the first affiliate link (never footer/About-only), in the content's language. Add original per-item analysis (no thin-affiliate merchant copy).
  SCHEMA (JSON-LD @types, must MATCH visible text): BlogPosting, ProfilePage, BreadcrumbList, FAQPage, ImageObject.
  FLAGS: monetized=yes.
```
