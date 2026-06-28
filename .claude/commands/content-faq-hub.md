# /content-faq-hub — author a `faq-hub` page (affiliate)

Author ONE on-recipe `faq-hub` page for this affiliate site, following the scaffold below exactly. Use the canonical `category_slug` from the platform claim step verbatim. Read DESIGN.md first; match the site's design language.

> Selection recipe: this archetype plans ~1 `faq-hub` page(s).

```
CONTENT SCAFFOLD — page_type: faq-hub (FAQ hub); search intent: informational.
  STRUCTURE (ordered sections):
    1. H1 '[Topic] FAQ: [N] questions answered'
    2. Answer-first capsule / how to use this hub
    3. Grouped questions by sub-theme
    4. Each Q as a question-shaped heading + 40-80w self-contained answer + 'learn more' link
    5. Key takeaways of the most-asked
    6. Still-have-questions CTA
    7. Author/reviewed-by byline
    8. Honest last-updated
  REQUIRED CONTENT BLOCKS:
    - FAQ / Q&A: add a FAQ section of direct question + self-contained 40-80 word answer pairs (verbatim people-also-ask phrasing where available); no 'as mentioned above'.
    - CALL TO ACTION: end with a clear, on-brand call to action appropriate to the page's intent.
    - ANSWER-FIRST CAPSULE: lead the page (and every H2/H3 phrased as the implied question) with a self-contained 40-80 word direct answer, then expand with proof/list/table. Wire the top capsule into answer_summary (rendered as the lede + og:description).
    - KEY TAKEAWAYS: produce 3-5 scannable key_takeaways and present them as a visible bullet block near the top (not just metadata) — this is the highest-leverage AEO fix.
    - AUTHOR E-E-A-T: include a named author byline linking to the author/profile page; surface honest datePublished/dateModified; disclose AI-assisted production where relevant. Trust is the top E-E-A-T element.
    - INTERNAL LINKS: use real <a href> links with descriptive anchor text (never 'click here'); link up to the relevant pillar/hub and across to related pages so nothing orphans.
    - IMAGE CUES: include real, optimized imagery with descriptive, keyword-rich alt text and descriptive filenames, placed near the relevant text; keep concrete numbers in TEXT, not baked into images. A visual roughly every 300-700 words.
    - SNIPPABILITY: short paragraphs, bulleted/numbered lists, descriptive subheads, one topic per section; keep all important content in served HTML text (no key facts trapped in images/JS).
    - FRESHNESS: set datePublished, and dateModified only on substantial change (never fake-redate); surface current-year stats and visible dates.
  SCHEMA (JSON-LD @types, must MATCH visible text): FAQPage, BreadcrumbList, ProfilePage.
  FLAGS: monetized=no.
```
