/**
 * Prompt enhancer.
 *
 * Takes a raw user prompt + graph context and returns an enhanced version
 * with explicit constraints, resolved pronouns, bound artifacts, and extracted
 * template variables. Strategy-based: each strategy inspects the prompt and
 * optionally contributes a rewrite. Strategies run in priority order and the
 * final enhanced text is their cumulative transformation.
 *
 * Deterministic by design. Rule-based strategies run first; a model fallback
 * (Haiku) is added in a later phase.
 */

import type {
  DiffSegment,
  EnhancedPrompt,
  PromptContext,
  StrategyKey,
  TemplateVariable,
} from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Strategy interface
// ─────────────────────────────────────────────────────────────────────────────

interface StrategyContext {
  prompt: string
  context: PromptContext
  variables: TemplateVariable[]
}

interface StrategyResult {
  /** Rewritten prompt (return input unchanged to signal no-op). */
  prompt: string
  /** Variables this strategy extracted. */
  variables?: TemplateVariable[]
  /** Did this strategy actually change anything? */
  applied: boolean
}

interface Strategy {
  key: StrategyKey
  run: (ctx: StrategyContext) => StrategyResult
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve pronouns ("it", "this", "that") against the active selection.
 * If a selection exists, replace the first pronoun with a concrete reference.
 */
const resolvePronouns: Strategy = {
  key: 'resolve-pronouns',
  run: ({ prompt, context }) => {
    const sel = context.selection?.[0]
    if (!sel) return { prompt, applied: false }
    const label = sel.label ?? `${sel.kind}:${sel.id}`
    // Match first standalone pronoun, preserve case at position.
    const re = /\b(it|this|that)\b/i
    const match = prompt.match(re)
    if (!match) return { prompt, applied: false }
    const replaced = prompt.replace(re, `\`${label}\``)
    return {
      prompt: replaced,
      variables: [
        { name: 'selected_component', value: label, source: 'selection' },
      ],
      applied: true,
    }
  },
}

/**
 * Add constraints — imperative verbs without acceptance criteria get a default
 * "Return:" clause that names the expected output shape for the studio.
 */
const addConstraints: Strategy = {
  key: 'add-constraints',
  run: ({ prompt, context }) => {
    if (prompt.length > 140) return { prompt, applied: false } // long prompts likely already constrained
    const imperativeRe = /^\s*(fix|make|improve|add|remove|refactor|review|write)\b/i
    if (!imperativeRe.test(prompt)) return { prompt, applied: false }
    if (/\b(return|output|include|with)\b/i.test(prompt)) return { prompt, applied: false }

    const expected = expectedOutputFor(context.studioKey)
    const suffix = expected ? ` Return: ${expected}.` : ' Return: a concrete diff + rationale.'
    return { prompt: prompt.replace(/\s*\.?\s*$/, '.') + suffix, applied: true }
  },
}

/**
 * Bind artifacts — when the prompt names a studio-shaped noun ("the roadmap",
 * "the brand"), bind it to a graph reference variable.
 */
const bindArtifacts: Strategy = {
  key: 'bind-artifacts',
  run: ({ prompt, context, variables }) => {
    const patterns: Array<{ re: RegExp; name: string; hint: string }> = [
      { re: /\bthe roadmap\b/i,    name: 'roadmap',    hint: 'roadmap:current' },
      { re: /\bthe brand\b/i,      name: 'brand',      hint: 'brand:active' },
      { re: /\bthe design( system)?\b/i, name: 'design_system', hint: 'design:active' },
      { re: /\bthe release\b/i,    name: 'release',    hint: 'release:current' },
    ]
    let out = prompt
    const added: TemplateVariable[] = []
    for (const p of patterns) {
      if (p.re.test(out) && !variables.some((v) => v.name === p.name)) {
        out = out.replace(p.re, `{{${p.name}}}`)
        added.push({
          name: p.name,
          value: p.hint,
          source: context.recentArtifacts?.some((a) => a.kind === p.name) ? 'recent' : 'studio',
        })
      }
    }
    if (added.length === 0) return { prompt, applied: false }
    return { prompt: out, variables: added, applied: true }
  },
}

/**
 * Expand scope — very terse prompts (1–3 words) in complex studios get a
 * structured checklist appended.
 */
const expandScope: Strategy = {
  key: 'expand-scope',
  run: ({ prompt, context }) => {
    const words = prompt.trim().split(/\s+/)
    if (words.length > 3) return { prompt, applied: false }
    const template = scopeTemplateFor(context.studioKey)
    if (!template) return { prompt, applied: false }
    return { prompt: `${prompt.trim().replace(/\.?$/, '')}. ${template}`, applied: true }
  },
}

/**
 * Extract variables — any angle-bracketed or `{{slot}}` phrase becomes an
 * editable template variable. Also extracts text in square brackets.
 */
const extractVariables: Strategy = {
  key: 'extract-variables',
  run: ({ prompt, variables }) => {
    const added: TemplateVariable[] = []
    let out = prompt
    const bracketRe = /\[([^\]]{2,40})\]/g
    let match: RegExpExecArray | null
    let idx = 0
    while ((match = bracketRe.exec(prompt)) !== null) {
      const raw = match[1] ?? ''
      const choices = raw.includes('/') ? raw.split('/').map((s) => s.trim()) : undefined
      const name = `option_${++idx}`
      if (variables.some((v) => v.name === name)) continue
      const placeholder = `{{${name}}}`
      out = out.replace(match[0], placeholder)
      added.push({
        name,
        value: choices?.[0] ?? raw,
        choices,
        source: 'user-input',
      })
    }
    if (added.length === 0) return { prompt, applied: false }
    return { prompt: out, variables: added, applied: true }
  },
}

