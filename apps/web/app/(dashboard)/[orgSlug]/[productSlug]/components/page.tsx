'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Box, Plus, Sparkles } from 'lucide-react'
import { type ComponentDef, mockComponents } from './_data/mock-components'
import { useGraphStore } from '../../../../lib/graph-store'
import { ComponentList } from './_components/component-list'
import { ComponentDetail } from './_components/component-detail'
import { ComponentCreateModal } from './_components/component-create-modal'

// Convert graph node → local ComponentDef
function nodeToComponent(n: { id: string; label: string; data: Record<string, unknown> }): ComponentDef {
  try {
    return {
      id: n.id,
      name: n.label,
      category: (String(n.data.category || 'Layout')) as ComponentDef['category'],
      description: String(n.data.description || ''),
      props: n.data.props ? JSON.parse(String(n.data.props)) : [],
      variants: n.data.variants ? JSON.parse(String(n.data.variants)) : [],
      usageCount: Number(n.data.usageCount || 0),
    }
  } catch {
    return { id: n.id, name: n.label, category: 'Layout', description: '', props: [], variants: [], usageCount: 0 }
  }
}

export default function ComponentBuilderPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

  // Graph store
  const allNodes = useGraphStore((s) => s.nodes)
  const addNode = useGraphStore((s) => s.addNode)
  const updateNode = useGraphStore((s) => s.updateNode)
  const deleteNode = useGraphStore((s) => s.deleteNode)

  const componentNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === 'component'),
    [allNodes, productId]
  )

  const hasStoreData = componentNodes.length > 0

  // Derive component list from graph store or fall back to mock
  const components = useMemo(
    () => hasStoreData ? componentNodes.map(nodeToComponent) : mockComponents,
    [hasStoreData, componentNodes]
  )

  const [selectedId, setSelectedId] = useState<string | null>(components[0]?.id ?? null)
  const [modalOpen, setModalOpen] = useState(false)

  const selectedComponent = components.find((c) => c.id === selectedId) ?? null

  const handleUpdateComponent = useCallback((id: string, updates: Partial<ComponentDef>) => {
    // If this is a graph node, persist
    const existing = componentNodes.find((n) => n.id === id)
    if (existing) {
      const merged = { ...nodeToComponent(existing), ...updates }
      updateNode(id, {
        label: merged.name,
        data: {
          category: merged.category,
          description: merged.description,
          props: JSON.stringify(merged.props),
          variants: JSON.stringify(merged.variants),
          usageCount: String(merged.usageCount),
        },
      })
    }
  }, [componentNodes, updateNode])

  const handleCreateComponent = useCallback(
    (data: Omit<ComponentDef, 'id' | 'usageCount'>) => {
      const node = addNode({
        kind: 'component',
        label: data.name,
        productId,
        data: {
          category: data.category,
          description: data.description,
          props: JSON.stringify(data.props),
          variants: JSON.stringify(data.variants),
          usageCount: '0',
        },
      })
      setSelectedId(node.id)
    },
    [addNode, productId]
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
