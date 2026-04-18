'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBasket, X, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface BasketItem {
  id: string
  name: string
  category: string
  nodeCount: number
}

interface Props {
  items: BasketItem[]
  onRemove: (id: string) => void
  onApplyAll: () => void
  disabled?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  saas:         '#3B82F6',
  mobile:       '#10B981',
  design_system:'#EC4899',
  internal_ops: '#F59E0B',
  marketing:    '#06B6D4',
  ecommerce:    '#8B5CF6',
  custom:       '#64748B',
}

export function TemplateBasket({ items, onRemove, onApplyAll, disabled }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const totalNodes = items.reduce((sum, i) => sum + i.nodeCount, 0)

  return (
    <div className="relative">
      {/* Basket trigger button */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-text)] text-[10px] font-medium hover:bg-[var(--accent)]/25 transition-all relative"
      >
        <ShoppingBasket size={12} />
        Basket
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold">
          {items.length}
        </span>
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-72 bg-[#0B1120] border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.07]">
              <div className="flex items-center gap-1.5">
                <ShoppingBasket size={12} className="text-[var(--accent-text)]" />
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Apply Basket</span>
                <span className="text-[9px] text-[#64748B]">{totalNodes} nodes total</span>
              </div>
              <button onClick={() => setExpanded(false)} className="text-[#475569] hover:text-[#94A3B8]">
                <X size={12} />
              </button>
            </div>

            {/* Items */}
            <div className="max-h-48 overflow-y-auto py-1">
              {items.map((item) => {
                const color = CATEGORY_COLORS[item.category] ?? '#64748B'
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.03] group transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[var(--text-primary)] truncate">{item.name}</p>
                      <p className="text-[9px] text-[#475569]">{item.nodeCount} nodes</p>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-[#475569] hover:text-red-400 transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2.5 border-t border-white/[0.07] flex items-center gap-2">
              <div className="flex-1 text-[10px] text-[#64748B]">
                {items.length} template{items.length > 1 ? 's' : ''} · ~{totalNodes} nodes
              </div>
              <button
                onClick={() => { setExpanded(false); onApplyAll() }}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent)] text-white text-[10px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-all"
              >
                <Play size={10} />
                Apply All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
