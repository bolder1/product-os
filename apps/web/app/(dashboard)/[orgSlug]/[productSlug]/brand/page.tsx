'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Palette, Save, Paintbrush, Type, Ruler, Layers, Eye, Check, Code2, Download, Copy, Volume2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { defaultBrandConfig } from './_data/default-brand'
import type { BrandConfig, ColorGroup, TypographyConfig, SpacingConfig, EffectsConfig } from './_data/default-brand'
import { useGraphStore } from '../../../../lib/graph-store'
import { useBrandTokens } from '../../../../lib/use-brand-tokens'
import { useEventBridge } from '../../../../lib/use-event-bridge'
import { trpcMutate } from '../../../../lib/api'
import ColorPalette from './_components/color-palette'
import TypographySystem from './_components/typography-system'
import SpacingSystem from './_components/spacing-system'
import EffectsSystem from './_components/effects-system'
import BrandPreview from './_components/brand-preview'
import AIBrandPanel from './_components/ai-brand-panel'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { ExportMenu } from '../../../../components/primitives/export-menu'
import { outputPipeline } from '../../../../lib/output-pipeline'

// ── Tab definitions ──

const tabs = [
  { id: 'colors', label: 'Colors', icon: Paintbrush },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Ruler },
  { id: 'effects', label: 'Effects', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'export', label: 'Export', icon: Download },
] as const

type TabId = (typeof tabs)[number]['id']

// ---------------------------------------------------------------------------
// Token Export Tab
// ---------------------------------------------------------------------------

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
      {/* Format picker */}
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

      {/* Output preview */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Output</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: 'var(--bg-inset)', color: copied ? 'var(--color-success)' : 'var(--text-secondary)' }}
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}
            >
              <Download size={10} />
              Download
            </button>
          </div>
        </div>
        <pre
          className="flex-1 overflow-auto rounded-xl p-3 text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed"
          style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}
        >
          {output || '// No tokens defined yet'}
        </pre>
      </div>
    </div>
  )
}

