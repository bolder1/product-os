'use client'

/**
 * R5 — Brand · Compliance view.
 *
 * Extracted from `/brand-compliance`. Detects token drift across studios; lives
 * as the third tab of the unified Brand shell.
 */

import { useState, useMemo } from 'react'
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2, Sparkles, RefreshCw, Loader2,
  Palette, Blocks, PenTool, FileText, Image, ChevronRight, Wrench, Search,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useProduct } from '../../layout'
import { AIActionBar } from '../../../../../components/primitives/ai-action-bar'
import { ContextBanner } from '../../../../../components/shared/upstream-empty-state'

type Severity = 'error' | 'warning' | 'info'
type Category = 'color' | 'typography' | 'spacing' | 'component' | 'token'
type Studio = 'brand' | 'components' | 'design' | 'pages' | 'graphics'

interface DriftViolation {
  id: string
  severity: Severity
  category: Category
  studio: Studio
  objectName: string
  objectId: string
  rule: string
  detail: string
  suggestion: string
  autoFixable: boolean
  rawValue?: string
  expectedToken?: string
}

function generateViolations(productId: string, seed: number): DriftViolation[] {
  const violations: DriftViolation[] = [
    { id: `${productId}-v1`, severity: 'error', category: 'color', studio: 'components', objectName: 'PrimaryButton', objectId: 'comp-1', rule: 'Color must use brand token', detail: 'background-color: #2563eb — raw hex used instead of token --color-primary', suggestion: 'Replace #2563eb with var(--color-primary)', autoFixable: true, rawValue: '#2563eb', expectedToken: '--color-primary' },
    { id: `${productId}-v2`, severity: 'error', category: 'color', studio: 'design', objectName: 'Dashboard Screen', objectId: 'design-1', rule: 'Text color must use brand token', detail: 'color: #374151 — not mapped to a brand token', suggestion: 'Replace with var(--text-primary) or var(--text-secondary)', autoFixable: true, rawValue: '#374151', expectedToken: '--text-primary' },
    { id: `${productId}-v3`, severity: 'error', category: 'typography', studio: 'pages', objectName: 'Landing Page Hero', objectId: 'page-1', rule: 'Font family must match brand system', detail: "font-family: 'Arial' — not in approved brand typefaces", suggestion: "Replace with brand font: 'Inter', var(--font-sans)", autoFixable: false, rawValue: 'Arial', expectedToken: 'Inter' },
    { id: `${productId}-v4`, severity: 'warning', category: 'color', studio: 'components', objectName: 'InputField', objectId: 'comp-2', rule: 'Border color should use token', detail: 'border-color: #d1d5db — should use --border-subtle', suggestion: 'Replace #d1d5db with var(--border-subtle)', autoFixable: true, rawValue: '#d1d5db', expectedToken: '--border-subtle' },
    { id: `${productId}-v5`, severity: 'warning', category: 'spacing', studio: 'design', objectName: 'Settings Screen', objectId: 'design-2', rule: 'Spacing must use 4pt grid', detail: 'padding: 14px — not on 4pt grid (should be 12px or 16px)', suggestion: 'Change to padding: 16px (spacing-4)', autoFixable: true, rawValue: '14px', expectedToken: 'spacing-4 (16px)' },
    { id: `${productId}-v6`, severity: 'warning', category: 'typography', studio: 'components', objectName: 'CardTitle', objectId: 'comp-3', rule: 'Font size must use type scale token', detail: 'font-size: 17px — not in brand type scale', suggestion: 'Use 16px (text-base) or 18px (text-lg) from type scale', autoFixable: true, rawValue: '17px', expectedToken: 'text-base (16px)' },
    { id: `${productId}-v7`, severity: 'warning', category: 'color', studio: 'graphics', objectName: 'Social Banner', objectId: 'graphic-1', rule: 'Gradient must use brand colors', detail: 'Linear gradient using #0ea5e9 → #8b5cf6, not brand palette colors', suggestion: 'Use --color-primary → --color-secondary gradient instead', autoFixable: false },
    { id: `${productId}-v8`, severity: 'info', category: 'token', studio: 'components', objectName: 'Badge', objectId: 'comp-4', rule: 'Token is deprecated', detail: '--color-accent is deprecated; --accent-text is the current token', suggestion: 'Migrate to --accent-text across all usages', autoFixable: true, rawValue: '--color-accent', expectedToken: '--accent-text' },
    { id: `${productId}-v9`, severity: 'info', category: 'spacing', studio: 'pages', objectName: 'About Page', objectId: 'page-2', rule: 'Inconsistent section padding', detail: 'Section padding varies: 24px, 28px, 32px — not consistent', suggestion: 'Standardise to spacing-8 (32px) for section padding', autoFixable: false },
    { id: `${productId}-v10`, severity: 'info', category: 'component', studio: 'design', objectName: 'Profile Screen', objectId: 'design-3', rule: 'Uses detached component', detail: 'Avatar element is detached from Avatar component in Component Library', suggestion: 'Re-link to Avatar@v2 from Component Library', autoFixable: false },
  ]
  if (seed % 2 === 1) return violations.filter((_, i) => i !== 0 && i !== 3)
  return violations
}

