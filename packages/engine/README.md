# @p51/engine

Framework-agnostic SEO engine extracted from the affiliate app's `src/lib/seo/*`.
Consumed by the Next app at the repo root (via `transpilePackages: ['@p51/engine']`)
and, in future, by new landing / leadgen apps. The public API is the barrel at
`src/index.ts`; import named exports from `@p51/engine`, never deep paths.

## Purity contract

This package must stay portable. It MUST NOT **runtime-import**:

- `payload` or any `@payloadcms/*` package
- `@/collections` or any app-internal `@/*` module
- `next`

**Type-only imports are allowed** (`import type { Metadata } from 'next'`) because
they are erased at compile time and create no runtime coupling. Lexical / Payload
node shapes are handled structurally (via `unknown` narrowing) precisely so the
engine never has to import Payload at runtime.

## Purity guard

`check-purity.mjs` greps every `src/**/*.ts` for a value (non-`import type`) import of
a forbidden module and exits non-zero if it finds one. Run it with:

```
node packages/engine/check-purity.mjs
```

It is intended to run in CI / pre-commit. Type-only imports (`import type ...`) are
explicitly permitted and ignored by the check.
