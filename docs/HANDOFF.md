# Project51 Marketing Site — Implementation Handoff

This document is the end-of-implementation handoff for the Project51 marketing site. Spec: [`docs/superpowers/specs/2026-05-03-project51-marketing-stack-design.md`](superpowers/specs/2026-05-03-project51-marketing-stack-design.md). Plan: [`docs/superpowers/plans/2026-05-03-project51-marketing-stack.md`](superpowers/plans/2026-05-03-project51-marketing-stack.md).

## Status

| Phase | What | Status |
|---|---|---|
| A | Project scaffold (Next 16 + TS strict + Tailwind v4 + Biome + Pino + Vitest + Lefthook + Zod env) | Done |
| B | Payload v3 + Neon + admin boot, Users/Media collections, initial migration | Done |
| C | AEO field group, 7 content collections, 2 globals, second migration | Done |
| D | Marketing routes (placeholder design): blog, case-studies, services, contact, pages catchall | Done |
| E | SEO/AEO infrastructure: robots, sitemap, RSS, JSON-LD, IndexNow | Done |
| F | AI agent surface: middleware, /md/**, llms.txt, well-known, MCP server, agent-skills | Done |
| G | Webhooks (Calendly inbound, Slack outbound) + contact form server action | Done |
| H | CI/CD: GitHub Actions (CI, IndexNow), Lefthook, Playwright scaffold | Done |
| I | Railway deploy artifacts (railway.toml + DEPLOY.md runbook) | Code complete; deploy is owner-driven (token + provisioning) |
| J | Soft-launch verification | Local equivalent done; Railway URL verification gated by Phase I |

## Test surface

40/40 vitest passing across 13 test files. TDD-required units (per spec §11):

- env Zod schema (5 tests)
- Content-Signal renderer (3)
- Sitemap XML builder (3)
- RSS feed builder (2)
- JSON-LD generators (7)
- Lexical → markdown serializer (4)
- Calendly HMAC verifier (5)
- Five MCP tools (8)
- Contact form server action (3, integration)

Playwright e2e specs are checked in but `workflow_dispatch` only — wire them after Phase I provides a Railway preview URL.

## Verified routes (against `pnpm dev` on localhost)

```
Marketing             /, /blog, /case-studies, /services, /contact          200
SEO surface           /robots.txt, /sitemap.xml, /feed.xml, /llms.txt,
                      /llms-full.txt                                        200
Well-known            /.well-known/api-catalog (linkset+json),
                      /.well-known/mcp/server-card.json,
                      /.well-known/agent-skills/index.json                  200
Payload admin/API     /admin, /api/health, /api/openapi.json,
                      /api/users (403 anon — auth-gated as designed),
                      /api/users/me (200 with {user:null} anon)             OK
Webhooks              POST /webhooks/calendly (503 if no secret configured),
                      POST /webhooks/slack (200 stub)                       OK
MCP                   POST /mcp tools/list → 5 tools by name,
                      tools/call get_services → []                          OK
Content negotiation   GET / Accept: text/markdown → frontmatter + body,
                      content-type: text/markdown                           OK
/md gate              GET /md (no Accept header) → 404                      OK
Link header           </.well-known/api-catalog>, .../mcp/server-card.json,
                      </llms.txt>                                           Set
```

## Known issues (non-blocking)

1. **Vary: Accept gets overwritten by Next 16.** The middleware (`src/proxy.ts`) sets `Vary: Accept` so caches don't serve HTML to agents asking for markdown. Next 16 overrides it with its own router-state Vary value on Server Component responses. Functional content negotiation works fine (the rewrite to `/md/**` happens before render); cache correctness is degraded. Phase-2 fix: set `Vary: Accept` from the route handler / page response itself, or wrap the rewrite to manipulate the response after render.
2. **Sharp not enabled.** `payload.config.ts` has `sharp: undefined`. Image-size variants (thumbnail, card, feature) on Media uploads are silently skipped. To enable: add `"pnpm": { "onlyBuiltDependencies": ["sharp"] }` to `package.json`, run `pnpm install`, import `sharp` in payload.config.ts, replace `sharp: undefined` with `sharp,`. Defer until image quality on-page matters.
3. **Stray workspace lockfile.** `C:\Users\space\package-lock.json` (outside the project) confuses Turbopack's workspace-root detection. Either delete that file or set `turbopack.root = __dirname` in `next.config.ts`. Cosmetic.
4. **`useFormState`/`useActionState`.** Contact form uses React 19's `useActionState` (correct for the installed React). React 18 projects use `useFormState`; flagging for completeness.
5. **`pg-connection-string` deprecation warning.** Migrations print a warning that `sslmode=require/prefer/verify-ca` will change semantics in `pg` v9. Pin or update the dep when bumping `pg`.

## What's deferred (per spec §12 / §15)

- **WebMCP** (`navigator.modelContext.provideContext()`) — Tier 3, Chrome-experimental.
- **Per-PR Neon branching** — single shared preview branch is fine at MVP traffic.
- **Cloudflare R2** (storage adapter) — explicitly dropped per the user's storage decision (spec §15.1). Media is local-FS; production durability requires a Railway persistent volume.
- **MCP tool expansion** beyond the initial five.
- **OpenAPI auto-gen** — current `/api/openapi.json` is a hand-written stub.
- **Animation library / 3D library finalization** — design-phase decisions.
- **Cloudflare DNS+CDN front** — add at or after the project51.ai cutover.
- **Email transactional service** — out of scope.
- **Sentry wiring** — `SENTRY_DSN` env var is wired but the SDK install is deferred until Phase I provisions production.
- **Visual regression / 3D / admin-UI tests** — explicitly out of test scope.

## Next steps (owner-driven)

1. **Deploy to Railway.** Follow [`docs/DEPLOY.md`](DEPLOY.md). Needs a Railway token; `railway up` from this repo's root will provision and ship.
2. **Create the first admin user** in `/admin` on the Railway temp domain.
3. **Author content** through the admin: at least one BlogPost, CaseStudy, Service, and Page. The marketing routes will pick them up automatically.
4. **(Optional)** Mount a Railway persistent volume at `./media` so admin uploads survive redeploys.
5. **(Optional)** Set `CALENDLY_WEBHOOK_SECRET`, `SLACK_WEBHOOK_URL`, `INDEXNOW_KEY`, `SENTRY_DSN` in Railway as you bring those integrations online — every code path that uses them degrades silently when unset.
6. **DNS cutover to `project51.ai`** when ready (spec §10 / DEPLOY.md "Domain cutover" section). Flip `SITE_INDEXABLE=true` at the same time.
7. **Activate the e2e workflow** by changing `.github/workflows/e2e.yml`'s `on:` trigger and pointing `E2E_BASE_URL` at a Railway preview output.
8. **Design + content phase.** Everything above is structural; the visual treatment, copy, and 3D/animation choices are deliberately out of scope for this implementation pass.

## File structure (post-implementation)

```
project51-web/
├─ .github/workflows/{ci,e2e,indexnow}.yml
├─ docs/
│  ├─ DEPLOY.md
│  ├─ HANDOFF.md (this file)
│  └─ superpowers/
│     ├─ plans/2026-05-03-project51-marketing-stack.md
│     └─ specs/2026-05-03-project51-marketing-stack-design.md
├─ public/
│  └─ ai.txt
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/{blog,case-studies,services,contact,[slug]}/...
│  │  ├─ (payload)/{admin,api}/...
│  │  ├─ md/{home, blog/[slug], case-studies/[slug], services/[slug], contact, [slug]}
│  │  ├─ .well-known/{api-catalog, mcp/server-card.json, agent-skills/index.json, indexnow/[key]}
│  │  ├─ webhooks/{calendly, slack}
│  │  ├─ api/{health, openapi.json}
│  │  ├─ {sitemap.xml, robots.txt, feed.xml, llms.txt, llms-full.txt}/route.ts
│  │  ├─ mcp/route.ts
│  │  └─ layout.tsx (root: Org+WebSite JSON-LD)
│  ├─ collections/{Users, Media, People, BlogPosts, CaseStudies, Services, Pages, Submissions, WebhookEvents}
│  ├─ collections/_shared/aeo-fields.ts
│  ├─ globals/{SiteSettings, Navigation}
│  ├─ components/marketing/{Header, Footer, RichText, JsonLd}
│  ├─ lib/
│  │  ├─ env.ts (zod)
│  │  ├─ logger.ts (pino)
│  │  ├─ access.ts (Payload Access helpers)
│  │  ├─ payload.ts (memoised getPayloadClient)
│  │  ├─ slack.ts
│  │  ├─ indexnow.ts
│  │  ├─ seo/{json-ld, sitemap, feed, content-signals}.ts
│  │  ├─ markdown/{payload-to-md, lookups}.ts
│  │  ├─ webhooks/calendly-hmac.ts
│  │  └─ mcp/{server.ts, tools/{search-blog-posts, list-case-studies, get-services, get-organization-info, book-discovery-call, types, index}.ts}
│  ├─ hooks/revalidate-after-change.ts (afterChange + revalidateTag + IndexNow)
│  ├─ proxy.ts (was middleware.ts; renamed for Next 16)
│  ├─ payload.config.ts
│  └─ migrations/...
├─ tests/
│  ├─ unit/{env, content-signals, sitemap, feed, json-ld, calendly-hmac, payload-to-md}.test.ts
│  ├─ unit/mcp/{search-blog-posts, list-case-studies, get-services, get-organization-info, book-discovery-call}.test.ts
│  ├─ integration/contact-action.test.ts
│  └─ e2e/{seo, mcp, contact}.spec.ts
├─ railway.toml
├─ playwright.config.ts
├─ vitest.config.ts
├─ biome.json
├─ lefthook.yml
├─ next.config.ts
├─ tsconfig.json
├─ package.json
├─ pnpm-lock.yaml
├─ .env.example
├─ .gitignore
├─ .editorconfig
├─ .nvmrc
└─ README.md
```

## Final commit graph

Run `git log --oneline` for the full history. ~40 commits, clean per-task atomicity, all signed by `Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
