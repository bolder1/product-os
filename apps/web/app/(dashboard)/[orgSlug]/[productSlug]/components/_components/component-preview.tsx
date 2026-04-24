'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Moon, Sun, Grid3X3 } from 'lucide-react'
import { type ComponentDef, type PropDef } from '../_data/mock-components'

type BackgroundMode = 'dark' | 'light' | 'checkerboard'
type InteractionState = 'hover' | 'focus' | 'active' | 'disabled'

interface ComponentPreviewProps {
  component: ComponentDef
  propValues: Record<string, string>
  onPropChange: (propName: string, value: string) => void
}

/* ---------- Semantic token pill pairs ---------- */
/**
 * Pre-composed Tailwind classes for each semantic pill. Keyed pairs avoid
 * template-literal opacity concat (`${hex}20`) which breaks with CSS vars.
 */
const pillBg: Record<string, string> = {
  default: 'bg-[var(--bg-hover)]',
  success: 'bg-[var(--color-success)]/15',
  warning: 'bg-[var(--color-warning)]/15',
  error: 'bg-[var(--color-error)]/15',
  info: 'bg-[var(--accent)]/15',
}
const pillText: Record<string, string> = {
  default: 'text-[var(--text-secondary)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
  info: 'text-[var(--accent)]',
}

const alertBg: Record<string, string> = {
  info: 'bg-[var(--accent)]/10',
  success: 'bg-[var(--color-success)]/10',
  warning: 'bg-[var(--color-warning)]/10',
  error: 'bg-[var(--color-error)]/10',
}
const alertBorder: Record<string, string> = {
  info: 'border-[var(--accent)]/30',
  success: 'border-[var(--color-success)]/30',
  warning: 'border-[var(--color-warning)]/30',
  error: 'border-[var(--color-error)]/30',
}
const alertText: Record<string, string> = {
  info: 'text-[var(--accent)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  error: 'text-[var(--color-error)]',
}
const alertDot: Record<string, string> = {
  info: 'bg-[var(--accent)]',
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
}

/* ---------- Live JSX generator ----------------------------------- */
function generateJSX(component: ComponentDef, propValues: Record<string, string>): string {
  const name = component.name.replace(/\s+/g, '')
  const propEntries = Object.entries(propValues).filter(([, v]) => v !== '' && v !== undefined)

  if (propEntries.length === 0) {
    return `<${name} />`
  }

  const propsStr = propEntries
    .map(([key, val]) => {
      const prop = component.props.find((p) => p.name === key)
      if (prop?.type === 'boolean') {
        return val === 'true' ? `  ${key}` : `  ${key}={false}`
      }
      if (prop?.type === 'number') {
        return `  ${key}={${val}}`
      }
      return `  ${key}="${val}"`
    })
    .join('\n')

  // Check for token binding annotations
  const bindings = component.tokenBindings ?? []
  const bindingComments = bindings.length > 0
    ? `\n  {/* tokens: ${bindings.map(b => `${b.property} → ${b.tokenPath}`).join(', ')} */}`
    : ''

  return `<${name}\n${propsStr}\n/>${bindingComments}`
}

