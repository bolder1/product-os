'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Ruler, Square, Layers } from 'lucide-react'
import type { SpacingConfig, RadiusToken, SpacingToken } from '../_data/default-brand'

interface SpacingSystemProps {
  spacing: SpacingConfig
  onChange: (s: SpacingConfig) => void
}

// ── Editable Number ──

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
      onChange(Math.max(min ?? 0, Math.min(max ?? 99999, n)))
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
        className="w-16 px-2 py-0.5 rounded bg-white/[0.06] border border-[#EC4899]/40 text-[#F1F5F9] text-xs font-mono focus:outline-none text-center"
      />
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] text-xs font-mono hover:border-white/[0.15] transition-colors cursor-pointer"
    >
      {value}{unit}
    </button>
  )
}

// ── Spacing Scale Row ──

function SpacingRow({
  token,
  maxValue,
}: {
  token: SpacingToken
  maxValue: number
}) {
  const barWidth = maxValue > 0 ? (token.value / maxValue) * 100 : 0

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-16 shrink-0 text-right">
        <span className="text-xs font-mono text-[#94A3B8]">{token.multiplier}x</span>
      </div>
      <div className="w-16 shrink-0 text-right">
        <span className="text-xs font-mono text-[#64748B]">{token.value}px</span>
      </div>
      <div className="flex-1">
        <motion.div
          className="h-6 rounded bg-[#EC4899]/20 border border-[#EC4899]/30"
          initial={false}
          animate={{ width: `${Math.max(barWidth, 1)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ minWidth: token.value > 0 ? '4px' : '2px' }}
        />
      </div>
    </div>
  )
}

// ── Radius Preview ──

function RadiusPreview({
  radius,
  onUpdate,
}: {
  radius: RadiusToken
  onUpdate: (value: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="w-16 h-16 bg-[#EC4899]/20 border border-[#EC4899]/40"
        animate={{ borderRadius: radius.value >= 9999 ? '50%' : `${radius.value}px` }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
      <span className="text-xs font-semibold text-[#F1F5F9]">{radius.label}</span>
      <EditableNumber
        value={radius.value >= 9999 ? 9999 : radius.value}
        onChange={onUpdate}
        unit="px"
        min={0}
        max={9999}
      />
    </div>
  )
}

// ── Shadow Preview ──

function ShadowPreview({
  id,
  label,
  shadow,
}: {
  id: string
  label: string
  shadow: string
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-20 h-20 rounded-xl bg-white/[0.06] border border-white/[0.08]"
        style={{ boxShadow: shadow }}
      />
      <span className="text-xs font-semibold text-[#F1F5F9]">{label}</span>
      <span className="text-[10px] font-mono text-[#64748B] max-w-[120px] text-center truncate">
        {shadow}
      </span>
    </div>
  )
}

// ── Main Component ──

export default function SpacingSystem({ spacing, onChange }: SpacingSystemProps) {
  const maxValue = Math.max(...spacing.scale.map((s) => s.value), 1)

  const handleBaseUnitChange = useCallback(
    (newBase: number) => {
      onChange({
        ...spacing,
        baseUnit: newBase,
        scale: spacing.scale.map((s) => ({
          ...s,
          value: s.multiplier * newBase,
        })),
      })
    },
    [spacing, onChange]
  )

  const handleRadiusChange = useCallback(
    (radiusId: string, value: number) => {
      onChange({
        ...spacing,
        radii: spacing.radii.map((r) =>
          r.id === radiusId ? { ...r, value } : r
        ),
      })
    },
    [spacing, onChange]
  )

  // Generate CSS shadow strings from spacing config effects
  const shadowValues: Record<string, string> = {
    sm: '0 1px 3px 0 rgba(0,0,0,0.12)',
    md: '0 4px 12px -2px rgba(0,0,0,0.15)',
    lg: '0 12px 32px -4px rgba(0,0,0,0.2)',
    xl: '0 24px 48px -8px rgba(0,0,0,0.25)',
  }

  return (
    <div className="space-y-6">
      {/* Base Unit */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#EC4899]" />
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Base Unit</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">Base:</span>
            <EditableNumber
              value={spacing.baseUnit}
              onChange={handleBaseUnitChange}
              unit="px"
              min={1}
              max={16}
            />
          </div>
        </div>

        {/* Spacing Scale */}
        <div className="space-y-0">
          {spacing.scale.map((token) => (
            <SpacingRow key={token.key} token={token} maxValue={maxValue} />
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <Square className="w-4 h-4 text-[#EC4899]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Border Radius</h3>
        </div>
        <div className="flex gap-6 flex-wrap justify-center">
          {spacing.radii.map((r) => (
            <RadiusPreview
              key={r.id}
              radius={r}
              onUpdate={(v) => handleRadiusChange(r.id, v)}
            />
          ))}
        </div>
      </div>

      {/* Shadow Previews */}
      <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-[#EC4899]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Shadows</h3>
        </div>
        <div className="flex gap-6 flex-wrap justify-center">
          {Object.entries(shadowValues).map(([key, value]) => (
            <ShadowPreview
              key={key}
              id={key}
              label={key.toUpperCase()}
              shadow={value}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
