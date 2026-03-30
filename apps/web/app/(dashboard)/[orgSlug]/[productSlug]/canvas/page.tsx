'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'
import { type CanvasItem, mockCanvasItems } from './_data/mock-canvas'
import { CanvasToolbar, type ToolType } from './_components/canvas-toolbar'
import { CanvasBoard } from './_components/canvas-board'
import { CanvasProperties } from './_components/canvas-properties'

export default function CanvasPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug
  const [items, setItems] = useState<CanvasItem[]>(mockCanvasItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [propertiesOpen, setPropertiesOpen] = useState(true)

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  )

  const handleMoveItem = useCallback((id: string, x: number, y: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)))
  }, [])

  const handleAddItem = useCallback((item: CanvasItem) => {
    setItems((prev) => [...prev, item])
    setActiveTool('select')
  }, [])

  const handleUpdateItem = useCallback((id: string, changes: Partial<CanvasItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }, [])

  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId]
  )

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.2)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.2, z - 0.2)), [])
  const handleZoomFit = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 flex items-center justify-between px-1 pb-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F1F5F9]">Canvas</h1>
            <p className="text-xs text-[#64748B]">
              Strategic brainstorming &middot; {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <CanvasToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onUndo={() => {}}
          onRedo={() => {}}
          zoom={zoom}
        />
      </motion.div>

      {/* Analytics Overlay */}
      <AnalyticsOverlay productId={productId} context="canvas" />

      {/* Canvas + Properties */}
      <div className="flex flex-1 min-h-0 rounded-xl border border-white/[0.08] overflow-hidden relative">
        {/* SVG Canvas */}
        <div className="flex-1 min-w-0">
          <CanvasBoard
            items={items}
            selectedId={selectedId}
            onSelectItem={setSelectedId}
            onMoveItem={handleMoveItem}
            onAddItem={handleAddItem}
            activeTool={activeTool}
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
          />
        </div>

        {/* Properties Panel */}
        <CanvasProperties
          item={selectedItem}
          collapsed={!propertiesOpen}
          onToggle={() => setPropertiesOpen(!propertiesOpen)}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />
      </div>
    </div>
  )
}
