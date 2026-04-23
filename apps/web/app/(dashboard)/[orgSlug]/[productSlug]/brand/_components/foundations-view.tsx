'use client'

/**
 * R5 — Brand · Foundations view.
 *
 * Extracted from the original `/brand` page so the unified Brand shell can host
 * it alongside Voice and Compliance under one tabbed surface.
 */

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../../layout'
import { Save, Paintbrush, Type, Ruler, Layers, Eye, Check, Code2, Download, Copy } from 'lucide-react'
import { defaultBrandConfig } from '../_data/default-brand'
import type { BrandConfig, ColorGroup, TypographyConfig, SpacingConfig, EffectsConfig } from '../_data/default-brand'
import { useGraphStore } from '../../../../../lib/graph-store'
import { useBrandTokens } from '../../../../../lib/use-brand-tokens'
import { useEventBridge } from '../../../../../lib/use-event-bridge'
import { trpcMutate } from '../../../../../lib/api'
import ColorPalette from './color-palette'
import TypographySystem from './typography-system'
import SpacingSystem from './spacing-system'
import EffectsSystem from './effects-system'
import BrandPreview from './brand-preview'
import AIBrandPanel from './ai-brand-panel'
import { AIActionBar } from '../../../../../components/primitives/ai-action-bar'
import { ExportMenu } from '../../../../../components/primitives/export-menu'
import { outputPipeline } from '../../../../../lib/output-pipeline'

const subTabs = [
  { id: 'colors', label: 'Colors', icon: Paintbrush },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Ruler },
  { id: 'effects', label: 'Effects', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'export', label: 'Export', icon: Download },
] as const

type SubTabId = (typeof subTabs)[number]['id']

type ExportFormat = 'css' | 'tailwind' | 'json'

interface TokenExportTabProps {
  brandData: BrandConfig
  toCSSVariables: () => string
}

