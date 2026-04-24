'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, SkipForward, RefreshCw, Layers } from 'lucide-react'

export type ConflictResolution = 'skip' | 'rename' | 'overwrite'

export interface ConflictItem {
  templateNodeId: string
  kind: string
  label: string
  existingNodeId: string
  existingLabel: string
}

interface Props {
  bundleName: string
  totalNodes: number
  newNodes: number
  conflicts: ConflictItem[]
  resolutions: Record<string, ConflictResolution>
  onResolutionChange: (templateNodeId: string, resolution: ConflictResolution) => void
  onResolveAll: (resolution: ConflictResolution) => void
}

const KIND_COLORS: Record<string, string> = {
  module:    '#3B82F6',
  feature:   '#8B5CF6',
  page:      '#10B981',
  entity:    '#F59E0B',
  workflow:  '#06B6D4',
  token:     '#EC4899',
  component: '#F97316',
  journey:   '#64748B',
}

const RESOLUTION_OPTIONS: { key: ConflictResolution; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'skip',
    label: 'Skip',
    desc: 'Keep existing, don\'t create',
    icon: <SkipForward size={11} />,
    color: '#64748B',
  },
  {
    key: 'rename',
    label: 'Rename',
    desc: 'Create with " (copy)" suffix',
    icon: <RefreshCw size={11} />,
    color: '#F59E0B',
  },
  {
    key: 'overwrite',
    label: 'Overwrite',
    desc: 'Replace the existing node',
    icon: <Layers size={11} />,
    color: '#EF4444',
  },
]

export function ConflictPreviewStep({
  bundleName,
  totalNodes,
  newNodes,
  conflicts,
  resolutions,
  onResolutionChange,
  onResolveAll,
}: Props) {
  if (conflicts.length === 0) {
    return (
      <div className="p-5 flex flex-col items-center gap-3 text-center py-8">
        <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/15 border border-[var(--color-success)]/30 flex items-center justify-center">
          <CheckCircle2 size={22} className="text-[var(--color-success)]" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">No conflicts</p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            All {totalNodes} nodes from <strong>{bundleName}</strong> are new — nothing in your graph will be changed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      {/* Summary bar */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-amber-300">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found.</span>
          {' '}
          <span className="text-[var(--text-secondary)]">
            {newNodes} nodes are new. For each conflict, choose how to proceed.
          </span>
        </div>
      </div>

      {/* Resolve-all shortcuts */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--text-tertiary)]">Resolve all:</span>
        {RESOLUTION_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onResolveAll(opt.key)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-white/[0.08] hover:border-white/[0.18] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            style={{ color: opt.color }}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conflict list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
        {conflicts.map((conflict) => {
          const current = resolutions[conflict.templateNodeId] ?? 'skip'
          const color = KIND_COLORS[conflict.kind] ?? '#64748B'

          return (
            <motion.div
              key={conflict.templateNodeId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2.5"
            >
              {/* Node info */}
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{conflict.label}</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  {conflict.kind}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)] shrink-0 ml-auto">already exists</span>
              </div>

              {/* Resolution picker */}
              <div className="flex gap-1.5">
                {RESOLUTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => onResolutionChange(conflict.templateNodeId, opt.key)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                      current === opt.key
                        ? 'border-current bg-current/10'
                        : 'border-white/[0.07] bg-transparent text-[var(--text-tertiary)] hover:border-white/[0.15]'
                    }`}
                    style={current === opt.key ? { color: opt.color, borderColor: opt.color } : {}}
                    title={opt.desc}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Resolution description */}
              <p className="text-[9px] text-[var(--text-tertiary)]">
                {RESOLUTION_OPTIONS.find((o) => o.key === current)?.desc}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
