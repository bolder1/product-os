'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Droplets, Sun, Palette } from 'lucide-react'
import type { EffectsConfig, ShadowToken, GradientToken } from '../_data/default-brand'

interface EffectsSystemProps {
  effects: EffectsConfig
  onChange: (e: EffectsConfig) => void
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
      onChange(Math.max(min ?? -999, Math.min(max ?? 999, n)))
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

// ── Shadow Editor Row ──

function ShadowEditor({
  shadow,
  onUpdate,
}: {
  shadow: ShadowToken
  onUpdate: (updates: Partial<ShadowToken>) => void
}) {
  const cssValue = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#F1F5F9]">{shadow.label}</h4>
        <div
          className="w-14 h-14 rounded-xl bg-white/[0.06] border border-white/[0.08]"
          style={{ boxShadow: cssValue }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-[#64748B]">Offset X</span>
          <EditableNumber
            value={shadow.offsetX}
            onChange={(v) => onUpdate({ offsetX: v })}
            unit="px"
            min={-50}
            max={50}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-[#64748B]">Offset Y</span>
          <EditableNumber
            value={shadow.offsetY}
            onChange={(v) => onUpdate({ offsetY: v })}
            unit="px"
            min={-50}
            max={50}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-[#64748B]">Blur</span>
          <EditableNumber
            value={shadow.blur}
            onChange={(v) => onUpdate({ blur: v })}
            unit="px"
            min={0}
            max={100}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-[#64748B]">Spread</span>
          <EditableNumber
            value={shadow.spread}
            onChange={(v) => onUpdate({ spread: v })}
            unit="px"
            min={-50}
            max={50}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[9px] text-[#64748B]">Color</span>
        <input
          type="text"
          value={shadow.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
          className="flex-1 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] text-xs font-mono focus:outline-none focus:border-[#EC4899]/50"
        />
      </div>
    </div>
  )
}

// ── Glass Morphism Section ──

function GlassMorphismEditor({
  backdropBlur,
  onBlurChange,
}: {
  backdropBlur: number
  onBlurChange: (v: number) => void
}) {
  const [opacity, setOpacity] = useState(5)

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="w-4 h-4 text-[#EC4899]" />
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Glass Morphism</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94A3B8]">Backdrop Blur</span>
              <span className="text-xs font-mono text-[#64748B]">{backdropBlur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={backdropBlur}
              onChange={(e) => onBlurChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-[#EC4899] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94A3B8]">Surface Opacity</span>
              <span className="text-xs font-mono text-[#64748B]">{opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-[#EC4899] cursor-pointer"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="relative h-40 rounded-xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EC4899]/30 via-[#8B5CF6]/30 to-[#3B82F6]/30" />
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-2 opacity-40">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="rounded"
                style={{
                  backgroundColor: i % 3 === 0 ? '#EC4899' : i % 3 === 1 ? '#8B5CF6' : '#3B82F6',
                  opacity: 0.3 + (i % 4) * 0.15,
                }}
              />
            ))}
          </div>
          {/* Glass card */}
          <div
            className="absolute inset-4 rounded-xl border border-white/[0.1] flex items-center justify-center"
            style={{
              backdropFilter: `blur(${backdropBlur}px)`,
              WebkitBackdropFilter: `blur(${backdropBlur}px)`,
              backgroundColor: `rgba(255,255,255,${opacity / 100})`,
            }}
          >
            <span className="text-sm font-medium text-white/80">Glass Surface</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Gradient Builder ──

function GradientEditor({
  gradient,
  onUpdate,
}: {
  gradient: GradientToken
  onUpdate: (g: GradientToken) => void
}) {
  const cssGradient = `linear-gradient(${gradient.direction}deg, ${gradient.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')})`

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#F1F5F9]">{gradient.label}</h4>
      </div>

      <div
        className="h-12 rounded-lg mb-3"
        style={{ background: cssGradient }}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-[#64748B]">Angle</span>
          <EditableNumber
            value={gradient.direction}
            onChange={(v) => onUpdate({ ...gradient, direction: v })}
            unit="deg"
            min={0}
            max={360}
          />
        </div>

        {gradient.stops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-[#64748B]">Stop {idx + 1}</span>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => {
                    const newStops = [...gradient.stops]
                    newStops[idx] = { ...newStops[idx], color: e.target.value }
                    onUpdate({ ...gradient, stops: newStops })
                  }}
                  className="w-6 h-6 rounded border border-white/[0.08] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={stop.color}
                  onChange={(e) => {
                    const newStops = [...gradient.stops]
                    newStops[idx] = { ...newStops[idx], color: e.target.value }
                    onUpdate({ ...gradient, stops: newStops })
                  }}
                  className="w-20 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] text-[10px] font-mono focus:outline-none focus:border-[#EC4899]/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] font-mono text-[#64748B] truncate">{cssGradient}</p>
    </div>
  )
}

// ── Glow Effects ──

function GlowEditor({
  glowEnabled,
  glowColor,
  glowIntensity,
  onToggle,
  onColorChange,
  onIntensityChange,
}: {
  glowEnabled: boolean
  glowColor: string
  glowIntensity: number
  onToggle: () => void
  onColorChange: (c: string) => void
  onIntensityChange: (v: number) => void
}) {
  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-4 h-4 text-[#EC4899]" />
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Glow Effects</h3>
        <button
          onClick={onToggle}
          className={`ml-auto w-10 h-5 rounded-full transition-colors relative ${
            glowEnabled ? 'bg-[#EC4899]' : 'bg-white/[0.1]'
          }`}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-white absolute top-0.5"
            animate={{ left: glowEnabled ? '22px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {glowEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">Color</span>
            <input
              type="color"
              value={glowColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-white/[0.08] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={glowColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-24 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] text-xs font-mono focus:outline-none focus:border-[#EC4899]/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94A3B8]">Intensity</span>
              <span className="text-xs font-mono text-[#64748B]">{glowIntensity}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={glowIntensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] accent-[#EC4899] cursor-pointer"
            />
          </div>

          {/* Glow Preview */}
          <div className="flex items-center justify-center py-4">
            <motion.div
              className="w-24 h-24 rounded-2xl bg-white/[0.06] border border-white/[0.1]"
              animate={{
                boxShadow: `0 0 ${glowIntensity}px ${glowIntensity / 3}px ${glowColor}40`,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Main Component ──

export default function EffectsSystem({ effects, onChange }: EffectsSystemProps) {
  const handleShadowUpdate = useCallback(
    (shadowId: string, updates: Partial<ShadowToken>) => {
      onChange({
        ...effects,
        shadows: effects.shadows.map((s) =>
          s.id === shadowId ? { ...s, ...updates } : s
        ),
      })
    },
    [effects, onChange]
  )

  const handleGradientUpdate = useCallback(
    (gradientId: string, updated: GradientToken) => {
      onChange({
        ...effects,
        gradients: effects.gradients.map((g) =>
          g.id === gradientId ? updated : g
        ),
      })
    },
    [effects, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Shadow Editor */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#EC4899]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Shadows</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {effects.shadows.map((shadow) => (
            <ShadowEditor
              key={shadow.id}
              shadow={shadow}
              onUpdate={(updates) => handleShadowUpdate(shadow.id, updates)}
            />
          ))}
        </div>
      </div>

      {/* Glass Morphism */}
      <GlassMorphismEditor
        backdropBlur={effects.backdropBlur}
        onBlurChange={(v) => onChange({ ...effects, backdropBlur: v })}
      />

      {/* Gradients */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-[#EC4899]" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Gradients</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {effects.gradients.map((gradient) => (
            <GradientEditor
              key={gradient.id}
              gradient={gradient}
              onUpdate={(g) => handleGradientUpdate(gradient.id, g)}
            />
          ))}
        </div>
      </div>

      {/* Glow */}
      <GlowEditor
        glowEnabled={effects.glowEnabled}
        glowColor={effects.glowColor}
        glowIntensity={effects.glowIntensity}
        onToggle={() => onChange({ ...effects, glowEnabled: !effects.glowEnabled })}
        onColorChange={(c) => onChange({ ...effects, glowColor: c })}
        onIntensityChange={(v) => onChange({ ...effects, glowIntensity: v })}
      />
    </div>
  )
}