const STRATEGIES: Strategy[] = [
  resolvePronouns,
  bindArtifacts,
  addConstraints,
  expandScope,
  extractVariables,
]

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface EnhanceOptions {
  /** Restrict to a subset of strategies. Defaults to all. */
  strategies?: StrategyKey[]
}

export function enhance(
  raw: string,
  context: PromptContext,
  opts: EnhanceOptions = {},
): EnhancedPrompt {
  const allowed = new Set(opts.strategies ?? STRATEGIES.map((s) => s.key))
  const applied: StrategyKey[] = []
  const variables: TemplateVariable[] = []

  let current = raw.trim()
  for (const s of STRATEGIES) {
    if (!allowed.has(s.key)) continue
    const result = s.run({ prompt: current, context, variables })
    if (result.applied) {
      applied.push(s.key)
      current = result.prompt
      if (result.variables) variables.push(...result.variables)
    }
  }

  const diff = diffStrings(raw, current)
  const confidence = confidenceFor(raw, current, applied)

  return {
    raw,
    enhanced: current,
    diff,
    variables,
    strategiesApplied: applied,
    confidence,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function expectedOutputFor(studioKey: string | undefined): string | null {
  switch (studioKey) {
    case 'design':    return 'updated JSX + rationale'
    case 'pages':     return 'page tree diff + rationale'
    case 'components': return 'component source + usage note'
    case 'code':      return 'unified diff + tests'
    case 'brand':     return 'token changes + rationale'
    case 'workflows': return 'workflow diff + step list'
    case 'roadmap':   return 'roadmap items + sequencing rationale'
    case 'cortex':    return 'plan outline + expected artifacts'
    default:          return null
  }
}

function scopeTemplateFor(studioKey: string | undefined): string | null {
  switch (studioKey) {
    case 'design':
      return 'Cover: visual polish, spacing, typography, dark-mode, a11y.'
    case 'brand':
      return 'Cover: voice, lexicon, tone, forbidden terms, example phrases.'
    case 'code':
      return 'Cover: the fix, a regression test, and a note on blast radius.'
    case 'roadmap':
      return 'Cover: outcome, sequencing rationale, dependencies, risks.'
    case 'cortex':
      return 'Cover: plan, expected artifacts, budget estimate, risks.'
    default:
      return null
  }
}

function confidenceFor(raw: string, enhanced: string, applied: StrategyKey[]): number {
  if (enhanced === raw) return 0.2
  // More strategies + longer delta = higher confidence, capped.
  const deltaChars = Math.abs(enhanced.length - raw.length)
  const base = Math.min(1, applied.length / 3 + deltaChars / 200)
  return Number(base.toFixed(2))
}

/**
 * Character-level diff using LCS. Returns segments tagged equal/insert/delete.
 * Not the cheapest algorithm for very long strings, but prompts are small.
 */
function diffStrings(a: string, b: string): DiffSegment[] {
  const n = a.length
  const m = b.length
  if (n === 0) return m === 0 ? [] : [{ op: 'insert', text: b }]
  if (m === 0) return [{ op: 'delete', text: a }]

  // Build LCS table.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0) as number[])
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const row = dp[i]!
      const prevRow = dp[i - 1]!
      row[j] = a[i - 1] === b[j - 1]
        ? (prevRow[j - 1] ?? 0) + 1
        : Math.max(prevRow[j] ?? 0, row[j - 1] ?? 0)
    }
  }

  // Backtrack to produce segments.
  const segments: DiffSegment[] = []
  let i = n
  let j = m
  let buf = ''
  let bufOp: DiffSegment['op'] | null = null
  const flush = () => {
    if (bufOp && buf) segments.unshift({ op: bufOp, text: buf })
    buf = ''
    bufOp = null
  }
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      if (bufOp !== 'equal') flush()
      buf = (a[i - 1] ?? '') + buf
      bufOp = 'equal'
      i--
      j--
    } else if ((dp[i - 1]?.[j] ?? 0) >= (dp[i]?.[j - 1] ?? 0)) {
      if (bufOp !== 'delete') flush()
      buf = (a[i - 1] ?? '') + buf
      bufOp = 'delete'
      i--
    } else {
      if (bufOp !== 'insert') flush()
      buf = (b[j - 1] ?? '') + buf
      bufOp = 'insert'
      j--
    }
  }
  while (i > 0) {
    if (bufOp !== 'delete') flush()
    buf = (a[i - 1] ?? '') + buf
    bufOp = 'delete'
    i--
  }
  while (j > 0) {
    if (bufOp !== 'insert') flush()
    buf = (b[j - 1] ?? '') + buf
    bufOp = 'insert'
    j--
  }
  flush()
  return segments
}
