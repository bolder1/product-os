'use client'

import { motion } from 'framer-motion'
import { Eye, CheckCircle2, Circle } from 'lucide-react'
import { type HandoffItem } from '../_data/mock-handoffs'

interface HandoffCardProps {
  item: HandoffItem
  index: number
  onViewSpec: (id: string) => void
}

const typeConfig: Record<string, { label: string; color: string }> = {
  component: { label: 'Component', color: '#3B82F6' },
  page: { label: 'Page', color: '#8B5CF6' },
  token: { label: 'Token', color: '#F59E0B' },
}

export function HandoffCard({ item, index, onViewSpec }: HandoffCardProps) {
  const typeInfo = typeConfig[item.type]
  const doneCriteria = item.criteria.filter((c) => c.done).length
  const totalCriteria = item.criteria.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="group flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[#F59E0B]/30 transition-all duration-200 overflow-hidden"
    >
      {/* Preview area */}
      <div
        className="h-28 flex items-center justify-center relative"
        style={{ backgroundColor: `${item.previewColor}08` }}
      >
        <div
          className="w-16 h-10 rounded-lg border-2 border-dashed flex items-center justify-center"
          style={{
            borderColor: `${item.previewColor}40`,
            backgroundColor: `${item.previewColor}15`,
          }}
        >
          <span
            className="text-xs font-mono font-medium"
            style={{ color: item.previewColor }}
          >
            {'</>'}
          </span>
        </div>
        {/* Type badge */}
        <span
          className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{
            color: typeInfo.color,
            backgroundColor: `${typeInfo.color}15`,
          }}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F1F5F9]">{item.name}</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {item.specs.length} specs / {item.tokens.length} tokens
          </p>
        </div>

        {/* Completeness bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#64748B]">Spec completeness</span>
            <span
              className="text-[10px] font-medium"
              style={{
                color:
                  item.completeness >= 90
                    ? '#10B981'
                    : item.completeness >= 70
                    ? '#F59E0B'
                    : '#F43F5E',
              }}
            >
              {item.completeness}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.completeness}%` }}
              transition={{ delay: index * 0.06 + 0.3, duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                backgroundColor:
                  item.completeness >= 90
                    ? '#10B981'
                    : item.completeness >= 70
                    ? '#F59E0B'
                    : '#F43F5E',
              }}
            />
          </div>
        </div>

        {/* Criteria summary */}
        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
          {doneCriteria === totalCriteria ? (
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
          ) : (
            <Circle className="w-3 h-3" />
          )}
          <span>
            {doneCriteria}/{totalCriteria} acceptance criteria met
          </span>
        </div>

        {/* View spec button */}
        <button
          onClick={() => onViewSpec(item.id)}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-colors mt-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          View Spec
        </button>
      </div>
    </motion.div>
  )
}