/* ---------- visual placeholder for each component type ---------- */
function renderComponentPlaceholder(
  component: ComponentDef,
  propValues: Record<string, string>,
  states: Set<InteractionState>
) {
  const isDisabled = states.has('disabled') || propValues.disabled === 'true'
  const opacity = isDisabled ? 0.4 : 1

  switch (component.name) {
    case 'Button': {
      const v = propValues.variant ?? 'primary'
      const filled = v === 'primary' || v === 'destructive'
      const isDestructive = v === 'destructive'
      const sz = propValues.size === 'lg' ? 'px-6 py-2.5 text-sm' : propValues.size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
      const bgClass = isDestructive
        ? 'bg-[var(--color-error)]'
        : filled
          ? 'bg-[var(--accent)]'
          : 'bg-transparent border border-[var(--accent)]'
      const textClass = filled ? 'text-[var(--text-inverse)]' : 'text-[var(--accent)]'
      return (
        <button
          disabled={isDisabled}
          className={`rounded-lg font-medium ${sz} transition-all ${bgClass} ${textClass}`}
          style={{ opacity, filter: states.has('hover') ? 'brightness(1.15)' : undefined }}
        >
          {propValues.label ?? 'Click me'}
        </button>
      )
    }
    case 'Input': {
      const hasError = propValues.error === 'true'
      return (
        <div className="w-64" style={{ opacity }}>
          {propValues.label && <label className="block text-xs text-[var(--text-secondary)] mb-1">{propValues.label}</label>}
          <div
            className={`w-full px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] border ${
              hasError ? 'border-[var(--color-error)]' : 'border-[var(--border-subtle)]'
            }`}
          >
            <span className="text-[var(--text-tertiary)]">{propValues.placeholder ?? 'Enter text...'}</span>
          </div>
          {propValues.helperText && (
            <p className={`text-xs mt-1 ${hasError ? 'text-[var(--color-error)]' : 'text-[var(--text-tertiary)]'}`}>
              {propValues.helperText}
            </p>
          )}
        </div>
      )
    }
    case 'Card':
      return (
        <div
          className="w-64 rounded-xl p-4 border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          style={{ opacity }}
        >
          <h3 className="text-sm font-medium text-[var(--text-primary)]">{propValues.title ?? 'Card Title'}</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Card content goes here.</p>
        </div>
      )
    case 'Badge': {
      const v = propValues.variant ?? 'default'
      const bg = pillBg[v] ?? pillBg.default
      const text = pillText[v] ?? pillText.default
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`} style={{ opacity }}>
          {propValues.label ?? 'Badge'}
        </span>
      )
    }
    case 'Avatar': {
      const sizes: Record<string, number> = { sm: 28, md: 36, lg: 48 }
      const sz = sizes[propValues.size ?? 'md'] ?? 36
      const initials = (propValues.name ?? 'JD').slice(0, 2).toUpperCase()
      return (
        <div
          className="rounded-full flex items-center justify-center font-medium text-[var(--text-inverse)] bg-[var(--accent)]"
          style={{ width: sz, height: sz, fontSize: sz * 0.35, opacity }}
        >
          {initials}
        </div>
      )
    }
    case 'Modal':
      return (
        <div
          className="w-72 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          style={{ opacity }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">{propValues.title ?? 'Modal Title'}</span>
            {propValues.closable !== 'false' && <span className="text-[var(--text-tertiary)] cursor-pointer">×</span>}
          </div>
          <div className="p-4">
            <p className="text-xs text-[var(--text-tertiary)]">Modal body content area.</p>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-subtle)]">
            <span className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)]">Cancel</span>
            <span className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-inverse)] bg-[var(--accent)]">Confirm</span>
          </div>
        </div>
      )
    case 'Table': {
      const cols = Number(propValues.columns ?? 4)
      const striped = propValues.striped === 'true'
      const compact = propValues.compact === 'true'
      const py = compact ? 'py-1' : 'py-2'
      return (
        <div className="w-80 rounded-lg overflow-hidden border border-[var(--border-subtle)]" style={{ opacity }}>
          <div
            className={`grid px-3 ${py} border-b border-[var(--border-subtle)]`}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <span key={i} className="text-[10px] font-medium text-[var(--text-tertiary)]">Col {i + 1}</span>
            ))}
          </div>
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              className={`grid px-3 ${py} ${striped && r % 2 ? 'bg-[var(--bg-hover)]/40' : ''}`}
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {Array.from({ length: cols }).map((_, i) => (
                <span key={i} className="text-[10px] text-[var(--text-secondary)]">Cell</span>
              ))}
            </div>
          ))}
        </div>
      )
    }
    case 'Tabs': {
      const items = Number(propValues.items ?? 3)
      const v = propValues.variant ?? 'default'
      const containerClass =
        v === 'pill' ? 'bg-[var(--bg-surface)]' : v === 'underline' ? 'border-b border-[var(--border-subtle)]' : ''
      const activeBg =
        v === 'pill' ? 'bg-[var(--accent)]/20' : v === 'default' ? 'bg-[var(--accent)]/15' : 'bg-transparent'
      const activeUnderline = v === 'underline' ? 'border-b-2 border-[var(--accent)]' : ''
      return (
        <div className={`flex gap-1 rounded-lg p-1 ${containerClass}`} style={{ opacity }}>
          {Array.from({ length: items }).map((_, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                i === 0 ? `${activeBg} ${activeUnderline} text-[var(--accent)]` : 'text-[var(--text-tertiary)]'
              }`}
            >
              Tab {i + 1}
            </span>
          ))}
        </div>
      )
    }
    case 'Alert': {
      const v = propValues.variant ?? 'info'
      const bg = alertBg[v] ?? alertBg.info
      const border = alertBorder[v] ?? alertBorder.info
      const text = alertText[v] ?? alertText.info
      const dot = alertDot[v] ?? alertDot.info
      return (
        <div className={`w-72 flex items-start gap-2 px-4 py-3 rounded-lg border ${bg} ${border}`} style={{ opacity }}>
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
          <span className={`text-xs ${text}`}>{propValues.message ?? 'Alert message'}</span>
        </div>
      )
    }
    case 'Breadcrumb': {
      const items = Number(propValues.items ?? 3)
      const sep = propValues.separator === 'chevron' ? '›' : propValues.separator === 'dot' ? '·' : '/'
      return (
        <div className="flex items-center gap-2 text-xs" style={{ opacity }}>
          {Array.from({ length: items }).map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              <span
                className={
                  i === items - 1
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }
              >
                {i === 0 ? 'Home' : i === items - 1 ? 'Current' : `Page ${i}`}
              </span>
              {i < items - 1 && <span className="text-[var(--text-tertiary)]">{sep}</span>}
            </span>
          ))}
        </div>
      )
    }
    default:
      return (
        <div
          className="px-6 py-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10"
          style={{ opacity }}
        >
          <span className="text-sm text-[var(--accent)]">{component.name}</span>
        </div>
      )
  }
}

