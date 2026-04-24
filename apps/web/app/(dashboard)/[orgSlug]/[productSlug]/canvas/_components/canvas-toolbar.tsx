'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  StickyNote,
  Type,
  Square,
  Circle,
  Diamond,
  Minus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

export type ToolType = 'select' | 'sticky' | 'text' | 'rectangle' | 'circle' | 'diamond' | 'connector'

interface CanvasToolbarProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  onUndo: () => void
  onRedo: () => void
  zoom: number
}

export function CanvasToolbar({
  activeTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onUndo,
  onRedo,
  zoom,
}: CanvasToolbarProps) {
  const [shapesOpen, setShapesOpen] = useState(false)

  const tools: { key: ToolType; icon: React.ElementType; label: string }[] = [
    { key: 'sticky', icon: StickyNote, label: 'Sticky Note' },
    { key: 'text', icon: Type, label: 'Text' },
    { key: 'connector', icon: Minus, label: 'Connector' },
  ]

  const shapes: { key: ToolType; icon: React.ElementType; label: string }[] = [
    { key: 'rectangle', icon: Square, label: 'Rectangle' },
    { key: 'circle', icon: Circle, label: 'Circle' },
    { key: 'diamond', icon: Diamond, label: 'Diamond' },
  ]

  const isShapeTool = ['rectangle', 'circle', 'diamond'].includes(activeTool)
  const activeShapeIcon = shapes.find((s) => s.key === activeTool)?.icon ?? Square

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
    >
      {/* Main tools */}
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.key
        return (
          <button
            key={tool.key}
            onClick={() => onToolChange(tool.key)}
            title={tool.label}
            className={`relative p-2 rounded-lg transition-colors ${
              isActive
                ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}

      {/* Shapes dropdown */}
      <div className="relative">
        <button
          onClick={() => setShapesOpen(!shapesOpen)}
          title="Shapes"
          className={`flex items-center gap-0.5 p-2 rounded-lg transition-colors ${
            isShapeTool
              ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
          }`}
        >
          {(() => { const ShapeIcon = activeShapeIcon; return <ShapeIcon className="w-4 h-4" /> })()}
          <ChevronDown className="w-3 h-3" />
        </button>
        {shapesOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 mt-1 p-1 rounded-lg border border-white/[0.08] bg-[#0B1120] shadow-xl z-50"
          >
            {shapes.map((shape) => {
              const Icon = shape.icon
              return (
                <button
                  key={shape.key}
                  onClick={() => {
                    onToolChange(shape.key)
                    setShapesOpen(false)
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs transition-colors ${
                    activeTool === shape.key
                      ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {shape.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-white/[0.08] mx-1" />

      {/* Undo / Redo */}
      <button
        onClick={onUndo}
        title="Undo"
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        title="Redo"
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-white/[0.08] mx-1" />

      {/* Zoom controls */}
      <button
        onClick={onZoomOut}
        title="Zoom Out"
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="text-[10px] font-mono text-[var(--text-tertiary)] w-10 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        title="Zoom In"
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={onZoomFit}
        title="Fit to Screen"
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
      >
        <Maximize className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-white/[0.08] mx-1" />

      {/* AI Brainstorm */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[var(--color-warning)] to-[#D97706] text-white text-xs font-medium"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Brainstorm
      </motion.button>
    </motion.div>
  )
}
