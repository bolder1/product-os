'use client'

import { motion } from 'framer-motion'
import {
  GripVertical,
  Pencil,
  Trash2,
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
} from 'lucide-react'
import { SECTION_COLORS, type SectionDef } from '../_data/mock-pages'

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

interface SectionCardProps {
  section: SectionDef
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SectionPreview({ section }: { section: SectionDef }) {
  const color = SECTION_COLORS[section.type] || '#64748B'

  switch (section.type) {
    case 'Hero':
      return (
        <div className="space-y-2">
          <div
            className="h-3 rounded w-3/4"
            style={{ backgroundColor: `${color}20` }}
          />
          <div className="h-2 rounded w-1/2 bg-white/[0.04]" />
          <div
            className="h-6 w-24 rounded mt-2"
            style={{ backgroundColor: `${color}25` }}
          />
        </div>
      )
    case 'Features':
      return (
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: `${color}20` }}
              />
              <div className="h-1.5 rounded w-full bg-white/[0.04]" />
              <div className="h-1 rounded w-3/4 bg-white/[0.03]" />
            </div>
          ))}
        </div>
      )
    case 'Pricing':
      return (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded p-2 space-y-1"
              style={{ backgroundColor: `${color}08` }}
            >
              <div className="h-1.5 rounded w-2/3 bg-white/[0.06]" />
              <div
                className="h-2.5 rounded w-1/2"
                style={{ backgroundColor: `${color}20` }}
              />
              <div className="h-1 rounded w-full bg-white/[0.03]" />
              <div className="h-1 rounded w-full bg-white/[0.03]" />
            </div>
          ))}
        </div>
      )
    case 'Stats':
      return (
        <div className="flex gap-4 justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div
                className="h-3 w-8 rounded mx-auto"
                style={{ backgroundColor: `${color}20` }}
              />
              <div className="h-1 w-10 rounded mx-auto bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )
    case 'CTA':
      return (
        <div className="text-center space-y-2">
          <div
            className="h-2.5 rounded w-1/2 mx-auto"
            style={{ backgroundColor: `${color}20` }}
          />
          <div className="h-1.5 rounded w-2/3 mx-auto bg-white/[0.04]" />
          <div
            className="h-5 w-20 rounded mx-auto mt-1"
            style={{ backgroundColor: `${color}25` }}
          />
        </div>
      )
    case 'Gallery':
      return (
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded"
              style={{ backgroundColor: `${color}12` }}
            />
          ))}
        </div>
      )
    case 'FAQ':
      return (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              />
              <div className="h-1.5 rounded flex-1 bg-white/[0.04]" />
            </div>
          ))}
        </div>
      )
    case 'Content':
      return (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded w-full bg-white/[0.05]" />
          <div className="h-1.5 rounded w-11/12 bg-white/[0.04]" />
          <div className="h-1.5 rounded w-4/5 bg-white/[0.03]" />
        </div>
      )
    default:
      return (
        <div className="space-y-1.5">
          <div className="h-2 rounded w-1/3 bg-white/[0.05]" />
          <div className="h-1.5 rounded w-full bg-white/[0.03]" />
        </div>
      )
  }
}

export function SectionCard({
  section,
  isSelected,
  onSelect,
  onDelete,
}: SectionCardProps) {
  const color = SECTION_COLORS[section.type] || '#64748B'
  const Icon = SECTION_ICONS[section.type] || Puzzle

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`group relative bg-white/[0.03] rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'ring-1 ring-[var(--accent)]/50 bg-white/[0.05]'
          : 'border border-white/[0.08] hover:border-white/[0.14]'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Type badge */}
          <span
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: `${color}18`,
              color: color,
            }}
          >
            <Icon className="w-3 h-3" />
            {section.type}
          </span>
        </div>

        {/* Actions (shown on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-grab transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="pointer-events-none">
        <SectionPreview section={section} />
      </div>
    </motion.div>
  )
}
