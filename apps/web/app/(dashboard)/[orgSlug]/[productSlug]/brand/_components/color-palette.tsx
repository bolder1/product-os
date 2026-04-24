'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, Check, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ColorGroup } from '../_data/default-brand'
import { generateScale } from '../_data/default-brand'

interface ColorPaletteProps {
  colorGroups: ColorGroup[]
  onChange: (groups: ColorGroup[]) => void
}

// ── WCAG contrast helpers ──

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const srgb = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function contrastRatio(hex1: string, hex2: string) {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ── Swatch Component ──

function ColorSwatch({
  color,
  label,
  isLarge,
  onClick,
}: {
  color: string
  label: string
  isLarge?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-lg relative group cursor-pointer ${
        isLarge ? 'w-16 h-16' : 'w-10 h-10'
      }`}
      style={{ backgroundColor: color, boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2)` }}
      title={`${label}: ${color}`}
    >
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {label}
      </span>
    </motion.button>
  )
}

// ── Inline Color Picker ──

function InlineColorPicker({
  value,
  onChange,
  onClose,
}: {
  value: string
  onChange: (hex: string) => void
  onClose: () => void
}) {
  const [hex, setHex] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleHexChange = (val: string) => {
    setHex(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute z-50 top-full mt-2 left-0 p-3 rounded-xl border border-white/[0.08] bg-[#0C1024] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-white/[0.08] cursor-pointer bg-transparent"
        />
        <input
          ref={inputRef}
          type="text"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-28 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]/50"
          placeholder="#000000"
        />
      </div>
      <button
        onClick={onClose}
        className="w-full py-1.5 rounded-lg bg-white/[0.06] text-[var(--text-secondary)] text-xs hover:bg-white/[0.1] transition-colors"
      >
        Done
      </button>
    </motion.div>
  )
}

// ── Color Group Card ──

function ColorGroupCard({
  group,
  onChangeBase,
}: {
  group: ColorGroup
  onChangeBase: (hex: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const scaleKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1200)
  }

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{group.label}</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{group.semantic}</p>
        </div>
        <div className="relative">
          <ColorSwatch
            color={group.token.base}
            label={group.token.base}
            isLarge
            onClick={() => setPickerOpen(!pickerOpen)}
          />
          <AnimatePresence>
            {pickerOpen && (
              <InlineColorPicker
                value={group.token.base}
                onChange={onChangeBase}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {scaleKeys.map((key) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => copyToClipboard(group.token.scale[key], key)}
              className="w-8 h-8 rounded-md relative"
              style={{
                backgroundColor: group.token.scale[key],
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <AnimatePresence>
                {copiedKey === key && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <span className="text-[9px] text-[var(--text-tertiary)] font-mono">{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Contrast Checker ──

function ContrastChecker({ colorGroups }: { colorGroups: ColorGroup[] }) {
  const [fgIdx, setFgIdx] = useState(0)
  const [bgIdx, setBgIdx] = useState(3)

  const fg = colorGroups[fgIdx]?.token.base ?? '#FFFFFF'
  const bg = colorGroups[bgIdx]?.token.base ?? '#000000'
  const ratio = contrastRatio(fg, bg)
  const passAA = ratio >= 4.5
  const passAAA = ratio >= 7

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Contrast Checker</h3>
      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Foreground</label>
          <select
            value={fgIdx}
            onChange={(e) => setFgIdx(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]/50"
          >
            {colorGroups.map((g, i) => (
              <option key={g.id} value={i} className="bg-[#0C1024]">
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Background</label>
          <select
            value={bgIdx}
            onChange={(e) => setBgIdx(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]/50"
          >
            {colorGroups.map((g, i) => (
              <option key={g.id} value={i} className="bg-[#0C1024]">
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="p-4 rounded-lg mb-3 text-center font-semibold"
        style={{ backgroundColor: bg, color: fg }}
      >
        Sample Text — {ratio.toFixed(2)}:1
      </div>

      <div className="flex gap-3">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${passAA ? 'text-emerald-400' : 'text-rose-400'}`}>
          {passAA ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          WCAG AA {passAA ? 'Pass' : 'Fail'}
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${passAAA ? 'text-emerald-400' : 'text-amber-400'}`}>
          {passAAA ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          WCAG AAA {passAAA ? 'Pass' : 'Fail'}
        </div>
      </div>
    </div>
  )
}

// ── CSS Variables Export ──

function CSSExport({ colorGroups }: { colorGroups: ColorGroup[] }) {
  const [copied, setCopied] = useState(false)

  const cssVars = colorGroups
    .flatMap((g) => {
      const lines = [`  --color-${g.token.name}: ${g.token.base};`]
      Object.entries(g.token.scale).forEach(([key, val]) => {
        lines.push(`  --color-${g.token.name}-${key}: ${val};`)
      })
      return lines
    })
    .join('\n')

  const fullCSS = `:root {\n${cssVars}\n}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCSS)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">CSS Variables</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] text-[var(--text-secondary)] text-xs hover:bg-white/[0.1] transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-[11px] leading-relaxed text-[var(--text-secondary)] font-mono overflow-x-auto max-h-48 overflow-y-auto p-3 rounded-lg bg-white/[0.02]">
        {fullCSS}
      </pre>
    </div>
  )
}

// ── Main Component ──

export default function ColorPalette({ colorGroups, onChange }: ColorPaletteProps) {
  const handleChangeBase = useCallback(
    (groupId: string, hex: string) => {
      onChange(
        colorGroups.map((g) =>
          g.id === groupId
            ? { ...g, token: { ...g.token, base: hex, scale: generateScale(hex) } }
            : g
        )
      )
    },
    [colorGroups, onChange]
  )

  const handleAddGroup = useCallback(() => {
    const id = `custom-${Date.now()}`
    const newGroup: ColorGroup = {
      id,
      label: 'Custom',
      semantic: 'Custom color group',
      token: { name: id, base: '#6366F1', scale: generateScale('#6366F1') },
    }
    onChange([...colorGroups, newGroup])
  }, [colorGroups, onChange])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {colorGroups.map((group) => (
          <ColorGroupCard
            key={group.id}
            group={group}
            onChangeBase={(hex) => handleChangeBase(group.id, hex)}
          />
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddGroup}
        className="w-full py-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-2 hover:bg-white/[0.04] hover:border-[var(--accent)]/30 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Custom Color Group
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContrastChecker colorGroups={colorGroups} />
        <CSSExport colorGroups={colorGroups} />
      </div>
    </div>
  )
}
