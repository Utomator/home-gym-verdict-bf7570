#!/usr/bin/env node
// Purity guard for @p51/engine.
//
// Fails if any source file RUNTIME-imports a forbidden module. The engine must be
// framework-agnostic so it can be consumed by apps other than the affiliate site.
// `import type ...` is allowed (erased at build time, no runtime coupling) and is
// skipped here.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = join(dirname(fileURLToPath(import.meta.url)), 'src')

// A bare/scoped specifier is forbidden if it equals, or is a subpath of, one of these.
const FORBIDDEN = ['payload', '@payloadcms', 'next', '@/']

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (entry.endsWith('.ts')) out.push(full)
  }
  return out
}

const violations = []
// Match `import ...` / `export ... from '...'` but NOT `import type` / `export type`.
const importRe = /^\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm

for (const file of walk(srcDir)) {
  const code = readFileSync(file, 'utf8')
  let m
  while ((m = importRe.exec(code)) !== null) {
    const spec = m[1]
    const forbidden = FORBIDDEN.some(
      (p) => (p === '@/' ? spec.startsWith('@/') : spec === p || spec.startsWith(`${p}/`)),
    )
    if (forbidden) violations.push({ file, spec })
  }
}

if (violations.length > 0) {
  console.error('@p51/engine purity check FAILED — forbidden runtime imports:')
  for (const v of violations) console.error(`  ${v.file}: import from "${v.spec}"`)
  console.error('\nUse `import type` for framework types, or remove the dependency.')
  process.exit(1)
}

console.log('@p51/engine purity check passed — no forbidden runtime imports.')
