'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Type, ChevronDown } from 'lucide-react'
import type { TypographyConfig, TypeScaleStep } from '../_data/default-brand'
import { fontOptions, codeFontOptions } from '../_data/default-brand'

interface TypographySystemProps {
  typography: TypographyConfig
  onChange: (t: TypographyConfig) => void
}

// ── Font Selector ──

function FontSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options?: string[]
}) {
  const [open, setOpen] = useState(false)
  const list = options ?? fontOptions

  return (
    <div className="relative">
      <label className="text-xs text-[var(--text-tertiary)] mb-1.5 block">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[var(--text-primary)] text-sm hover:border-white/[0.15] transition-colors"
      >
        <span style={{ fontFamily: value }}>{value}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-40 top-full mt-1 w-full rounded-xl border border-white/[0.08] bg-[#0C1024] shadow-xl overflow-hidden"
        >
          {list.map((font) => (
            <button
              key={font}
              onClick={() => {
                onChange(font)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors ${
                font === value ? 'text-[var(--accent)] bg-white/[0.03]' : 'text-[var(--text-primary)]'
              }`}
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── Editable Number Field ──

function EditableNumber({
  value,
  onChange,
  unit,
  min,
  max,
  step,
}: {
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  step?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const commit = () => {
    const n = parseFloat(draft)
    if (!isNaN(n)) {
      onChange(Math.max(min ?? 0, Math.min(max ?? 999, n)))
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        step={step ?? 1}
        min={min}
        max={max}
        className="w-16 px-2 py-0.5 rounded bg-white/[0.06] border border-[var(--accent)]/40 text-[var(--text-primary)] text-xs font-mono focus:outline-none text-center"
      />
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.08] text-[var(--text-secondary)] text-xs font-mono hover:border-white/[0.15] transition-colors cursor-pointer"
    >
      {value}{unit}
    </button>
  )
}

// ── Scale Row ──

function ScaleRow({
  step,
  font,
  onUpdate,
}: {
  step: TypeScaleStep
  font: string
  onUpdate: (updates: Partial<TypeScaleStep>) => void
}) {
  const isHeading = step.id.startsWith('h') || step.id === 'display'

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.05] last:border-0">
      {/* Label */}
      <div className="w-24 shrink-0">
        <span className="text-xs font-medium text-[var(--accent)]">{step.label}</span>
      </div>

      {/* Editable properties */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-[var(--text-tertiary)] mb-0.5">Size</span>
          <EditableNumber value={step.size} onChange={(v) => onUpdate({ size: v })} unit="px" min={8} max={120} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-[var(--text-tertiary)] mb-0.5">Weight</span>
          <EditableNumber value={step.weight} onChange={(v) => onUpdate({ weight: v })} min={100} max={900} step={100} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-[var(--text-tertiary)] mb-0.5">LH</span>
          <EditableNumber value={step.lineHeight} onChange={(v) => onUpdate({ lineHeight: v })} min={0.8} max={3} step={0.05} />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-[var(--text-tertiary)] mb-0.5">LS</span>
          <EditableNumber value={step.letterSpacing} onChange={(v) => onUpdate({ letterSpacing: v })} min={-0.1} max={0.2} step={0.005} />
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p
          className="text-[var(--text-primary)] truncate"
          style={{
            fontFamily: font,
            fontSize: `${Math.min(step.size, 40)}px`,
            fontWeight: step.weight,
            lineHeight: step.lineHeight,
            letterSpacing: `${step.letterSpacing}em`,
            textTransform: step.id === 'overline' ? 'uppercase' : undefined,
          }}
        >
          {step.preview}
        </p>
      </div>
    </div>
  )
}

// ── Main Component ──

export default function TypographySystem({ typography, onChange }: TypographySystemProps) {
  const updateStep = useCallback(
    (stepId: string, updates: Partial<TypeScaleStep>) => {
      onChange({
        ...typography,
        scale: typography.scale.map((s) =>
          s.id === stepId ? { ...s, ...updates } : s
        ),
      })
    },
    [typography, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Font Family Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <FontSelector
          label="Heading Font"
          value={typography.headingFont}
          onChange={(v) => onChange({ ...typography, headingFont: v })}
        />
        <FontSelector
          label="Body Font"
          value={typography.bodyFont}
          onChange={(v) => onChange({ ...typography, bodyFont: v })}
        />
        <FontSelector
          label="Code Font"
          value={typography.codeFont}
          onChange={(v) => onChange({ ...typography, codeFont: v })}
          options={codeFontOptions}
        />
      </div>

      {/* Type Scale */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Type Scale</h3>
        </div>

        <div className="space-y-0">
          {typography.scale.map((step) => {
            const isHeading = step.id.startsWith('h') || step.id === 'display'
            return (
              <ScaleRow
                key={step.id}
                step={step}
                font={isHeading ? typography.headingFont : typography.bodyFont}
                onUpdate={(updates) => updateStep(step.id, updates)}
              />
            )
          })}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Live Preview</h3>
        <div className="space-y-4">
          {typography.scale.map((step) => {
            const isHeading = step.id.startsWith('h') || step.id === 'display'
            return (
              <div key={step.id} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 text-[10px] text-[var(--text-tertiary)] font-mono text-right">
                  {step.label}
                </span>
                <p
                  className="text-[var(--text-primary)]"
                  style={{
                    fontFamily: isHeading ? typography.headingFont : typography.bodyFont,
                    fontSize: `${step.size}px`,
                    fontWeight: step.weight,
                    lineHeight: step.lineHeight,
                    letterSpacing: `${step.letterSpacing}em`,
                    textTransform: step.id === 'overline' ? 'uppercase' : undefined,
                  }}
                >
                  {step.preview}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
