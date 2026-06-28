# Payload Website Template

A generic Payload v3 + Next.js 16 marketing-site template. Each website provisioned by
the platform is materialized from this template into its own workspace folder, then wired
to its own Neon Postgres DB, Cloudflare R2 media bucket, and Vercel deployment.

Branding (organization name, tagline, colors, content) is **data-driven**: it lives in the
Payload `site-settings` global and the collections, not hardcoded in the source. The
`organization.name` default is set per-website at materialization time; everything else is
edited in the admin or produced by the publish loop.

## Local development

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill values
3. `pnpm payload migrate` (first time)
4. `pnpm dev` → http://localhost:3000

## Stack

Next.js 16 · Payload v3 · Postgres (Neon) · Cloudflare R2 · Vercel · Tailwind v4 · TypeScript strict.

## Media (Cloudflare R2)

Media is served from R2 over a CDN URL when `R2_BUCKET` + the `R2_*` env vars are set;
otherwise it falls back to local disk (local dev / tests). See `docs/R2-MEDIA.md`.

## Authoring MCP

`POST /mcp/authoring` is a fail-closed, bearer-gated MCP endpoint used by the platform's
publish loop to create blog posts. It requires `SITE_AUTHORING_TOKEN`; the public `/mcp`
endpoint stays unauthenticated and read-only.
