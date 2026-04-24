#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url))
const WEB_ROOT = join(SCRIPT_DIR, '..')
const APP_ROOT = join(WEB_ROOT, 'app')

const FILE_ALLOWLIST = new Set([
  'app/globals.css',
  'app/components/shell/user-menu.tsx',
  'app/(dashboard)/[orgSlug]/[productSlug]/brand/_data/default-brand.ts',
  'app/(dashboard)/[orgSlug]/[productSlug]/graph/page.tsx',
])
const EXT = new Set(['.ts', '.tsx', '.css'])
const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const LINE_LOCAL_ALLOW = [
  /eslint-disable.*no-hardcoded-hex/,
  /&#\d+;/,
  /pattern:.*#\\/,
  /\.match\(/,
  // Allow literal black/white in either quoting style — they are the only
  // hex neutrals the R20 palette tolerates inline (SVG fill attrs use ").
  /['"]#000000['"]|['"]#ffffff['"]|['"]#FFFFFF['"]/,
]

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

const files = walk(APP_ROOT)
const counts = {}
for (const file of files) {
  const rel = relative(WEB_ROOT, file).split(sep).join('/')
  if (FILE_ALLOWLIST.has(rel)) continue
  const src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  let prev = false
  let n = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (prev) { prev = false; continue }
    if (/eslint-disable-next-line.*no-hardcoded-hex/.test(line)) { prev = true; continue }
    if (LINE_LOCAL_ALLOW.some((re) => re.test(line))) continue
    const m = line.match(HEX_RE)
    if (m) n += m.length
  }
  if (n > 0) counts[rel] = n
}
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
let total = 0
for (const [, c] of sorted) total += c
console.log('total hex:', total, 'files:', sorted.length)
for (const [f, c] of sorted.slice(0, 40)) console.log(c.toString().padStart(4), f)
