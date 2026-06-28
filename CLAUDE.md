# Home Gym Verdict — site build guardrails

This file is the project contract for the Claude Code session building/maintaining this site. Follow it exactly; it OVERRIDES default behavior.

## Identity
- website_id: `1c104bde-52f4-4dd7-9c17-25d1e3981cb7`
- slug: `home-gym-verdict-bf7570`
- archetype: **affiliate**
- mounted collections: pages, blog_posts, products

## Allowed authoring tools
Author site content ONLY through the site authoring MCP tools whose collection is mounted for this archetype. Do not call a tool for a collection this site does not mount.
- `mcp__site__create_page`
- `mcp__site__create_blog_post`
- `mcp__site__upsert_product`

## Design source of truth
- **DESIGN.md is the design source of truth.** Read `design-system/home-gym-verdict-bf7570/DESIGN.md` (or the DESIGN.md provided in the worktree) BEFORE editing any component, theme token, or layout, and implement what it specifies. Do not invent a design direction that contradicts it.
- The design must be a REAL, non-templated implementation: edit components, theme tokens, and homepage section order — never ship the floor template recolor.

## Categories
- Use the canonical `category_slug` returned by the platform claim/coordination step VERBATIM. Never invent, rephrase, or free-text a category — fragmented category strings break the on-site silo (RelatedPosts) and the platform pool.

## Affiliate / FTC compliance
- This is a MONETIZED affiliate site. Put `rel="sponsored nofollow"` on every affiliate/paid outbound link.
- Place a conspicuous, in-body FTC affiliate disclosure ABOVE the first affiliate link on every monetized page (never footer-only / About-only), in the content's language.
- Product recommendations are dynamic Products CMS items referenced by blog posts — do NOT build dedicated comparison/listicle/review PAGES.
- Add original, first-hand analysis (no thin merchant copy); cite real sources with a year for key claims.

## Secrets
- NEVER write secrets, tokens, or credentials into source, CLAUDE.md, or commands. Secrets are provided via environment variables and `.mcp.json` `${VAR}` references only.