export default function BrandBuilderPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Graph store — persist brand tokens as graph nodes
  const allNodes = useGraphStore((s) => s.nodes)
  const addNode = useGraphStore((s) => s.addNode)
  const updateNode = useGraphStore((s) => s.updateNode)

  const tokenNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === 'token'),
    [allNodes, productId]
  )

  // Hydrate from graph store on first render
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

  // Cross-studio token resolution (also used for CSS export)
  const brandTokens = useBrandTokens(productId)
  const emitEvent = useEventBridge()

  const [activeTab, setActiveTab] = useState<TabId>('colors')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleExportCSS = useCallback(() => {
    const css = brandTokens.toCSSVariables()
    navigator.clipboard.writeText(css).catch(() => {})
  }, [brandTokens])

  // Persist brand data to graph store when Save is clicked
  const handleSaveBrand = useCallback(async () => {
    if (saveState === 'saving') return
    setSaveState('saving')

    const sections: { tokenType: string; label: string; payload: unknown }[] = [
      { tokenType: 'brand-colors', label: 'Brand Colors', payload: brandData.colorGroups },
      { tokenType: 'brand-typography', label: 'Brand Typography', payload: brandData.typography },
      { tokenType: 'brand-spacing', label: 'Brand Spacing', payload: brandData.spacing },
      { tokenType: 'brand-effects', label: 'Brand Effects', payload: brandData.effects },
    ]

    // 1. Save blob token nodes (local + DB via graph store)
    for (const section of sections) {
      const existing = tokenNodes.find((n) => (n.data as Record<string, unknown>).tokenType === section.tokenType)
      if (existing) {
        updateNode(existing.id, {
          label: section.label,
          data: { tokenType: section.tokenType, payload: JSON.stringify(section.payload) },
        })
      } else {
        addNode({
          kind: 'token',
          label: section.label,
          productId,
          data: { tokenType: section.tokenType, payload: JSON.stringify(section.payload) },
        })
      }
    }

    // 2. Emit brand.token.updated event to backend (fire-and-forget)
    trpcMutate('activity.log', {
      productId,
      action: 'brand.token.updated',
      entityType: 'token',
      studioOrigin: 'brand',
      meta: {
        colorCount: brandData.colorGroups.length,
        fonts: [brandData.typography.headingFont, brandData.typography.bodyFont],
      },
    }).catch(() => {})

    // 3. Emit client-side event for cross-studio reactivity
    emitEvent('brand.tokens.changed', {
      productId,
      data: {
        colorCount: brandData.colorGroups.length,
        headingFont: brandData.typography.headingFont,
        bodyFont: brandData.typography.bodyFont,
      },
    })

    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }, [saveState, brandData, tokenNodes, productId, addNode, updateNode, emitEvent])

  // ── Handlers ──

  const handleColorChange = useCallback(
    (groups: ColorGroup[]) => {
      setBrandData((prev) => ({ ...prev, colorGroups: groups }))
    },
    []
  )

  const handleTypographyChange = useCallback(
    (typography: TypographyConfig) => {
      setBrandData((prev) => ({ ...prev, typography }))
    },
    []
  )

  const handleSpacingChange = useCallback(
    (spacing: SpacingConfig) => {
      setBrandData((prev) => ({ ...prev, spacing }))
    },
    []
  )

  const handleEffectsChange = useCallback(
    (effects: EffectsConfig) => {
      setBrandData((prev) => ({ ...prev, effects }))
    },
    []
  )

  const handleApplyAIPalette = useCallback(
    (groups: ColorGroup[]) => {
      // Merge AI groups with existing, keeping error/info if not in AI output
      setBrandData((prev) => {
        const newMap = new Map(groups.map((g) => [g.id, g]))
        const merged = prev.colorGroups.map((g) => newMap.get(g.id) ?? g)
        // Add any new groups from AI that weren't in original
        groups.forEach((g) => {
          if (!merged.find((m) => m.id === g.id)) merged.push(g)
        })
        return { ...prev, colorGroups: merged }
      })
    },
    []
  )

  // ── Render Tab Content ──

  const renderTabContent = () => {
    switch (activeTab) {
      case 'colors':
        return (
          <ColorPalette
            colorGroups={brandData.colorGroups}
            onChange={handleColorChange}
          />
        )
      case 'typography':
        return (
          <TypographySystem
            typography={brandData.typography}
            onChange={handleTypographyChange}
          />
        )
      case 'spacing':
        return (
          <SpacingSystem
            spacing={brandData.spacing}
            onChange={handleSpacingChange}
          />
        )
      case 'effects':
        return (
          <EffectsSystem
            effects={brandData.effects}
            onChange={handleEffectsChange}
          />
        )
      case 'preview':
        return <BrandPreview brandData={brandData} />
      case 'export':
        return <TokenExportTab brandData={brandData} toCSSVariables={() => brandTokens.toCSSVariables()} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full w-full bg-[var(--bg-inset)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Toolbar */}
        <div className="tool-toolbar justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Brand</span>
            <StudioHealthBadge productId={productId} studio="brand" />
            <Link
              href={`/${params.orgSlug}/${params.productSlug}/brand/voice`}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 transition-colors"
            >
              <Volume2 size={10} />
              Voice
              <ArrowRight size={10} />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSS}
              className="tool-btn flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium text-[var(--text-secondary)] bg-transparent border border-transparent hover:bg-[var(--bg-elevated)] hover:border-[var(--border-default)] transition-colors"
              title="Copy CSS custom properties to clipboard"
            >
              <Code2 className="w-3 h-3" />
              Export CSS
            </button>
            <AIActionBar workspace="design" productId={productId} compact />
            <ExportMenu
              formats={['markdown']}
              onExport={(fmt) => outputPipeline.download(fmt, { label: 'brand' })}
              compact
            />
            <button
              onClick={handleSaveBrand}
              disabled={saveState === 'saving'}
              className={`tool-btn flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium transition-colors ${
                saveState === 'saved'
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {saveState === 'saved' ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="tool-tabs shrink-0 flex items-center h-8 px-1 bg-[var(--bg-surface)]">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tool-tab flex items-center gap-1.5 px-3 h-full text-[11px] font-medium border-b transition-colors ${
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

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-inset)]">
          <div className="tool-surface h-full">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* AI Panel (right side) */}
      <AIBrandPanel
        onApplyPalette={handleApplyAIPalette}
        collapsed={!aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
      />
    </div>
  )
}
