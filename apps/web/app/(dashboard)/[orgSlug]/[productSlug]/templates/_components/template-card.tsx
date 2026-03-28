'use client'

import { motion } from 'framer-motion'
import {
  Layout,
  Smartphone,
  Globe,
  Palette,
  Settings,
  Box,
} from 'lucide-react'
import type { Template } from '../_data/templates'

const categoryIcons: Record<string, React.ElementType> = {
  SaaS: Layout,
  'Internal Tool': Settings,
  Marketing: Globe,
  Mobile: Smartphone,
  'Design System': Palette,
}

const categoryGradients: Record<string, string> = {
  SaaS: 'from-[#3B82F6]/20 to-[#8B5CF6]/20',
  'Internal Tool': 'from-[#10B981]/20 to-[#06B6D4]/20',
  Marketing: 'from-[#F59E0B]/20 to-[#F43F5E]/20',
  Mobile: 'from-[#8B5CF6]/20 to-[#EC4899]/20',
  'Design System': 'from-[#06B6D4]/20 to-[#3B82F6]/20',
}

interface TemplateCardProps {
  template: Template
  index: number
  onClick: () => void
}

export function TemplateCard({ template, index, onClick }: TemplateCardProps) {
  const Icon = categoryIcons[template.category] || Box
  const gradient = categoryGradients[template.category] || 'from-[#3B82F6]/20 to-[#8B5CF6]/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)] overflow-hidden"
    >
      {/* Thumbnail */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors" />
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.08] text-[#94A3B8] border border-white/[0.06]">
          {template.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-[#F1F5F9] font-semibold text-sm">{template.name}</h3>
          <p className="text-[#64748B] text-xs mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3B82F6]/10 text-[#3B82F6]/80 border border-[#3B82F6]/10"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-[#64748B]">
              +{template.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 text-[10px] text-[#64748B]">
            <span>{template.nodeCount} nodes</span>
            <span>{template.edgeCount} edges</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="px-3 py-1 rounded-md text-xs font-medium bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 border border-[#3B82F6]/20 transition-colors"
          >
            Use
          </button>
        </div>
      </div>
    </motion.div>
  )
}
