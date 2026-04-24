'use client'

import { motion } from 'framer-motion'
import { Eye, CheckCircle2, Circle } from 'lucide-react'
import { type HandoffItem } from '../_data/mock-handoffs'

interface HandoffCardProps {
  item: HandoffItem
  index: number
  onViewSpec: (id: string) => void
}

// R20: type + completeness tones replace raw hex. Tone maps to chrome
// classes via TONE_PILL_SOFT / TONE_TEXT / TONE_BAR_BG.
type HandoffTone = 'accent' | 'accent-text' | 'warning' | 'success' | 'error'

const TONE_PILL_SOFT: Record<HandoffTone, string> = {
  accent:        'bg-[var(--accent-muted)] text-[var(--accent)]',
  'accent-text': 'bg-[var(--accent-muted)] text-[var(--accent-text)]',
  warning:       'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  success:       'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  error:         'bg-[var(--color-error-muted)] text-[var(--color-error)]',
}

const TONE_TEXT: Record<HandoffTone, string> = {
  accent:        'text-[var(--accent)]',
  'accent-text': 'text-[var(--accent-text)]',
  warning:       'text-[var(--color-warning)]',
  success:       'text-[var(--color-success)]',
  error:         'text-[var(--color-error)]',
}

const TONE_BAR_BG: Record<HandoffTone, string> = {
  accent:        'bg-[var(--accent)]',
  'accent-text': 'bg-[var(--accent-text)]',
  warning:       'bg-[var(--color-warning)]',
  success:       'bg-[var(--color-success)]',
  error:         'bg-[var(--color-error)]',
}

function completenessTone(pct: number): HandoffTone {
  if (pct >= 90) return 'success'
  if (pct >= 70) return 'warning'
  return 'error'
}

const typeConfig: Record<string, { label: string; tone: HandoffTone }> = {
  component: { label: 'Component', tone: 'accent' },
  page:      { label: 'Page',      tone: 'accent-text' },
  token:     { label: 'Token',     tone: 'warning' },
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
      className="group flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-[var(--color-warning)]/30 transition-all duration-200 overflow-hidden"
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
        <span className={`absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full ${TONE_PILL_SOFT[typeInfo.tone]}`}>
          {typeInfo.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {item.specs.length} specs / {item.tokens.length} tokens
          </p>
        </div>

        {/* Completeness bar */}
        <div>
          {(() => {
            const cTone = completenessTone(item.completeness)
            return (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)]">Spec completeness</span>
                  <span className={`text-[10px] font-medium ${TONE_TEXT[cTone]}`}>
                    {item.completeness}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.completeness}%` }}
                    transition={{ delay: index * 0.06 + 0.3, duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${TONE_BAR_BG[cTone]}`}
                  />
                </div>
              </>
            )
          })()}
        </div>

        {/* Criteria summary */}
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
          {doneCriteria === totalCriteria ? (
            <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
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
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20 border border-[var(--color-warning)]/20 transition-colors mt-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          View Spec
        </button>
      </div>
    </motion.div>
  )
}
