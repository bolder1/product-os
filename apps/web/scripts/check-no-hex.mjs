#!/usr/bin/env node
/**
 * R20.7 — Palette guardrail.
 *
 * Fails if raw hex color literals appear inside apps/web/app/**\/*.{ts,tsx,css}
 * outside the allowlist. Run locally or wire into pre-commit / CI.
 *
 * Usage:
 *   node apps/web/scripts/check-no-hex.mjs
 *
 * Allowlist: apps/web/.hex-allowlist.txt — one "filepath:line" marker per line,
 * plus inline `// eslint-disable-next-line no-hardcoded-hex` comments (the
 * next line is skipped regardless of what the linter infra looks like).
 *
 * Legit exceptions already carried:
 *   - apps/web/app/globals.css                  (token definitions)
 *   - apps/web/app/components/shell/user-menu.tsx (avatar identity palette)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const WEB_ROOT = join(SCRIPT_DIR, '..')
const APP_ROOT = join(WEB_ROOT, 'app')
const ALLOWLIST_FILE = join(WEB_ROOT, '.hex-allowlist.txt')

/** Files whose entire contents are exempt (the single source of truth for tokens). */
const FILE_ALLOWLIST = new Set([
  'app/globals.css',
  'app/components/shell/user-menu.tsx',
  // Brand studio seed data — literal brand palette definitions (the Brand
  // studio's whole job is to let the user edit these).
  'app/(dashboard)/[orgSlug]/[productSlug]/brand/_data/default-brand.ts',
  // Living Graph canvas — node-kind and status palettes provide visual
  // distinction at glance in dense graphs. Same rationale as user avatars.
  'app/(dashboard)/[orgSlug]/[productSlug]/graph/page.tsx',
])

/** File extensions to scan. */
const EXT = new Set(['.ts', '.tsx', '.css'])

/** The hex pattern we're hunting. */
const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g

/** Patterns on the same line that whitelist the hex (comments, URL frags, unicode HTML entities). */
const LINE_LOCAL_ALLOW = [
  /eslint-disable.*no-hardcoded-hex/,
  /&#\d+;/,               // unicode HTML entities like &#8984; — not a color
  /pattern:.*#\\/,         // regex source strings referencing hex
  /\.match\(/,             // regex .match calls scanning for hex at runtime
  /'#000000'|'#ffffff'|'#FFFFFF'/, // brand-compliance-checker's internal regex allowlist comparand
]

function loadExplicitAllowlist() {
  try {
    return new Set(
      readFileSync(ALLOWLIST_FILE, 'utf8')
        .split('\n')
        .map((l) => l.split('#')[0].trim())
        .filter(Boolean),
    )
  } catch {
    return new Set()
  }
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.turbo') continue
      walk(full, acc)
    } else if (st.isFile()) {
      const dot = entry.lastIndexOf('.')
      if (dot >= 0 && EXT.has(entry.slice(dot))) acc.push(full)
    }
  }
  return acc
}

function toRel(full) {
  return relative(WEB_ROOT, full).split(sep).join('/')
}

function main() {
  const explicit = loadExplicitAllowlist()
  const files = walk(APP_ROOT)
  const violations = []

  for (const file of files) {
    const rel = toRel(file)
    if (FILE_ALLOWLIST.has(rel)) continue

    const source = readFileSync(file, 'utf8')
    const lines = source.split('\n')
    let prevLineDisabled = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Honor "next line" disable comments
      if (prevLineDisabled) {
        prevLineDisabled = false
        continue
      }
      if (/eslint-disable-next-line.*no-hardcoded-hex/.test(line)) {
        prevLineDisabled = true
        continue
      }
      if (LINE_LOCAL_ALLOW.some((re) => re.test(line))) continue

      const matches = line.match(HEX_RE)
      if (!matches) continue

      const marker = `${rel}:${i + 1}`
      if (explicit.has(marker)) continue

      violations.push({ file: rel, line: i + 1, snippet: line.trim(), hits: matches })
    }
  }

  if (violations.length === 0) {
    console.log('✓ no-hardcoded-hex: 0 violations under apps/web/app/**')
    process.exit(0)
  }

  console.error(`✗ no-hardcoded-hex: ${violations.length} violation(s)`)
  console.error('')
  for (const v of violations.slice(0, 50)) {
    console.error(`  ${v.file}:${v.line}`)
    console.error(`    ${v.snippet}`)
    console.error(`    hits: ${v.hits.join(' ')}`)
  }
  if (violations.length > 50) {
    console.error(`  … and ${violations.length - 50} more`)
  }
  console.error('')
  console.error('Fix: replace with a token from apps/web/app/globals.css')
  console.error('     (var(--accent), var(--color-success), etc.)')
  console.error('Or:  add the exact "file:line" to apps/web/.hex-allowlist.txt')
  console.error('     with a comment explaining why it is legitimate.')
  process.exit(1)
}

main()
