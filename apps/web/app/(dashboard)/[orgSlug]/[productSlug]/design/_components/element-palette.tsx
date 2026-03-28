'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Square, AlignVerticalSpaceAround, LayoutGrid, Minus,
  Heading, AlignLeft, ExternalLink,
  Image, Star, CircleUser,
  MousePointerClick, TextCursorInput, ChevronsUpDown, CheckSquare,
  CreditCard, Tag, X,
} from 'lucide-react'
import { paletteElements, type PaletteElement } from '../_data/mock-screens'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Square, AlignVerticalSpaceAround, LayoutGrid, Minus,
  Heading, AlignLeft, ExternalLink,
  Image, Star, CircleUser,
  MousePointerClick, TextCursorInput, ChevronsUpDown, CheckSquare,
  CreditCard, Tag,
}

interface ElementPaletteProps {
  open: boolean
  onClose: () => void
  onAddElement: (type: string) => void
}

const categories = ['Layout', 'Text', 'Media', 'Form', 'Data'] as const

export default function ElementPalette({ open, onClose, onAddElement }: ElementPaletteProps) {
  const grouped = categories.map((cat) => ({
    category: cat,
    items: paletteElements.filter((e) => e.category === cat),
  }))

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Palette panel */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-[380px] bg-[#0d1129]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-[#F1F5F9]">Add Element</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <div className="p-3 max-h-[360px] overflow-y-auto space-y-4">
              {grouped.map(({ category, items }) => (
                <div key={category}>
                  <p className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold mb-2 px-1">
                    {category}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {items.map((item) => {
                      const Icon = iconMap[item.icon] || Square
                      return (
                        <motion.button
                          key={item.type}
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(139,92,246,0.08)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            onAddElement(item.type)
                            onClose()
                          }}
                          className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <Icon className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-[10px] text-[#94A3B8] font-medium">{item.type}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