/* ---------- prop control inputs ---------- */
function PropControl({ prop, value, onChange }: { prop: PropDef; value: string; onChange: (v: string) => void }) {
  if (prop.type === 'boolean') {
    return (
      <button
        onClick={() => onChange(value === 'true' ? 'false' : 'true')}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          value === 'true' ? 'bg-[var(--accent)]' : 'bg-[var(--bg-hover)]'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-[var(--text-inverse)] transition-transform"
          style={{ transform: value === 'true' ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>
    )
  }

  if (prop.type === 'enum' && prop.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
      >
        {prop.options.map((o) => (
          <option key={o} value={o} className="bg-[var(--bg-elevated)]">
            {o}
          </option>
        ))}
      </select>
    )
  }

  if (prop.type === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-40 px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
    />
  )
}

/* ---------- main export ---------- */
export function ComponentPreview({ component, propValues, onPropChange }: ComponentPreviewProps) {
  const [bgMode, setBgMode] = useState<BackgroundMode>('dark')
  const [states, setStates] = useState<Set<InteractionState>>(new Set())

  const toggleState = (s: InteractionState) => {
    setStates((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const bgStyles: Record<BackgroundMode, string> = {
    dark: 'bg-[var(--bg-base)]',
    light: 'bg-[var(--bg-surface)]',
    checkerboard: 'bg-[var(--bg-base)]',
  }

  const checkerBg =
    bgMode === 'checkerboard'
      ? {
          backgroundImage:
            'linear-gradient(45deg, rgba(127,127,127,0.08) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.08) 75%), linear-gradient(45deg, rgba(127,127,127,0.08) 25%, transparent 25%, transparent 75%, rgba(127,127,127,0.08) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }
      : undefined

  return (
    <div className="space-y-4">
      {/* Canvas controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5">
          {(['dark', 'light', 'checkerboard'] as BackgroundMode[]).map((mode) => {
            const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Grid3X3
            return (
              <button
                key={mode}
                onClick={() => setBgMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                  bgMode === mode ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>

        {/* State toggles */}
        <div className="flex items-center gap-1.5">
          {(['hover', 'focus', 'active', 'disabled'] as InteractionState[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleState(s)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                states.has(s)
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-[var(--bg-surface)]'
              }`}
            >
              :{s}
            </button>
          ))}
        </div>
      </div>

      {/* Preview canvas */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl border border-[var(--border-subtle)] min-h-[300px] flex items-center justify-center ${bgStyles[bgMode]}`}
        style={checkerBg}
      >
        {renderComponentPlaceholder(component, propValues, states)}
      </motion.div>

      {/* Prop controls */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Props Playground</h4>
        <div className="grid grid-cols-2 gap-2">
          {component.props.map((prop) => (
            <div
              key={prop.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-[var(--text-primary)] truncate">{prop.name}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{prop.type}</span>
              </div>
              <PropControl
                prop={prop}
                value={propValues[prop.name] ?? prop.defaultValue}
                onChange={(v) => onPropChange(prop.name, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Live JSX output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Live JSX</h4>
          <button
            onClick={() => {
              const code = generateJSX(component, propValues)
              navigator.clipboard?.writeText(code)
            }}
            className="px-2 py-0.5 rounded text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
          <code>{generateJSX(component, propValues)}</code>
        </pre>
      </div>

      {/* Token bindings summary */}
      {component.tokenBindings && component.tokenBindings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Active Token Bindings</h4>
          <div className="flex flex-wrap gap-1.5">
            {component.tokenBindings.map((tb, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[10px] text-[var(--accent)] font-mono"
              >
                <span className="text-[var(--text-tertiary)]">{tb.property}</span>
                <span>→</span>
                <span>{tb.tokenPath}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
