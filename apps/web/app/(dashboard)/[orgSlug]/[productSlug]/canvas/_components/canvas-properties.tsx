'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { CanvasItem } from '../_data/mock-canvas'
import { presetColors } from '../_data/mock-canvas'

interface CanvasPropertiesProps {
  item: CanvasItem | null
  collapsed: boolean
  onToggle: () => void
  onUpdate: (id: string, changes: Partial<CanvasItem>) => void
  onDelete: (id: string) => void
}

export function CanvasProperties({
  item,
  collapsed,
  onToggle,
  onUpdate,
  onDelete,
}: CanvasPropertiesProps) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors"
      >
        {collapsed ? (
          <PanelRightOpen className="w-4 h-4" />
        ) : (
          <PanelRightClose className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-l border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="text-sm font-medium text-[#F1F5F9]">Properties</span>
                <button
                  onClick={onToggle}
                  className="p-1 rounded text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {item ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Type label */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
                      {item.type === 'sticky'
                        ? 'Sticky Note'
                        : item.type === 'text'
                        ? 'Text Block'
                        : `Shape: ${item.shapeKind ?? 'rectangle'}`}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#94A3B8]">Text</label>
                    <textarea
                      value={item.text}
                      onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#F1F5F9] placeholder-[#64748B] resize-none focus:outline-none focus:border-[#F59E0B]/40"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#94A3B8]">Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => onUpdate(item.id, { color })}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            item.color === color
                              ? 'ring-2 ring-[#F59E0B] ring-offset-1 ring-offset-[#060918] scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#94A3B8]">Width</label>
                      <input
                        type="number"
                        value={item.width}
                        onChange={(e) =>
                          onUpdate(item.id, { width: Math.max(40, Number(e.target.value)) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#F59E0B]/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#94A3B8]">Height</label>
                      <input
                        type="number"
                        value={item.height}
                        onChange={(e) =>
                          onUpdate(item.id, { height: Math.max(30, Number(e.target.value)) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#F59E0B]/40"
                      />
                    </div>
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#94A3B8]">X</label>
                      <input
                        type="number"
                        value={Math.round(item.x)}
                        onChange={(e) => onUpdate(item.id, { x: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#F59E0B]/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#94A3B8]">Y</label>
                      <input
                        type="number"
                        value={Math.round(item.y)}
                        onChange={(e) => onUpdate(item.id, { y: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#F59E0B]/40"
                      />
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Item
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <p className="text-xs text-[#64748B] text-center">
                    Select an item on the canvas to edit its properties
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