function computeScore(violations: DriftViolation[]): number {
  const penalty = violations.reduce((p, v) => p + (v.severity === 'error' ? 12 : v.severity === 'warning' ? 5 : 2), 0)
  return Math.max(0, 100 - penalty)
}
function scoreColor(score: number): string {
  if (score < 50) return 'var(--color-error)'
  if (score < 75) return 'var(--color-warning)'
  return 'var(--color-success)'
}
function scoreLabel(score: number): string {
  if (score < 50) return 'Critical'
  if (score < 75) return 'Needs Attention'
  if (score < 90) return 'Good'
  return 'Excellent'
}

const STUDIO_CONFIG: Record<Studio, { label: string; icon: typeof Palette; color: string }> = {
  brand: { label: 'Brand', icon: Palette, color: '#ec4899' },
  components: { label: 'Components', icon: Blocks, color: '#6398ff' },
  design: { label: 'Design', icon: PenTool, color: '#8b5cf6' },
  pages: { label: 'Pages', icon: FileText, color: '#10b981' },
  graphics: { label: 'Graphics', icon: Image, color: '#f59e0b' },
}
const SEVERITY_CONFIG: Record<Severity, { label: string; icon: typeof AlertCircle; color: string; bg: string }> = {
  error: { label: 'Error', icon: AlertCircle, color: 'var(--color-error)', bg: 'var(--color-error-muted)' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-muted)' },
  info: { label: 'Info', icon: Info, color: 'var(--color-info)', bg: 'var(--bg-subtle)' },
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - score / 100)
  const color = scoreColor(score)
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth={8} />
      <circle cx={50} cy={50} r={radius} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={50} y={54} textAnchor="middle" fontSize={20} fontWeight={700} fill={color}>{score}</text>
    </svg>
  )
}

function StudioBar({ studio, violations, total }: { studio: Studio; violations: DriftViolation[]; total: number }) {
  const cfg = STUDIO_CONFIG[studio]
  const Icon = cfg.icon
  const count = violations.length
  const errors = violations.filter((v) => v.severity === 'error').length
  const warnings = violations.filter((v) => v.severity === 'warning').length
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] w-24 flex-shrink-0">{cfg.label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        {count > 0 && (
          <div className="h-full rounded-full transition-all"
            style={{ width: `${(count / Math.max(total, 1)) * 100}%`, background: errors > 0 ? 'var(--color-error)' : 'var(--color-warning)' }} />
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] w-20 flex-shrink-0">
        {errors > 0 && <span className="text-[var(--color-error)]">{errors}E</span>}
        {warnings > 0 && <span className="text-[var(--color-warning)]">{warnings}W</span>}
        {count === 0 && <span className="text-[var(--color-success)]">Clean ✓</span>}
      </div>
    </div>
  )
}

