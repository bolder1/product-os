'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import {
  MousePointer2,
  StickyNote,
  Type,
  Square,
  Circle,
  Diamond,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Grid3X3,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'
import { type CanvasItem, mockCanvasItems } from './_data/mock-canvas'
import { CanvasToolbar, type ToolType } from './_components/canvas-toolbar'
import { CanvasBoard } from './_components/canvas-board'
import { CanvasProperties } from './_components/canvas-properties'

const TOOL_ITEMS: { tool: ToolType; icon: typeof MousePointer2; label: string }[] = [
  { tool: 'select', icon: MousePointer2, label: 'Select' },
  { tool: 'sticky', icon: StickyNote, label: 'Sticky' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'rectangle', icon: Square, label: 'Rect' },
  { tool: 'circle', icon: Circle, label: 'Circle' },
  { tool: 'diamond', icon: Diamond, label: 'Diamond' },
  { tool: 'connector', icon: Minus, label: 'Line' },
]

export default function CanvasPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug
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
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-inset)]">
      {/* ── Top Toolbar ── */}
      <div className="tool-toolbar px-1 gap-px">
        <div className="flex items-center gap-px">
          {TOOL_ITEMS.map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              title={label}
              className={`tool-btn tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] transition-colors ${
                activeTool === tool
                  ? 'bg-[var(--accent-muted)] text-[var(--accent-text)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Icon className="w-[13px] h-[13px]" strokeWidth={1.6} />
            </button>
          ))}
        </div>

        <div className="tool-toolbar-divider" />

        <div className="flex items-center gap-px">
          <button
            onClick={handleZoomOut}
            className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-[13px] h-[13px]" strokeWidth={1.6} />
          </button>
          <span className="text-[10px] text-[var(--text-secondary)] w-[36px] text-center font-mono tabular-nums select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-[13px] h-[13px]" strokeWidth={1.6} />
          </button>
          <button
            onClick={handleZoomFit}
            className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] transition-colors"
            title="Fit to view"
          >
            <Maximize className="w-[13px] h-[13px]" strokeWidth={1.6} />
          </button>
        </div>

        <div className="tool-toolbar-divider" />

        <div className="flex items-center gap-px">
          <button
            onClick={() => {}}
            className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title="Undo"
          >
            <Undo2 className="w-[13px] h-[13px]" strokeWidth={1.6} />
          </button>
          <button
            onClick={() => {}}
            className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title="Redo"
          >
            <Redo2 className="w-[13px] h-[13px]" strokeWidth={1.6} />
          </button>
        </div>

        <div className="flex-1" />

        <span className="text-[10px] text-[var(--text-tertiary)] mr-2 select-none">
          {items.length} object{items.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => setPropertiesOpen(!propertiesOpen)}
          className="tool-btn tool-btn-ghost tool-btn-icon h-[24px] w-[24px] flex items-center justify-center rounded-[3px] transition-colors"
          title={propertiesOpen ? 'Hide properties' : 'Show properties'}
        >
          {propertiesOpen ? (
            <PanelRightClose className="w-[13px] h-[13px]" strokeWidth={1.6} />
          ) : (
            <PanelRightOpen className="w-[13px] h-[13px]" strokeWidth={1.6} />
          )}
        </button>
      </div>

      <AnalyticsOverlay productId={productId} context="canvas" />

      {/* ── Canvas + Properties ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 bg-[var(--bg-canvas)]">
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

        {propertiesOpen && (
          <div className="tool-panel-right shrink-0 w-[220px] overflow-y-auto">
            <CanvasProperties
              item={selectedItem}
              collapsed={false}
              onToggle={() => setPropertiesOpen(false)}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
            />
          </div>
        )}
      </div>
    </div>
  )
}
