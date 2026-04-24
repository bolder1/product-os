'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles, CheckSquare, Square, ChevronRight } from 'lucide-react'
import { type HandoffItem } from '../_data/mock-handoffs'

interface SpecDetailProps {
  item: HandoffItem | null
  onClose?: () => void
}

type InspectTab = 'css' | 'tokens' | 'props' | 'criteria'

const typeConfig: Record<string, { label: string; color: string }> = {
  component: { label: 'Component', color: '#3B82F6' },
  page: { label: 'Page', color: '#8B5CF6' },
  token: { label: 'Token', color: '#F59E0B' },
}

// Group specs into CSS sections
function groupSpecsForCSS(specs: HandoffItem['specs']) {
  const layout: typeof specs = []
  const typography: typeof specs = []
  const colors: typeof specs = []
  const effects: typeof specs = []

  for (const s of specs) {
    const p = s.property.toLowerCase()
    const t = s.type.toLowerCase()
    if (t === 'color' || p.includes('color') || p.includes('background') || p.includes('border') || p.includes('fill')) {
      colors.push(s)
    } else if (t === 'typography' || p.includes('font') || p.includes('line-height') || p.includes('letter')) {
      typography.push(s)
    } else if (p.includes('radius') || p.includes('shadow') || p.includes('opacity') || p.includes('blur') || t === 'radius') {
      effects.push(s)
    } else {
      layout.push(s)
    }
  }
  return { layout, typography, colors, effects }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(`${label}: ${value};`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="group flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors">
      <span className="font-mono text-[11px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-[var(--accent)]">{value}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/[0.08]"
        >
          {copied ? (
            <Check className="w-3 h-3 text-[var(--color-success)]" />
          ) : (
            <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />
          )}
        </button>
      </div>
    </div>
  )
}

function CSSTab({ item }: { item: HandoffItem }) {
  const { layout, typography, colors, effects } = groupSpecsForCSS(item.specs)
  const [copied, setCopied] = useState(false)

  const allCSS = item.specs.map((s) => `  ${s.property}: ${s.value};`).join('\n')
  const cssBlock = `.${item.name.toLowerCase().replace(/\s+/g, '-')} {\n${allCSS}\n}`

  const handleCopyAll = () => {
    navigator.clipboard.writeText(cssBlock)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Copy CSS button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] shrink-0">
        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">.{item.name.toLowerCase().replace(/\s+/g, '-')}</span>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[var(--bg-inset)] hover:bg-white/[0.08] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy CSS'}
        </button>
      </div>

      <div className="flex-1 overflow-auto px-1 py-2 space-y-3">
        {layout.length > 0 && (
          <section>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium px-2 mb-1">Layout</p>
            {layout.map((s) => <CopyRow key={s.property} label={s.property} value={s.value} />)}
          </section>
        )}
        {typography.length > 0 && (
          <section>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium px-2 mb-1">Typography</p>
            {typography.map((s) => <CopyRow key={s.property} label={s.property} value={s.value} />)}
          </section>
        )}
        {colors.length > 0 && (
          <section>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium px-2 mb-1">Colors</p>
            {colors.map((s) => (
              <div key={s.property} className="group flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors">
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">{s.property}</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-white/[0.15]"
                    style={{ backgroundColor: s.value.startsWith('#') || s.value.startsWith('rgb') ? s.value : undefined }}
                  />
                  <span className="font-mono text-[11px] text-[var(--accent)]">{s.value}</span>
                </div>
              </div>
            ))}
          </section>
        )}
        {effects.length > 0 && (
          <section>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium px-2 mb-1">Effects</p>
            {effects.map((s) => <CopyRow key={s.property} label={s.property} value={s.value} />)}
          </section>
        )}
        {item.specs.length === 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] px-2 py-4">No CSS specs available</p>
        )}
      </div>
    </div>
  )
}