function ViolationRow({ violation, onFix, fixing }: { violation: DriftViolation; onFix: (id: string) => void; fixing: boolean }) {
  const sev = SEVERITY_CONFIG[violation.severity]
  const SevIcon = sev.icon
  const StIcon = STUDIO_CONFIG[violation.studio].icon
  return (
    <div className="flex items-start gap-3 p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
      <div className="mt-0.5 flex-shrink-0"><SevIcon className="w-4 h-4" style={{ color: sev.color }} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{violation.objectName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: sev.bg, color: sev.color }}>{violation.severity}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>{violation.category}</span>
          <div className="flex items-center gap-1">
            <StIcon className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[10px] text-[var(--text-tertiary)]">{STUDIO_CONFIG[violation.studio].label}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-1 font-mono truncate">{violation.detail}</p>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          <span className="text-[var(--accent-text)] font-medium">Fix: </span>{violation.suggestion}
        </p>
        {violation.rawValue && violation.expectedToken && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}>{violation.rawValue}</span>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}>{violation.expectedToken}</span>
          </div>
        )}
      </div>
      {violation.autoFixable && (
        <button onClick={() => onFix(violation.id)} disabled={fixing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}>
          {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
          Auto-fix
        </button>
      )}
    </div>
  )
}

function AIInsight({ violations }: { violations: DriftViolation[] }) {
  const errorCount = violations.filter((v) => v.severity === 'error').length
  const autoFixable = violations.filter((v) => v.autoFixable).length
  const topStudio = Object.entries(
    violations.reduce<Record<string, number>>((acc, v) => { acc[v.studio] = (acc[v.studio] ?? 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1])[0]
  if (violations.length === 0) return null
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--accent-text)', background: 'var(--accent-muted)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
        <span className="text-xs font-semibold text-[var(--accent-text)]">AI Compliance Insight</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {errorCount > 0
          ? `${errorCount} critical violation${errorCount > 1 ? 's' : ''} need immediate attention — primarily in ${topStudio?.[0] ? STUDIO_CONFIG[topStudio[0] as Studio]?.label : 'your studios'}. `
          : 'No critical errors found. '}
        {autoFixable > 0 ? `${autoFixable} issue${autoFixable > 1 ? 's' : ''} can be auto-fixed with one click. ` : ''}
        Most drift occurs when raw hex values are used instead of brand tokens. Enforcing token usage at the component level will prevent future drift.
      </p>
    </div>
  )
}

type FilterTab = 'all' | Severity
type CategoryFilter = 'all' | Category

