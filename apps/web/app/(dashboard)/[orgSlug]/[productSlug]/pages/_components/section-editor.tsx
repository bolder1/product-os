'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Layout,
  Grid3X3,
  Type,
  ArrowRight,
  MessageSquareQuote,
  DollarSign,
  HelpCircle,
  Image,
  BarChart3,
  Footprints,
  Puzzle,
  X,
} from 'lucide-react'
import { SectionCard } from './section-card'
import {
  SECTION_TYPES,
  SECTION_COLORS,
  type SectionDef,
  type PageDef,
} from '../_data/mock-pages'

const SECTION_ICONS: Record<string, React.ElementType> = {
  Hero: Layout,
  Features: Grid3X3,
  Content: Type,
  CTA: ArrowRight,
  Testimonials: MessageSquareQuote,
  Pricing: DollarSign,
  FAQ: HelpCircle,
  Gallery: Image,
  Stats: BarChart3,
  Footer: Footprints,
  Custom: Puzzle,
}

interface SectionEditorProps {
  page: PageDef
  selectedSectionId: string | null
  onSelectSection: (id: string | null) => void
  onAddSection: (type: string, atIndex: number) => void
  onDeleteSection: (sectionId: string) => void
}

function DropZone({
  index,
  onAdd,
}: {
  index: number
  onAdd: (type: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center justify-center py-1 group"
      >
        <div className="flex-1 h-px bg-white/[0.06] group-hover:bg-[var(--accent)]/30 transition-colors" />
        <div className="mx-2 w-5 h-5 rounded-full border border-dashed border-white/[0.1] group-hover:border-[var(--accent)]/50 flex items-center justify-center transition-colors">
          <Plus className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
        </div>
        <div className="flex-1 h-px bg-white/[0.06] group-hover:bg-[var(--accent)]/30 transition-colors" />
      </button>

      <AnimatePresence>
        {showPicker && (
          <SectionTypePicker
            onSelect={(type) => {
              onAdd(type)
              setShowPicker(false)
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionTypePicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute left-1/2 -translate-x-1/2 z-20 mt-1 w-[340px] bg-[var(--bg-surface-raised)] border border-white/[0.1] rounded-xl p-3 shadow-xl shadow-black/40"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          Add Section
        </span>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-white/[0.06] text-[var(--text-tertiary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {SECTION_TYPES.map((type) => {
          const color = SECTION_COLORS[type] || SECTION_COLORS.Custom
          const Icon = SECTION_ICONS[type] || Puzzle
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-white/[0.05] transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {type}
              </span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

export function SectionEditor({
  page,
  selectedSectionId,
  onSelectSection,
  onAddSection,
  onDeleteSection,
}: SectionEditorProps) {
  const [showBottomPicker, setShowBottomPicker] = useState(false)
  const sections = [...page.sections].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-1 pb-4 border-b border-white/[0.06] mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              page.status === 'published' ? 'bg-emerald-400' : 'bg-gray-500'
            }`}
          />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {page.name}
          </h2>
          <span className="text-xs text-[var(--text-tertiary)]">{page.slug}</span>
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto space-y-0">
        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <Layout className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">No sections yet</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Add sections to build this page
            </p>
          </div>
        )}

        {sections.map((section, index) => (
          <div key={section.id}>
            {/* Drop zone before */}
            <DropZone
              index={index}
              onAdd={(type) => onAddSection(type, index)}
            />

            {/* Section card */}
            <SectionCard
              section={section}
              isSelected={selectedSectionId === section.id}
              onSelect={() =>
                onSelectSection(
                  selectedSectionId === section.id ? null : section.id
                )
              }
              onDelete={() => onDeleteSection(section.id)}
            />
          </div>
        ))}

        {/* Drop zone / add button at bottom */}
        <div className="relative pt-1">
          <button
            onClick={() => setShowBottomPicker(!showBottomPicker)}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-lg border border-dashed border-white/[0.08] hover:border-[var(--accent)]/30 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-medium">Add Section</span>
          </button>

          <AnimatePresence>
            {showBottomPicker && (
              <SectionTypePicker
                onSelect={(type) => {
                  onAddSection(type, sections.length)
                  setShowBottomPicker(false)
                }}
                onClose={() => setShowBottomPicker(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
