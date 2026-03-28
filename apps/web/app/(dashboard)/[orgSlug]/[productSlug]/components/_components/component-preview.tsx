'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Moon, Sun, Grid3X3 } from 'lucide-react'
import { type ComponentDef, type PropDef, categoryColors } from '../_data/mock-components'

type BackgroundMode = 'dark' | 'light' | 'checkerboard'
type InteractionState = 'hover' | 'focus' | 'active' | 'disabled'

interface ComponentPreviewProps {
  component: ComponentDef
  propValues: Record<string, string>
  onPropChange: (propName: string, value: string) => void
}

/* ---------- visual placeholder for each component type ---------- */
function renderComponentPlaceholder(
  component: ComponentDef,
  propValues: Record<string, string>,
  states: Set<InteractionState>
) {
  const accent = categoryColors[component.category] ?? '#06B6D4'
  const isDisabled = states.has('disabled') || propValues.disabled === 'true'
  const opacity = isDisabled ? 0.4 : 1

  switch (component.name) {
    case 'Button': {
      const v = propValues.variant ?? 'primary'
      const filled = v === 'primary' || v === 'destructive'
      const bg = v === 'destructive' ? '#EF4444' : filled ? accent : 'transparent'
      const border = filled ? 'none' : `1px solid ${accent}`
      const sz = propValues.size === 'lg' ? 'px-6 py-2.5 text-sm' : propValues.size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
      return (
        <button
          disabled={isDisabled}
          className={`rounded-lg font-medium text-white ${sz} transition-all`}
          style={{ backgroundColor: bg, border, opacity, filter: states.has('hover') ? 'brightness(1.15)' : undefined }}
        >
          {propValues.label ?? 'Click me'}
        </button>
      )
    }
    case 'Input': {
      const hasError = propValues.error === 'true'
      return (
        <div className="w-64" style={{ opacity }}>
          {propValues.label && <label className="block text-xs text-[#94A3B8] mb-1">{propValues.label}</label>}
          <div
            className="w-full px-3 py-2 rounded-lg text-sm text-[#F1F5F9]"
            style={{ border: `1px solid ${hasError ? '#EF4444' : 'rgba(255,255,255,0.08)'}`, backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <span className="text-[#64748B]">{propValues.placeholder ?? 'Enter text...'}</span>
          </div>
          {propValues.helperText && (
            <p className={`text-xs mt-1 ${hasError ? 'text-red-400' : 'text-[#64748B]'}`}>{propValues.helperText}</p>
          )}
        </div>
      )
    }
    case 'Card':
      return (
        <div
          className="w-64 rounded-xl p-4"
          style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)', opacity }}
        >
          <h3 className="text-sm font-medium text-[#F1F5F9]">{propValues.title ?? 'Card Title'}</h3>
          <p className="text-xs text-[#64748B] mt-1">Card content goes here.</p>
        </div>
      )
    case 'Badge': {
      const vColors: Record<string, string> = { default: '#94A3B8', success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' }
      const c = vColors[propValues.variant ?? 'default'] ?? '#94A3B8'
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${c}20`, color: c, opacity }}>
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
          className="rounded-full flex items-center justify-center font-medium text-white"
          style={{ width: sz, height: sz, backgroundColor: accent, fontSize: sz * 0.35, opacity }}
        >
          {initials}
        </div>
      )
    }
    case 'Modal':
      return (
        <div className="w-72 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#0c1125', opacity }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-[#F1F5F9]">{propValues.title ?? 'Modal Title'}</span>
            {propValues.closable !== 'false' && <span className="text-[#64748B] cursor-pointer">×</span>}
          </div>
          <div className="p-4">
            <p className="text-xs text-[#64748B]">Modal body content area.</p>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-white/[0.06]">
            <span className="px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] bg-white/[0.05]">Cancel</span>
            <span className="px-3 py-1.5 rounded-lg text-xs text-white" style={{ backgroundColor: accent }}>Confirm</span>
          </div>
        </div>
      )
    case 'Table': {
      const cols = Number(propValues.columns ?? 4)
      const striped = propValues.striped === 'true'
      const compact = propValues.compact === 'true'
      const py = compact ? 'py-1' : 'py-2'
      return (
        <div className="w-80 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', opacity }}>
          <div className={`grid px-3 ${py} border-b border-white/[0.06]`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <span key={i} className="text-[10px] font-medium text-[#64748B]">Col {i + 1}</span>
            ))}
          </div>
          {[0, 1, 2].map((r) => (
            <div key={r} className={`grid px-3 ${py}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, backgroundColor: striped && r % 2 ? 'rgba(255,255,255,0.02)' : undefined }}>
              {Array.from({ length: cols }).map((_, i) => (
                <span key={i} className="text-[10px] text-[#94A3B8]">Cell</span>
              ))}
            </div>
          ))}
        </div>
      )
    }
    case 'Tabs': {
      const items = Number(propValues.items ?? 3)
      const v = propValues.variant ?? 'default'
      return (
        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: v === 'pill' ? 'rgba(255,255,255,0.03)' : undefined, borderBottom: v === 'underline' ? '1px solid rgba(255,255,255,0.06)' : undefined, opacity }}>
          {Array.from({ length: items }).map((_, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: i === 0 ? (v === 'pill' ? `${accent}20` : v === 'default' ? `${accent}15` : 'transparent') : 'transparent',
                color: i === 0 ? accent : '#64748B',
                borderBottom: i === 0 && v === 'underline' ? `2px solid ${accent}` : undefined,
              }}
            >
              Tab {i + 1}
            </span>
          ))}
        </div>
      )
    }
    case 'Alert': {
      const vColors: Record<string, string> = { info: '#3B82F6', success: '#10B981', warning: '#F59E0B', error: '#EF4444' }
      const c = vColors[propValues.variant ?? 'info'] ?? '#3B82F6'
      return (
        <div className="w-72 flex items-start gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: `${c}10`, border: `1px solid ${c}30`, opacity }}>
          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: c }} />
          <span className="text-xs" style={{ color: c }}>{propValues.message ?? 'Alert message'}</span>
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
              <span className={i === items - 1 ? 'text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#94A3B8]'}>
                {i === 0 ? 'Home' : i === items - 1 ? 'Current' : `Page ${i}`}
              </span>
              {i < items - 1 && <span className="text-[#64748B]">{sep}</span>}
            </span>
          ))}
        </div>
      )
    }
    default:
      return (
        <div className="px-6 py-4 rounded-lg" style={{ border: `1px solid ${accent}30`, backgroundColor: `${accent}10`, opacity }}>
          <span className="text-sm" style={{ color: accent }}>{component.name}</span>
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
          value === 'true' ? 'bg-[#06B6D4]' : 'bg-white/[0.1]'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
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
        className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#06B6D4]/50"
      >
        {prop.options.map((o) => (
          <option key={o} value={o} className="bg-[#0c1125]">
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
        className="w-20 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#06B6D4]/50"
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-40 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#06B6D4]/50"
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
    dark: 'bg-[#0a0f1e]',
    light: 'bg-[#1e293b]',
    checkerboard: 'bg-[#0a0f1e]',
  }

  const checkerBg =
    bgMode === 'checkerboard'
      ? {
          backgroundImage:
            'linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%), linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }
      : undefined

  return (
    <div className="space-y-4">
      {/* Canvas controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {(['dark', 'light', 'checkerboard'] as BackgroundMode[]).map((mode) => {
            const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Grid3X3
            return (
              <button
                key={mode}
                onClick={() => setBgMode(mode)}
                className={`p-1.5 rounded-md transition-colors ${
                  bgMode === mode ? 'bg-[#06B6D4]/15 text-[#06B6D4]' : 'text-[#64748B] hover:text-[#94A3B8]'
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
                  ? 'bg-[#06B6D4]/15 text-[#06B6D4]'
                  : 'text-[#64748B] hover:text-[#94A3B8] bg-white/[0.03]'
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
        className={`rounded-xl border border-white/[0.06] min-h-[300px] flex items-center justify-center ${bgStyles[bgMode]}`}
        style={checkerBg}
      >
        {renderComponentPlaceholder(component, propValues, states)}
      </motion.div>

      {/* Prop controls */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Props</h4>
        <div className="grid grid-cols-2 gap-2">
          {component.props.map((prop) => (
            <div key={prop.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-[#F1F5F9] truncate">{prop.name}</span>
                <span className="text-[10px] text-[#64748B]">{prop.type}</span>
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
    </div>
  )
}
