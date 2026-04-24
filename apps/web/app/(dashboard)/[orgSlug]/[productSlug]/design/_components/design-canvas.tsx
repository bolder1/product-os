'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Plus } from 'lucide-react'
import type { ScreenDef, ElementDef } from '../_data/mock-screens'
import ElementPalette from './element-palette'

interface DesignCanvasProps {
  screen: ScreenDef | null
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onAddElement: (type: string) => void
  onUpdateElement: (id: string, updates: Partial<ElementDef>) => void
}

// Element type label colors
function typeColor(type: string): string {
  switch (type) {
    case 'Button':
      return 'rgba(139,92,246,0.25)'
    case 'Image':
    case 'Avatar':
      return 'rgba(139,92,246,0.15)'
    case 'Heading':
    case 'Paragraph':
    case 'Link':
      return 'rgba(255,255,255,0.06)'
    case 'Input':
    case 'Select':
    case 'Checkbox':
      return 'rgba(56,189,248,0.10)'
    case 'Card':
    case 'Grid':
    case 'Container':
    case 'Stack':
      return 'rgba(255,255,255,0.03)'
    default:
      return 'rgba(255,255,255,0.03)'
  }
}

export default function DesignCanvas({
  screen,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
}: DesignCanvasProps) {
  const [zoom, setZoom] = useState(0.55)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Reset zoom/offset when screen changes
  useEffect(() => {
    setZoom(0.55)
    setOffset({ x: 0, y: 0 })
  }, [screen?.id])

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.1))
  const handleFit = () => {
    setZoom(0.55)
    setOffset({ x: 0, y: 0 })
  }

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on background click
      if ((e.target as HTMLElement).dataset.canvas) {
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
        onSelectElement(null)
      }
    },
    [offset, onSelectElement]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      setOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      })
    },
    [isPanning]
  )

  const handleMouseUp = useCallback(() => setIsPanning(false), [])

  // Scroll zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => {
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      return Math.max(0.1, Math.min(3, z + delta))
    })
  }, [])

  if (!screen) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto">
            <Maximize2 className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">Select a screen to start designing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* Dot grid background */}
      <div
        ref={canvasRef}
        data-canvas="true"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0 bg-[#080c20] overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      >
        {/* Screen frame */}
        <div
          data-canvas="true"
          className="absolute"
          style={{
            left: `calc(50% + ${offset.x}px)`,
            top: `calc(50% + ${offset.y}px)`,
            transform: `translate(-50%, -50%) scale(${zoom})`,
            transformOrigin: 'center center',
            width: screen.width,
            height: screen.height,
          }}
        >
          {/* Device frame */}
          <div
            className="relative w-full h-full bg-white/[0.02] border border-white/[0.10] shadow-2xl"
            style={{
              borderRadius: screen.category === 'mobile' ? 32 : screen.category === 'tablet' ? 20 : 8,
            }}
          >
            {/* Screen name label */}
            <div
              className="absolute -top-7 left-0 text-[11px] text-[var(--text-tertiary)] font-medium truncate"
              style={{ maxWidth: screen.width }}
            >
              {screen.name}
            </div>

            {/* Elements */}
            {screen.elements.map((el) => {
              const isSelected = selectedElementId === el.id
              return (
                <motion.div
                  key={el.id}
                  initial={false}
                  animate={{
                    boxShadow: isSelected
                      ? '0 0 0 2px rgba(99,102,241,0.8)'
                      : '0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectElement(el.id)
                  }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    background: el.style.background || typeColor(el.type),
                    borderRadius: el.style.borderRadius || 4,
                  }}
                >
                  {/* Content label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white/30 font-medium select-none">
                      {el.content || el.type}
                    </span>
                  </div>

                  {/* Hover outline */}
                  {!isSelected && (
                    <div className="absolute inset-0 rounded-[inherit] border border-transparent group-hover:border-violet-500/30 transition-colors pointer-events-none" />
                  )}

                  {/* Selection handles */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-500 rounded-sm border border-indigo-300 shadow-sm" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-sm border border-indigo-300 shadow-sm" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-500 rounded-sm border border-indigo-300 shadow-sm" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-sm border border-indigo-300 shadow-sm" />
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-[#0d1129]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1 z-20">
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <ZoomOut className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <span className="text-[11px] text-[var(--text-secondary)] font-mono min-w-[40px] text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <ZoomIn className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
        <button
          onClick={handleFit}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <Maximize2 className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Add Element floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPaletteOpen(true)}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] text-white text-xs font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Element
      </motion.button>

      {/* Element Palette */}
      <ElementPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAddElement={onAddElement}
      />
    </div>
  )
}
