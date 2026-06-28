# Workspace folder contract (project51)

This folder doubles as the **per-website workspace** that a spawned Claude Code process
inhabits (`cwd`) during a `website.claude_publish` run. Two machine-read files at the
folder root define the contract. See the platform specs:

- `platform_code/docs/superpowers/specs/2026-06-20-vertical-slice-design.md`
- `platform_code/docs/superpowers/specs/2026-06-20-contracts.md` (§5.1, §5.2 — authoritative)

## `website.json` — identity + wiring

```jsonc
{
  "website_id":       "uuid",   // platform-side id for this website
  "profile_id":       "uuid",   // -> get_branding(profile_id) (GROUND)
  "platform_url":     "uri",    // platform REST base
  "platform_mcp_url": "uri",    // Platform MCP (streamable HTTP) — GROUND + REGISTER
  "site_mcp_url":     "uri",    // Website authoring MCP — ACT (create_blog_post)
  "slug":             "string"  // "project51"
}
```

The committed values are **documented placeholders** (`website_id` /`profile_id` are
zero-prefixed UUIDs; URLs are `*.example`). The operator replaces them with the real
platform-issued ids and deployed URLs before a real run. `additionalProperties: false`.

## `.mcp.json` — MCP client config for the spawned Claude

Passed to `claude --mcp-config .mcp.json`. Wires the **two** MCP servers the agent uses:

```jsonc
{
  "mcpServers": {
    "platform": {                        // GROUND + REGISTER
      "type": "http",
      "url": "https://platform.example/mcp",
      "headers": { "X-API-Key": "${PLATFORM_API_KEY}" }
    },
    "site": {                            // ACT
      "type": "http",
      "url": "https://project51.example/mcp/authoring",
      "headers": { "Authorization": "Bearer ${SITE_AUTHORING_TOKEN}" }
    }
  }
}
```

**Secrets are never hard-coded here.** The `${PLATFORM_API_KEY}` and
`${SITE_AUTHORING_TOKEN}` references are expanded from the spawned process's environment,
which the platform spawn handler (`child_env(website)`) populates. The file is therefore
safe to commit. Update the `url`s to the real platform + site URLs (they should match
`platform_mcp_url` / `site_mcp_url` in `website.json`).

Resulting tool names the agent sees (and that `--allowedTools` references):

- `mcp__platform__get_branding`
- `mcp__platform__register_published_action`
- `mcp__site__create_blog_post`

## The loop (this folder's role)

1. **GROUND** — agent calls `mcp__platform__get_branding(profile_id)`.
2. **PRODUCE** — agent writes the post body in Markdown (grounded).
3. **ACT** — agent calls `mcp__site__create_blog_post(...)` → the authoring MCP in THIS
   repo (`src/app/mcp/authoring/route.ts`) converts Markdown→Lexical and creates the
   `blog-posts` doc. Returns `{ id, url, status }`.
4. **REGISTER** — agent calls `mcp__platform__register_published_action(...)`.