function TokenExportTab({ brandData, toCSSVariables }: TokenExportTabProps) {
  const [format, setFormat] = useState<ExportFormat>('css')
  const [copied, setCopied] = useState(false)

  const cssOutput = useMemo(() => toCSSVariables(), [toCSSVariables])
  const tailwindOutput = useMemo(() => {
    const varLines = cssOutput.split('\n').filter((l) => l.trim().startsWith('--'))
    const entries = varLines.map((l) => {
      const [key] = l.trim().replace(';', '').split(':')
      const name = key.replace(/^--/, '')
      return `    '${name}': 'var(${key})'`
    })
    return `// tailwind.config.js — extend.colors\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries.slice(0, 30).join(',\n')}\n      },\n    },\n  },\n}`
  }, [cssOutput])
  const jsonOutput = useMemo(() => {
    const colorMap: Record<string, string[]> = {}
    brandData.colorGroups?.forEach((g) => {
      const typedG = g as unknown as { name: string; colors?: { name: string; value: string }[] }
      colorMap[typedG.name] = typedG.colors?.map((c) => `${c.name}: ${c.value}`) ?? []
    })
    return JSON.stringify({ colors: colorMap }, null, 2)
  }, [brandData])

  const output = format === 'css' ? cssOutput : format === 'tailwind' ? tailwindOutput : jsonOutput

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const handleDownload = () => {
    const ext = format === 'tailwind' ? 'js' : format
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `brand-tokens.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formats: { key: ExportFormat; label: string; desc: string }[] = [
    { key: 'css',      label: 'CSS Variables',    desc: ':root { --color-primary: ... }' },
    { key: 'tailwind', label: 'Tailwind Config',   desc: "extend.colors: { 'brand-primary': 'var(--...)' }" },
    { key: 'json',     label: 'JSON Tokens',       desc: '{ "colors": { "primary": ["#6398ff", ...] } }' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 gap-4">
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Format</p>
        <div className="space-y-1.5">
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className="w-full flex flex-col gap-0.5 px-3 py-2 rounded-xl text-left transition-all border"
              style={{
                background: format === f.key ? 'var(--accent-muted)' : 'var(--bg-card)',
                borderColor: format === f.key ? 'var(--accent-text)' : 'var(--border-subtle)',
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: format === f.key ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                {f.label}
              </span>
              <span className="text-[9px] font-mono text-[var(--text-tertiary)] truncate">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Output</p>
          <div className="flex items-center gap-1.5">
            <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: 'var(--bg-inset)', color: copied ? 'var(--color-success)' : 'var(--text-secondary)' }}>
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}>
              <Download size={10} />Download
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto rounded-xl p-3 text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed"
          style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
          {output || '// No tokens defined yet'}
        </pre>
      </div>
    </div>
  )
}

export default function FoundationsView() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const allNodes = useGraphStore((s) => s.nodes)
  const addNode = useGraphStore((s) => s.addNode)
  const updateNode = useGraphStore((s) => s.updateNode)

  const tokenNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === 'token'),
    [allNodes, productId]
  )

  const [brandData, setBrandData] = useState<BrandConfig>(() => {
    const colorsNode = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === 'brand-colors')
    const typographyNode = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === 'brand-typography')
    const spacingNode = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === 'brand-spacing')
    const effectsNode = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === 'brand-effects')
    if (!colorsNode) return defaultBrandConfig
    try {
      return {
        colorGroups: colorsNode ? JSON.parse(String(colorsNode.data.payload)) : defaultBrandConfig.colorGroups,
        typography: typographyNode ? JSON.parse(String(typographyNode.data.payload)) : defaultBrandConfig.typography,
        spacing: spacingNode ? JSON.parse(String(spacingNode.data.payload)) : defaultBrandConfig.spacing,
        effects: effectsNode ? JSON.parse(String(effectsNode.data.payload)) : defaultBrandConfig.effects,
      }
    } catch {
      return defaultBrandConfig
    }
  })

  const brandTokens = useBrandTokens(productId)
  const emitEvent = useEventBridge()

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('colors')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleExportCSS = useCallback(() => {
    const css = brandTokens.toCSSVariables()
    navigator.clipboard.writeText(css).catch(() => {})
  }, [brandTokens])

  const handleSaveBrand = useCallback(async () => {
    if (saveState === 'saving') return
    setSaveState('saving')
    const sections: { tokenType: string; label: string; payload: unknown }[] = [
      { tokenType: 'brand-colors', label: 'Brand Colors', payload: brandData.colorGroups },
      { tokenType: 'brand-typography', label: 'Brand Typography', payload: brandData.typography },
      { tokenType: 'brand-spacing', label: 'Brand Spacing', payload: brandData.spacing },
      { tokenType: 'brand-effects', label: 'Brand Effects', payload: brandData.effects },
    ]
    for (const section of sections) {
      const existing = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === section.tokenType)
      if (existing) {
        updateNode(existing.id, { label: section.label, data: { tokenType: section.tokenType, payload: JSON.stringify(section.payload) } })
      } else {
        addNode({ kind: 'token', label: section.label, productId, data: { tokenType: section.tokenType, payload: JSON.stringify(section.payload) } })
      }
    }
    trpcMutate('activity.log', {
      productId, action: 'brand.token.updated', entityType: 'token', studioOrigin: 'brand',
      meta: { colorCount: brandData.colorGroups.length, fonts: [brandData.typography.headingFont, brandData.typography.bodyFont] },
    }).catch(() => {})
    emitEvent('brand.tokens.changed', {
      productId,
      data: { colorCount: brandData.colorGroups.length, headingFont: brandData.typography.headingFont, bodyFont: brandData.typography.bodyFont },
    })
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }, [saveState, brandData, tokenNodes, productId, addNode, updateNode, emitEvent])

  const handleColorChange = useCallback((groups: ColorGroup[]) => setBrandData((p) => ({ ...p, colorGroups: groups })), [])
  const handleTypographyChange = useCallback((typography: TypographyConfig) => setBrandData((p) => ({ ...p, typography })), [])
  const handleSpacingChange = useCallback((spacing: SpacingConfig) => setBrandData((p) => ({ ...p, spacing })), [])
  const handleEffectsChange = useCallback((effects: EffectsConfig) => setBrandData((p) => ({ ...p, effects })), [])
  const handleApplyAIPalette = useCallback((groups: ColorGroup[]) => {
    setBrandData((prev) => {
      const newMap = new Map(groups.map((g) => [g.id, g]))
      const merged = prev.colorGroups.map((g) => newMap.get(g.id) ?? g)
      groups.forEach((g) => { if (!merged.find((m) => m.id === g.id)) merged.push(g) })
      return { ...prev, colorGroups: merged }
    })
  }, [])

  const renderSubTab = () => {
    switch (activeSubTab) {
      case 'colors':     return <ColorPalette colorGroups={brandData.colorGroups} onChange={handleColorChange} />
      case 'typography': return <TypographySystem typography={brandData.typography} onChange={handleTypographyChange} />
      case 'spacing':    return <SpacingSystem spacing={brandData.spacing} onChange={handleSpacingChange} />
      case 'effects':    return <EffectsSystem effects={brandData.effects} onChange={handleEffectsChange} />
      case 'preview':    return <BrandPreview brandData={brandData} />
      case 'export':     return <TokenExportTab brandData={brandData} toCSSVariables={() => brandTokens.toCSSVariables()} />
      default: return null
    }
  }

  return (
    <div className="flex h-full w-full bg-[var(--bg-inset)]">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Actions strip */}
        <div className="flex items-center justify-end gap-1 h-9 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <button
            onClick={handleExportCSS}
            className="flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Copy CSS custom properties to clipboard"
          >
            <Code2 className="w-3 h-3" />
            Export CSS
          </button>
          <AIActionBar workspace="design" productId={productId} compact />
          <ExportMenu formats={['markdown']} onExport={(fmt) => outputPipeline.download(fmt, { label: 'brand' })} compact />
          <button
            onClick={handleSaveBrand}
            disabled={saveState === 'saving'}
            className={`flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium transition-colors ${
              saveState === 'saved'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {saveState === 'saved' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Sub-tab bar */}
        <div className="shrink-0 flex items-center h-8 px-1 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 h-full text-[11px] font-medium border-b transition-colors ${
                  isActive
                    ? 'text-[var(--text-primary)] border-[var(--accent)]'
                    : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--bg-inset)]">
          <div className="h-full">{renderSubTab()}</div>
        </div>
      </div>

      <AIBrandPanel
        onApplyPalette={handleApplyAIPalette}
        collapsed={!aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
      />
    </div>
  )
}
