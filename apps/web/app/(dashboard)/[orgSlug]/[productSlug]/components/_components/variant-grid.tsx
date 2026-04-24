'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { type VariantDef, type ComponentDef, categoryColors } from '../_data/mock-components'

interface VariantGridProps {
  component: ComponentDef
  variants: VariantDef[]
  activeVariantId: string | null
  onSelectVariant: (id: string) => void
  onAddVariant: () => void
  onDeleteVariant: (id: string) => void
}

export function VariantGrid({
  component,
  variants,
  activeVariantId,
  onSelectVariant,
  onAddVariant,
  onDeleteVariant,
}: VariantGridProps) {
  const accent = categoryColors[component.category] ?? '#06B6D4'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <AnimatePresence mode="popLayout">
        {variants.map((variant, i) => (
          <motion.div
            key={variant.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            onClick={() => onSelectVariant(variant.id)}
            className={`group relative rounded-xl border transition-colors cursor-pointer ${
              activeVariantId === variant.id
                ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
            }`}
          >
            {/* Mini preview area */}
            <div
              className="h-28 rounded-t-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}08` }}
            >
              <div
                className="px-4 py-2 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${accent}20`, color: accent }}
              >
                {variant.name}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/[0.04]">
              <span className="text-xs font-medium text-[var(--text-primary)]">{variant.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectVariant(variant.id)
                  }}
                  className="p-1 rounded-md hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteVariant(variant.id)
                  }}
                  className="p-1 rounded-md hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add variant card */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={onAddVariant}
        className="flex flex-col items-center justify-center gap-2 h-[156px] rounded-xl border border-dashed border-white/[0.08] hover:border-[var(--accent)]/30 hover:bg-white/[0.02] transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[#06B6D4]/15 transition-colors">
          <Plus className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[#94A3B8] transition-colors">
          Add Variant
        </span>
      </motion.button>
    </div>
  )
}