function TokensTab({ item }: { item: HandoffItem }) {
  const groups: Record<string, typeof item.tokens> = {}
  for (const t of item.tokens) {
    if (!groups[t.type]) groups[t.type] = []
    groups[t.type].push(t)
  }
  return (
    <div className="flex-1 overflow-auto px-1 py-2 space-y-3">
      {Object.entries(groups).map(([type, tokens]) => (
        <section key={type}>
          <p className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium px-2 mb-1">{type}</p>
          <div className="space-y-0.5">
            {tokens.map((t) => (
              <div key={t.name} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.04] transition-colors">
                {t.type === 'color' ? (
                  <div
                    className="w-4 h-4 rounded border border-white/[0.15] flex-shrink-0"
                    style={{ backgroundColor: t.value }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded bg-[var(--bg-inset)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-[var(--text-tertiary)]">{t.type[0].toUpperCase()}</span>
                  </div>
                )}
                <span className="font-mono text-[11px] text-[var(--text-primary)] flex-1 truncate">{t.name}</span>
                <span className="font-mono text-[10px] text-[var(--accent)]">{t.value}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      {item.tokens.length === 0 && (
        <p className="text-[11px] text-[var(--text-tertiary)] px-2 py-4">No design tokens linked</p>
      )}
      <div className="px-2 pt-1">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border-subtle)] w-fit">
          <span className="text-[10px] text-[var(--accent-text)]">Brand source</span>
          <ChevronRight className="w-3 h-3 text-[var(--accent-text)]" />
        </div>
      </div>
    </div>
  )
}

const SAMPLE_PROPS = [
  { name: 'variant', type: 'string', defaultVal: '"primary"', required: false, description: 'Visual variant' },
  { name: 'size', type: '"sm" | "md" | "lg"', defaultVal: '"md"', required: false, description: 'Size scale' },
  { name: 'disabled', type: 'boolean', defaultVal: 'false', required: false, description: 'Disabled state' },
  { name: 'onClick', type: '() => void', defaultVal: '—', required: false, description: 'Click handler' },
]

function PropsTab({ item }: { item: HandoffItem }) {
  const props = item.type === 'component' ? SAMPLE_PROPS : []
  return (
    <div className="flex-1 overflow-auto px-1 py-2">
      {props.length > 0 ? (
        <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-inset)]">
                <th className="text-left px-2.5 py-2 text-[var(--text-tertiary)] font-medium">Prop</th>
                <th className="text-left px-2.5 py-2 text-[var(--text-tertiary)] font-medium">Type</th>
                <th className="text-left px-2.5 py-2 text-[var(--text-tertiary)] font-medium">Default</th>
                <th className="text-left px-2.5 py-2 text-[var(--text-tertiary)] font-medium">Req</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p, i) => (
                <tr
                  key={p.name}
                  className={`border-b border-[var(--border-subtle)] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                >
                  <td className="px-2.5 py-2 font-mono text-[var(--text-primary)]">{p.name}</td>
                  <td className="px-2.5 py-2 font-mono text-[var(--accent)] text-[10px]">{p.type}</td>
                  <td className="px-2.5 py-2 font-mono text-[var(--text-secondary)]">{p.defaultVal}</td>
                  <td className="px-2.5 py-2 text-[var(--text-tertiary)]">{p.required ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[11px] text-[var(--text-tertiary)] px-2 py-4">
          Props only available for component types
        </p>
      )}
    </div>
  )
}

function CriteriaTab({
  item,
  criteriaState,
  onToggle,
  onMarkAll,
}: {
  item: HandoffItem
  criteriaState: boolean[]
  onToggle: (i: number) => void
  onMarkAll: () => void
}) {
  const done = criteriaState.filter(Boolean).length
  const total = criteriaState.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const readiness =
    pct === 100 ? 'ready' : pct >= 60 ? 'in-review' : 'draft'

  const readinessColor =
    readiness === 'ready'
      ? 'var(--color-success)'
      : readiness === 'in-review'
      ? 'var(--color-warning)'
      : 'var(--text-tertiary)'

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--border-subtle)] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-secondary)]">{done}/{total} done</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border"
            style={{ color: readinessColor, borderColor: readinessColor, backgroundColor: `${readinessColor}15` }}
          >
            {readiness}
          </span>
        </div>
        <div className="h-1 rounded-full bg-[var(--bg-inset)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: readinessColor }}
          />
        </div>
        <button
          onClick={onMarkAll}
          className="text-[10px] text-[var(--accent-text)] hover:underline"
        >
          Mark all done
        </button>
      </div>

      <div className="flex-1 overflow-auto px-2 py-2 space-y-1">
        {item.criteria.map((c, i) => (
          <button
            key={i}
            onClick={() => onToggle(i)}
            className="w-full flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
          >
            {criteriaState[i] ? (
              <CheckSquare className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
            ) : (
              <Square className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-[11px] leading-snug ${
                criteriaState[i] ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'
              }`}
            >
              {c.text}
            </span>
          </button>
        ))}
        {item.criteria.length === 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] px-2 py-4">No criteria defined</p>
        )}
      </div>
    </div>
  )
}