export default function ComplianceView() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)

  const [scanSeed, setScanSeed] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set())
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<FilterTab>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [studioFilter, setStudioFilter] = useState<Studio | 'all'>('all')
  const [search, setSearch] = useState('')

  const allViolations = useMemo(
    () => generateViolations(productId, scanSeed).filter((v) => !fixedIds.has(v.id)),
    [productId, scanSeed, fixedIds]
  )
  const filtered = useMemo(() => {
    let list = allViolations
    if (severityFilter !== 'all') list = list.filter((v) => v.severity === severityFilter)
    if (categoryFilter !== 'all') list = list.filter((v) => v.category === categoryFilter)
    if (studioFilter !== 'all') list = list.filter((v) => v.studio === studioFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((v) => v.objectName.toLowerCase().includes(q) || v.detail.toLowerCase().includes(q) || v.rule.toLowerCase().includes(q))
    }
    return list
  }, [allViolations, severityFilter, categoryFilter, studioFilter, search])

  const score = useMemo(() => computeScore(allViolations), [allViolations])
  const errors = allViolations.filter((v) => v.severity === 'error').length
  const warnings = allViolations.filter((v) => v.severity === 'warning').length
  const infos = allViolations.filter((v) => v.severity === 'info').length
  const autoFixableCount = allViolations.filter((v) => v.autoFixable).length

  const violationsByStudio = useMemo(
    () => (Object.keys(STUDIO_CONFIG) as Studio[]).map((s) => ({ studio: s, violations: allViolations.filter((v) => v.studio === s) })),
    [allViolations]
  )
  const maxStudioCount = Math.max(...violationsByStudio.map((s) => s.violations.length), 1)

  function handleScan() {
    setScanning(true); setFixedIds(new Set())
    setTimeout(() => { setScanSeed((s) => s + 1); setScanning(false) }, 1800)
  }
  function handleFix(id: string) {
    setFixingId(id)
    setTimeout(() => { setFixedIds((prev) => new Set([...prev, id])); setFixingId(null) }, 1000)
  }
  function handleFixAll() {
    const fixable = allViolations.filter((v) => v.autoFixable).map((v) => v.id)
    setFixingId('bulk')
    setTimeout(() => { setFixedIds((prev) => new Set([...prev, ...fixable])); setFixingId(null) }, 2000)
  }

  const severityTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allViolations.length },
    { key: 'error', label: 'Errors', count: errors },
    { key: 'warning', label: 'Warnings', count: warnings },
    { key: 'info', label: 'Info', count: infos },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <ContextBanner
        chips={[
          { label: 'Brand Tokens', source: 'brand', color: '#EC4899' },
          { label: 'Brand Voice', source: 'brand-voice', color: '#8B5CF6' },
          { label: 'Components', source: 'components', color: '#6366F1' },
        ]}
        missing={[]}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Actions strip */}
          <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-[var(--border-subtle)] flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
            <AIActionBar workspace="intelligence" productId={productId} compact />
            {autoFixableCount > 0 && (
              <button onClick={handleFixAll} disabled={fixingId === 'bulk'}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}>
                {fixingId === 'bulk' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Fixing…</> : <><Wrench className="w-3.5 h-3.5" />Fix All ({autoFixableCount})</>}
              </button>
            )}
            <button onClick={handleScan} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--accent-text)', color: '#fff' }}>
              {scanning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</> : <><RefreshCw className="w-3.5 h-3.5" />Re-scan</>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <AIInsight violations={allViolations} />

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
                {severityTabs.map((t) => (
                  <button key={t.key} onClick={() => setSeverityFilter(t.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                    style={{
                      background: severityFilter === t.key ? 'var(--bg-card)' : 'transparent',
                      color: severityFilter === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      boxShadow: severityFilter === t.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                    }}>
                    {t.label}
                    {t.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: t.key === 'error' ? 'var(--color-error-muted)' : t.key === 'warning' ? 'var(--color-warning-muted)' : 'var(--bg-hover)',
                          color: t.key === 'error' ? 'var(--color-error)' : t.key === 'warning' ? 'var(--color-warning)' : 'var(--text-secondary)',
                        }}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <select value={studioFilter} onChange={(e) => setStudioFilter(e.target.value as Studio | 'all')}
                className="text-xs px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
                <option value="all">All studios</option>
                {(Object.keys(STUDIO_CONFIG) as Studio[]).map((s) => (
                  <option key={s} value={s}>{STUDIO_CONFIG[s].label}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="text-xs px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
                <option value="all">All categories</option>
                {(['color', 'typography', 'spacing', 'component', 'token'] as Category[]).map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search violations…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-success-muted)' }}>
                  <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {allViolations.length === 0 ? 'All clean! No violations found.' : 'No violations match your filters.'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {allViolations.length === 0 ? 'Your product is fully brand-compliant.' : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{filtered.length} violation{filtered.length !== 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">sorted by severity</span>
                </div>
                {[...filtered]
                  .sort((a, b) => ({ error: 0, warning: 1, info: 2 }[a.severity] - { error: 0, warning: 1, info: 2 }[b.severity]))
                  .map((v) => (
                    <ViolationRow key={v.id} violation={v} onFix={handleFix} fixing={fixingId === v.id || fixingId === 'bulk'} />
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[280px] flex-shrink-0 border-l border-[var(--border-subtle)] flex flex-col overflow-y-auto" style={{ background: 'var(--bg-card)' }}>
          <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Brand Health Score</p>
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={score} />
              <p className="text-sm font-semibold" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] text-center">
                {allViolations.length === 0 ? 'Perfect brand compliance' : `${allViolations.length} issue${allViolations.length !== 1 ? 's' : ''} affecting score`}
              </p>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">By Severity</p>
            <div className="space-y-2">
              {[
                { label: 'Errors', count: errors, color: 'var(--color-error)' },
                { label: 'Warnings', count: warnings, color: 'var(--color-warning)' },
                { label: 'Info', count: infos, color: 'var(--color-info)' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">By Studio</p>
            {violationsByStudio.map(({ studio, violations: sv }) => (
              <StudioBar key={studio} studio={studio} violations={sv} total={maxStudioCount} />
            ))}
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <span className="text-xs text-[var(--text-secondary)]">Auto-fixable</span>
                <span className="text-xs font-bold text-[var(--color-success)]">{autoFixableCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <span className="text-xs text-[var(--text-secondary)]">Manual review</span>
                <span className="text-xs font-bold text-[var(--color-warning)]">{allViolations.length - autoFixableCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <span className="text-xs text-[var(--text-secondary)]">Already fixed</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{fixedIds.size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
