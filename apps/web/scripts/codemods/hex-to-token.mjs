#!/usr/bin/env node
/**
 * R20.6 codemod — safely convert the common hex palette to tokens.
 *
 * Only touches contexts where `var(--token)` is a drop-in replacement and
 * cannot break template-literal concatenation:
 *   - Tailwind arbitrary values: text-[#XXX] → text-[var(--token)]
 *                                bg-[#XXX]   → bg-[var(--token)]
 *                                border-[#XXX]
 *                                ring-[#XXX]
 *                                from-[#XXX] / to-[#XXX] / via-[#XXX]
 *                                shadow-[#XXX] / outline-[#XXX] / decoration-[#XXX]
 *                                fill-[#XXX] / stroke-[#XXX] / caret-[#XXX]
 *                                accent-[#XXX] / placeholder-[#XXX] / divide-[#XXX]
 *   - SVG attributes: fill="#XXX" / stroke="#XXX" / stopColor="#XXX"
 *
 * Skips string-literal occurrences like `'#XXX'` because those may be
 * referenced by `${color}20` concatenation producing invalid CSS. Per-file
 * review (or a later, context-aware codemod) handles those.
 *
 * Usage:
 *   node scripts/codemods/hex-to-token.mjs            # dry run
 *   node scripts/codemods/hex-to-token.mjs --write    # apply
 *   node scripts/codemods/hex-to-token.mjs --write app/some/path  # scope
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const WEB_ROOT = join(SCRIPT_DIR, '..', '..')
const APP_ROOT = join(WEB_ROOT, 'app')

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const scopeArg = args.find((a) => !a.startsWith('--'))
const SCOPE = scopeArg ? join(WEB_ROOT, scopeArg) : APP_ROOT

// Normalize to 6-digit lowercase for lookup.
function norm(h) {
  const s = h.replace('#', '').toLowerCase()
  if (s.length === 3) return s.split('').map((c) => c + c).join('')
  if (s.length === 4) return s.slice(0, 3).split('').map((c) => c + c).join('') // drop alpha
  if (s.length === 8) return s.slice(0, 6)
  return s
}

// The R20 mapping. Every shade of role accent collapses to --accent. Semantic
// stays semantic. Neutral grayscale maps to the text ramp.
const MAP = {
  // Text — light ramp
  f1f5f9: 'var(--text-primary)',
  e2e8f0: 'var(--text-primary)',
  cbd5e1: 'var(--text-secondary)',
  '94a3b8': 'var(--text-secondary)',
  '64748b': 'var(--text-tertiary)',
  '475569': 'var(--text-tertiary)',
  '4a5568': 'var(--text-tertiary)',
  '334155': 'var(--border-default)',
  '1e293b': 'var(--bg-surface)',
  '0f172a': 'var(--bg-base)',
  // Accent family — all collapse
  '3b82f6': 'var(--accent)',
  '60a5fa': 'var(--accent)',
  '2563eb': 'var(--accent)',
  '6398ff': 'var(--accent)',
  '7aa8ff': 'var(--accent-hover)',
  '8b5cf6': 'var(--accent)',
  '7c3aed': 'var(--accent)',
  'a78bfa': 'var(--accent)',
  'c4b5fd': 'var(--accent)',
  '6366f1': 'var(--accent)',
  'ec4899': 'var(--accent)',
  f472b6: 'var(--accent)',
  '06b6d4': 'var(--accent)',
  '22d3ee': 'var(--accent)',
  // Success
  '10b981': 'var(--color-success)',
  '059669': 'var(--color-success)',
  '34d399': 'var(--color-success)',
  '14b8a6': 'var(--color-success)',
  // Warning
  f59e0b: 'var(--color-warning)',
  fbbf24: 'var(--color-warning)',
  fcd34d: 'var(--color-warning)',
  f97316: 'var(--color-warning)',
  // Error
  f43f5e: 'var(--color-error)',
  ef4444: 'var(--color-error)',
  dc2626: 'var(--color-error)',
  // Dark surfaces
  '060918': 'var(--bg-base)',
  '0a0f1e': 'var(--bg-base)',
  '0c1022': 'var(--bg-inset)',
}

// Tailwind prefixes that accept arbitrary color values.
const TW_PREFIXES = [
  'text', 'bg', 'border', 'border-t', 'border-b', 'border-l', 'border-r',
  'ring', 'ring-offset', 'outline', 'shadow', 'decoration', 'fill',
  'stroke', 'caret', 'accent', 'placeholder', 'divide', 'from', 'via', 'to',
]
const TW_PREFIX_RE = TW_PREFIXES.map((p) => p.replace(/-/g, '\\-')).join('|')

// Matches `text-[#XXX]`, `hover:bg-[#XXX]/50`, `focus:border-[#XXX]`, etc.
// Captures: (1) full prefix up to `[`, (2) hex
const TW_ARBITRARY_RE = new RegExp(
  `((?:^|[\\s"'\`{>])(?:[a-z]+:)*(?:${TW_PREFIX_RE})-\\[)(#[0-9a-fA-F]{3,8})\\b`,
  'g',
)

// `fill="#XXX"`, `stroke="#XXX"`, `stopColor="#XXX"` in JSX.
const SVG_ATTR_RE = /((?:fill|stroke|stopColor|stop-color|flood-color|lighting-color)=["'])(#[0-9a-fA-F]{3,8})\b/g

const EXT = new Set(['.ts', '.tsx', '.css'])
const FILE_SKIP = new Set([
  'app/globals.css',
  'app/components/shell/user-menu.tsx',
])

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (e === 'node_modules' || e === '.next' || e === '.turbo') continue
      walk(full, acc)
    } else if (st.isFile()) {
      const d = e.lastIndexOf('.')
      if (d >= 0 && EXT.has(e.slice(d))) acc.push(full)
    }
  }
  return acc
}

function transform(src) {
  let changes = 0
  let out = src.replace(TW_ARBITRARY_RE, (m, prefix, hex) => {
    const tok = MAP[norm(hex)]
    if (!tok) return m
    changes += 1
    return `${prefix}${tok}`
  })
  out = out.replace(SVG_ATTR_RE, (m, prefix, hex) => {
    const tok = MAP[norm(hex)]
    if (!tok) return m
    changes += 1
    return `${prefix}${tok}`
  })
  return { out, changes }
}

function main() {
  const files = walk(SCOPE)
  let totalChanges = 0
  let changedFiles = 0
  const summary = []

  for (const file of files) {
    const rel = relative(WEB_ROOT, file).split(sep).join('/')
    if (FILE_SKIP.has(rel)) continue
    const src = readFileSync(file, 'utf8')
    const { out, changes } = transform(src)
    if (changes === 0) continue
    totalChanges += changes
    changedFiles += 1
    summary.push({ rel, changes })
    if (WRITE) writeFileSync(file, out, 'utf8')
  }

  summary.sort((a, b) => b.changes - a.changes)
  for (const s of summary.slice(0, 40)) {
    console.log(String(s.changes).padStart(5), s.rel)
  }
  if (summary.length > 40) {
    console.log(`  … ${summary.length - 40} more files`)
  }
  console.log('---')
  console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'}: ${totalChanges} substitutions across ${changedFiles} files`)
  if (!WRITE) console.log('Re-run with --write to apply.')
}

main()
