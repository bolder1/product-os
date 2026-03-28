'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Settings2, Layers, ChevronDown } from 'lucide-react'
import { type ComponentDef, type VariantDef, categoryColors, categories } from '../_data/mock-components'
import { ComponentPreview } from './component-preview'
import { VariantGrid } from './variant-grid'

type Tab = 'preview' | 'props' | 'variants'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'preview', label: 'Preview', icon: <Eye className="w-3.5 h-3.5" /> },
  { id: 'props', label: 'Props', icon: <Settings2 className="w-3.5 h-3.5" /> },
  { id: 'variants', label: 'Variants', icon: <Layers className="w-3.5 h-3.5" /> },
]

interface ComponentDetailProps {
  component: ComponentDef
  onUpdate: (id: string, updates: Partial<ComponentDef>) => void
}

export function ComponentDetail({ component, onUpdate }: ComponentDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(component.name)
  const [propValues, setPropValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    component.props.forEach((p) => {
      defaults[p.name] = p.defaultValue
    })
    return defaults
  })
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
  const accent = categoryColors[component.category] ?? '#06B6D4'

  const handlePropChange = useCallback((name: string, value: string) => {
    setPropValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSelectVariant = useCallback(
    (variantId: string) => {
      setActiveVariantId(variantId)
      const variant = component.variants.find((v) => v.id === variantId)
      if (variant) {
        setPropValues((prev) => ({ ...prev, ...variant.props }))
      }
      setActiveTab('preview')
    },
    [component.variants]
  )

  const handleAddVariant = useCallback(() => {
    const newVariant: VariantDef = {
      id: `v-${Date.now()}`,
      name: `Variant ${component.variants.length + 1}`,
      props: { ...propValues },
    }
    onUpdate(component.id, { variants: [...component.variants, newVariant] })
  }, [component, propValues, onUpdate])

  const handleDeleteVariant = useCallback(
    (variantId: string) => {
      onUpdate(component.id, {
        variants: component.variants.filter((v) => v.id !== variantId),
      })
      if (activeVariantId === variantId) setActiveVariantId(null)
    },
    [component, activeVariantId, onUpdate]
  )

  const handleNameSave = () => {
    if (nameValue.trim() && nameValue !== component.name) {
      onUpdate(component.id, { name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const handleCategoryChange = (cat: string) => {
    onUpdate(component.id, { category: cat as ComponentDef['category'] })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Component header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="text-lg font-semibold text-[#F1F5F9] bg-transparent border-b border-[#06B6D4]/50 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => {
                  setNameValue(component.name)
                  setEditingName(true)
                }}
                className="text-lg font-semibold text-[#F1F5F9] cursor-pointer hover:text-[#06B6D4] transition-colors"
              >
                {component.name}
              </h2>
            )}

            {/* Category dropdown */}
            <div className="relative">
              <select
                value={component.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none pl-2 pr-6 py-1 rounded-md text-[10px] font-medium border border-white/[0.06] focus:outline-none focus:border-[#06B6D4]/40 cursor-pointer"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c} className="bg-[#0c1125] text-[#F1F5F9]">
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: accent }} />
            </div>
          </div>
          <p className="text-xs text-[#64748B] mt-1">{component.description}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748B] shrink-0">
          <span>{component.variants.length} variant{component.variants.length !== 1 ? 's' : ''}</span>
          <span className="w-px h-3 bg-white/[0.08]" />
          <span>{component.props.length} prop{component.props.length !== 1 ? 's' : ''}</span>
          <span className="w-px h-3 bg-white/[0.08]" />
          <span>{component.usageCount} uses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 py-3 border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#06B6D4]/15 text-[#06B6D4]'
                : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.03]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'variants' && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px]">
                {component.variants.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ComponentPreview
                component={component}
                propValues={propValues}
                onPropChange={handlePropChange}
              />
            </motion.div>
          )}

          {activeTab === 'props' && (
            <motion.div
              key="props"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_100px_60px_1fr] gap-px bg-white/[0.04]">
                  {/* Header */}
                  {['Name', 'Type', 'Default', 'Req.', 'Description'].map((h) => (
                    <div key={h} className="px-3 py-2.5 bg-white/[0.02] text-[10px] font-medium text-[#64748B] uppercase tracking-wider">
                      {h}
                    </div>
                  ))}
                  {/* Rows */}
                  {component.props.map((prop, i) => (
                    <>
                      <div key={`${prop.id}-name`} className={`px-3 py-2.5 text-xs text-[#F1F5F9] font-medium ${i % 2 ? 'bg-white/[0.01]' : 'bg-[#060918]'}`}>
                        {prop.name}
                      </div>
                      <div key={`${prop.id}-type`} className={`px-3 py-2.5 ${i % 2 ? 'bg-white/[0.01]' : 'bg-[#060918]'}`}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] font-mono">
                          {prop.type}
                        </span>
                      </div>
                      <div key={`${prop.id}-default`} className={`px-3 py-2.5 text-xs text-[#94A3B8] font-mono ${i % 2 ? 'bg-white/[0.01]' : 'bg-[#060918]'}`}>
                        {prop.defaultValue || '—'}
                      </div>
                      <div key={`${prop.id}-req`} className={`px-3 py-2.5 text-center ${i % 2 ? 'bg-white/[0.01]' : 'bg-[#060918]'}`}>
                        {prop.required ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#06B6D4]" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-white/[0.08]" />
                        )}
                      </div>
                      <div key={`${prop.id}-desc`} className={`px-3 py-2.5 text-xs text-[#64748B] ${i % 2 ? 'bg-white/[0.01]' : 'bg-[#060918]'}`}>
                        {prop.description}
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'variants' && (
            <motion.div
              key="variants"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <VariantGrid
                component={component}
                variants={component.variants}
                activeVariantId={activeVariantId}
                onSelectVariant={handleSelectVariant}
                onAddVariant={handleAddVariant}
                onDeleteVariant={handleDeleteVariant}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