export function SpecDetail({ item }: SpecDetailProps) {
  const [activeTab, setActiveTab] = useState<InspectTab>('css')
  const [criteriaState, setCriteriaState] = useState<boolean[]>(
    () => (item?.criteria ?? []).map((c) => c.done)
  )
  const [copiedMd, setCopiedMd] = useState(false)
  const [copiedJsx, setCopiedJsx] = useState(false)
  const [markedReady, setMarkedReady] = useState(false)

  // Reset criteria state when item changes
  const prevItemId = item?.id
  if (item && item.id !== prevItemId && criteriaState.length !== item.criteria.length) {
    setCriteriaState(item.criteria.map((c) => c.done))
  }

  if (!item) return null

  const typeInfo = typeConfig[item.type] ?? typeConfig.component

  const tabs: { key: InspectTab; label: string }[] = [
    { key: 'css', label: 'CSS' },
    { key: 'tokens', label: 'Tokens' },
    { key: 'props', label: 'Props' },
    { key: 'criteria', label: 'Criteria' },
  ]

  const handleToggle = (i: number) => {
    setCriteriaState((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const handleMarkAll = () => {
    setCriteriaState(item.criteria.map(() => true))
  }

  const handleCopyMd = () => {
    const md = [
      `# ${item.name} (${typeInfo.label})`,
      '',
      '## CSS Specs',
      ...item.specs.map((s) => `- \`${s.property}: ${s.value};\` — ${s.description}`),
      '',
      '## Design Tokens',
      ...item.tokens.map((t) => `- \`${t.name}\`: ${t.value}`),
      '',
      '## Acceptance Criteria',
      ...item.criteria.map((c, i) => `- [${criteriaState[i] ? 'x' : ' '}] ${c.text}`),
    ].join('\n')
    navigator.clipboard.writeText(md)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 1500)
  }

  const handleCopyJsx = () => {
    const compName = item.name.replace(/\s+/g, '')
    const jsx = `import { ${compName} } from '@/components/${compName}'\n\nexport default function Example() {\n  return (\n    <${compName}\n      // add props here\n    />\n  )\n}`
    navigator.clipboard.writeText(jsx)
    setCopiedJsx(true)
    setTimeout(() => setCopiedJsx(false), 1500)
  }

  const handleMarkReady = () => {
    setMarkedReady(true)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Item header */}
      <div className="px-3 py-2.5 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate flex-1">{item.name}</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}15` }}
          >
            {typeInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full bg-[var(--bg-inset)] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.completeness}%`,
                backgroundColor:
                  item.completeness >= 90 ? 'var(--color-success)'
                  : item.completeness >= 70 ? 'var(--color-warning)'
                  : '#F43F5E',
              }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">{item.completeness}%</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-default)] shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-[var(--accent-bg,rgba(99,102,241,0.15))] text-[var(--accent-text)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors">
          <Sparkles className="w-3 h-3" />
          AI
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'css' && <CSSTab item={item} />}
        {activeTab === 'tokens' && <TokensTab item={item} />}
        {activeTab === 'props' && <PropsTab item={item} />}
        {activeTab === 'criteria' && (
          <CriteriaTab
            item={item}
            criteriaState={criteriaState}
            onToggle={handleToggle}
            onMarkAll={handleMarkAll}
          />
        )}
      </div>

      {/* Export bar */}
      <div className="border-t border-[var(--border-default)] px-2 py-2 flex items-center gap-1 shrink-0 bg-[var(--bg-inset)]">
        <button
          onClick={handleCopyMd}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[var(--bg-surface)] hover:bg-white/[0.06] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
        >
          {copiedMd ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
          {copiedMd ? 'Copied!' : 'Copy MD'}
        </button>
        <button
          onClick={handleCopyJsx}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-[var(--bg-surface)] hover:bg-white/[0.06] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors"
        >
          {copiedJsx ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
          {copiedJsx ? 'Copied!' : 'Copy JSX'}
        </button>
        <button
          onClick={handleMarkReady}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ml-auto ${
            markedReady
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30'
              : 'bg-[var(--bg-surface)] hover:bg-white/[0.06] text-[var(--text-secondary)] border-[var(--border-subtle)]'
          }`}
        >
          {markedReady ? <Check className="w-3 h-3" /> : null}
          {markedReady ? 'Ready!' : 'Mark Ready'}
        </button>
      </div>
    </div>
  )
}
