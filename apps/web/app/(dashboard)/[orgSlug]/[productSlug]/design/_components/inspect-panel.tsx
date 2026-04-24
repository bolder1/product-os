'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import type { ElementDef } from '../_data/mock-screens'

interface InspectPanelProps {
  element: ElementDef | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/[0.06] transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />
      )}
    </button>
  )
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--text-primary)] font-mono">{value}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={value} />
        </div>
      </div>
    </div>
  )
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <div
        className="w-5 h-5 rounded border border-white/[0.08] shrink-0"
        style={{ background: color }}
      />
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="text-[10px] text-[var(--text-tertiary)] truncate">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate">{color}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={color} />
          </div>
        </div>
      </div>
    </div>
  )
}

function generateCSS(el: ElementDef): string {
  const lines: string[] = []
  lines.push(`/* ${el.type} */`)
  lines.push(`.element {`)
  lines.push(`  position: absolute;`)
  lines.push(`  left: ${el.x}px;`)
  lines.push(`  top: ${el.y}px;`)
  lines.push(`  width: ${el.width}px;`)
  lines.push(`  height: ${el.height}px;`)
  Object.entries(el.style).forEach(([k, v]) => {
    if (k.startsWith('_')) return
    const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase()
    lines.push(`  ${cssKey}: ${v};`)
  })
  lines.push(`}`)
  return lines.join('\n')
}

export default function InspectPanel({ element }: InspectPanelProps) {
  const [cssCopied, setCssCopied] = useState(false)

  if (!element) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-sm text-[var(--text-tertiary)]">Inspect Mode</p>
          <p className="text-[11px] text-[var(--text-tertiary)]">Select an element to see its CSS properties</p>
        </div>
      </div>
    )
  }

  const css = generateCSS(element)

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(css).then(() => {
      setCssCopied(true)
      setTimeout(() => setCssCopied(false), 2000)
    })
  }

  const bgColor = element.style.background || 'transparent'
  const textColor = element.style.color || 'inherit'
  const padding = element.style.padding || '0'
  const margin = element.style.margin || '0'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
            <span className="text-[10px] text-indigo-400 font-bold">&lt;/&gt;</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Inspect: {element.type}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{element.id}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* Spacing visualization */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-3">Spacing</p>
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Margin box */}
              <div className="border border-dashed border-amber-500/30 rounded-lg p-3">
                <p className="absolute -top-2 left-2 text-[8px] text-amber-500/60 bg-[#0d1129] px-1">margin</p>
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-amber-400/60 font-mono">{margin}</span>
                {/* Padding box */}
                <div className="border border-dashed border-emerald-500/30 rounded-md p-3 relative">
                  <p className="absolute -top-2 left-2 text-[8px] text-emerald-500/60 bg-[#0d1129] px-1">padding</p>
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400/60 font-mono">{padding}</span>
                  {/* Content box */}
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded px-4 py-2 text-center">
                    <span className="text-[10px] text-violet-300 font-mono">
                      {element.width} x {element.height}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS Properties */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-2">Properties</p>
          <div className="divide-y divide-white/[0.04]">
            <PropRow label="Position" value={`${element.x}, ${element.y}`} />
            <PropRow label="Size" value={`${element.width} x ${element.height}`} />
            <PropRow label="Border Radius" value={element.style.borderRadius || '0'} />
            {element.style.fontSize && <PropRow label="Font Size" value={element.style.fontSize} />}
            {element.style.fontWeight && <PropRow label="Font Weight" value={element.style.fontWeight} />}
            {element.style.opacity && <PropRow label="Opacity" value={element.style.opacity} />}
          </div>
        </div>

        {/* Colors */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-2">Colors</p>
          <div className="space-y-1">
            <ColorSwatch color={bgColor} label="Background" />
            {element.style.color && <ColorSwatch color={textColor} label="Text Color" />}
            {element.style.border && element.style.border !== 'none' && (
              <ColorSwatch color={element.style.border} label="Border" />
            )}
          </div>
        </div>

        {/* Typography */}
        {element.style.fontSize && (
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-2">Typography</p>
            <div className="divide-y divide-white/[0.04]">
              <PropRow label="Font Size" value={element.style.fontSize} />
              <PropRow label="Weight" value={element.style.fontWeight || '400'} />
              <PropRow label="Alignment" value={element.style.textAlign || 'left'} />
              <PropRow label="Color" value={element.style.color || 'inherit'} />
            </div>
          </div>
        )}

        {/* CSS Output */}
        <div className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-2">Generated CSS</p>
          <pre className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 text-[10px] text-[var(--text-secondary)] font-mono leading-relaxed overflow-x-auto whitespace-pre">
            {css}
          </pre>
        </div>
      </div>

      {/* Copy CSS Button */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCopyCSS}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
            cssCopied
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-white/[0.04] border border-white/[0.08] text-[var(--text-primary)] hover:bg-white/[0.06]'
          }`}
        >
          {cssCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy CSS
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
