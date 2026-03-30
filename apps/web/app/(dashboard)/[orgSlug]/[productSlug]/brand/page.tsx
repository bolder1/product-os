'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

// ── Tab definitions ──

const tabs = [
  { id: 'colors', label: 'Colors', icon: Paintbrush },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'spacing', label: 'Spacing', icon: Ruler },
  { id: 'effects', label: 'Effects', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
] as const

type TabId = (typeof tabs)[number]['id']

// ── Tab Content Transition ──

const tabVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

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
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-1 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EC4899]/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#EC4899]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#F1F5F9]">Brand Builder</h1>
              <p className="text-xs text-[#64748B]">Define your product identity</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate Brand
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveBrand}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#F1F5F9] text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Brand
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex items-center gap-1 px-1 pt-4 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#EC4899]'
                    : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="brand-tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#EC4899] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-1 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* AI Panel */}
      <AIBrandPanel
        onApplyPalette={handleApplyAIPalette}
        collapsed={!aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
      />
    </div>
  )
}
