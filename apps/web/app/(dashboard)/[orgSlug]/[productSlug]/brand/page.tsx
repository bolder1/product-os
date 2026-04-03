'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Palette, Sparkles, Save, Paintbrush, Type, Ruler, Layers, Eye } from 'lucide-react'
import { defaultBrandConfig } from './_data/default-brand'
import type { BrandConfig, ColorGroup, TypographyConfig, SpacingConfig, EffectsConfig } from './_data/default-brand'
import { useGraphStore } from '../../../../lib/graph-store'
import ColorPalette from './_components/color-palette'
import TypographySystem from './_components/typography-system'
import SpacingSystem from './_components/spacing-system'
import EffectsSystem from './_components/effects-system'
import BrandPreview from './_components/brand-preview'
import AIBrandPanel from './_components/ai-brand-panel'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'

// ── Tab definitions ──

const tabs = [
  { id: 'colors', label: 'Colors', icon: Paintbrush },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Ruler },
  { id: 'effects', label: 'Effects', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
] as const

type TabId = (typeof tabs)[number]['id']

export default function BrandBuilderPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

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

  const [activeTab, setActiveTab] = useState<TabId>('colors')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  // Persist brand data to graph store when Save is clicked
  const handleSaveBrand = useCallback(() => {
    const sections: { tokenType: string; label: string; payload: unknown }[] = [
      { tokenType: 'brand-colors', label: 'Brand Colors', payload: brandData.colorGroups },
      { tokenType: 'brand-typography', label: 'Brand Typography', payload: brandData.typography },
      { tokenType: 'brand-spacing', label: 'Brand Spacing', payload: brandData.spacing },
      { tokenType: 'brand-effects', label: 'Brand Effects', payload: brandData.effects },
    ]

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
  }, [brandData, tokenNodes, productId, addNode, updateNode])

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
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="tool-btn flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--border-accent)] hover:bg-[var(--surface-selected-strong)] transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              AI Generate
            </button>
            <button
              onClick={handleSaveBrand}
              className="tool-btn flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
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
