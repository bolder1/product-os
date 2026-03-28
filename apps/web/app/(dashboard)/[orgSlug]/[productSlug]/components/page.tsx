'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Box, Plus, Sparkles } from 'lucide-react'
import { type ComponentDef, mockComponents } from './_data/mock-components'
import { ComponentList } from './_components/component-list'
import { ComponentDetail } from './_components/component-detail'
import { ComponentCreateModal } from './_components/component-create-modal'

export default function ComponentBuilderPage() {
  const [components, setComponents] = useState<ComponentDef[]>(mockComponents)
  const [selectedId, setSelectedId] = useState<string | null>(mockComponents[0]?.id ?? null)
  const [modalOpen, setModalOpen] = useState(false)

  const selectedComponent = components.find((c) => c.id === selectedId) ?? null

  const handleUpdateComponent = useCallback((id: string, updates: Partial<ComponentDef>) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  const handleCreateComponent = useCallback(
    (data: Omit<ComponentDef, 'id' | 'usageCount'>) => {
      const newComp: ComponentDef = {
        ...data,
        id: `comp-${String(Date.now()).slice(-6)}`,
        usageCount: 0,
      }
      setComponents((prev) => [newComp, ...prev])
      setSelectedId(newComp.id)
    },
    []
  )

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Box className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Component Builder</h1>
            <p className="text-xs text-[#64748B]">
              {components.length} component{components.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </button>

          {/* New Component */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#06B6D4] hover:bg-[#06B6D4]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Component
          </button>
        </div>
      </div>

      {/* Main content: sidebar + detail */}
      <div className="flex flex-1 min-h-0 rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 shrink-0 border-r border-white/[0.06] overflow-hidden">
          <ComponentList
            components={components}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddNew={() => setModalOpen(true)}
          />
        </div>

        {/* Right area */}
        <div className="flex-1 min-w-0 overflow-y-auto p-5">
          {selectedComponent ? (
            <motion.div
              key={selectedComponent.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <ComponentDetail
                component={selectedComponent}
                onUpdate={handleUpdateComponent}
              />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
                <Box className="w-6 h-6 text-[#06B6D4]" />
              </div>
              <h3 className="text-sm font-medium text-[#F1F5F9]">No component selected</h3>
              <p className="text-xs text-[#64748B] max-w-xs">
                Select a component from the list or create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <ComponentCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateComponent}
      />
    </div>
  )
}
