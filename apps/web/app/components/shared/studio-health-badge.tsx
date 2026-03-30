'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { useGraphStore } from '../../lib/graph-store'
import { useTaskStore } from '../../lib/task-store'
import {
  calculateReadinessScore,
  runValidation,
  type ReadinessScore,
  type ValidationIssue,
} from '../../lib/validation-engine'

type StudioKey = keyof Omit<ReadinessScore, 'overall'>

interface StudioHealthBadgeProps {
  productId: string
  studio: StudioKey
  showDetails?: boolean
}

const studioLabels: Record<StudioKey, string> = {
  plan: 'Planner',
  brand: 'Brand',
  components: 'Components',
  design: 'Design',
  workflows: 'Workflows',
  pages: 'Pages',
  code: 'Code',
  testing: 'Testing',
  analytics: 'Analytics',
}

function getScoreColor(score: number) {
  if (score >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: '#10B981' }
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', ring: '#F59E0B' }
  return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', ring: '#F43F5E' }
}

function getScoreIcon(score: number) {
  if (score >= 70) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  if (score >= 40) return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
  return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Needs Work'
  return 'Not Started'
}

/** Compact badge showing studio readiness score. Place in studio headers. */
export function StudioHealthBadge({ productId, studio, showDetails = false }: StudioHealthBadgeProps) {
  // Subscribe to store changes so score recomputes
  const _nodes = useGraphStore((s) => s.nodes)
  const _edges = useGraphStore((s) => s.edges)
  const _tasks = useTaskStore((s) => s.tasks)

  const readiness = useMemo(() => calculateReadinessScore(productId), [productId, _nodes, _edges, _tasks])
  const score = readiness[studio]
  const colors = getScoreColor(score)

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${colors.bg} ${colors.border}`}>
        {getScoreIcon(score)}
        <span className={`text-[0.625rem] font-medium ${colors.text}`}>
          {score}%
        </span>
      </div>
    )
  }

  const issues = useMemo(() => {
    const all = runValidation(productId)
    return all.filter((i) => i.studio === studio || i.studio === studioLabels[studio]?.toLowerCase())
  }, [productId, _nodes, _edges, _tasks, studio])

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {getScoreIcon(score)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${colors.text}`}>
              {studioLabels[studio]} Readiness: {score}%
            </span>
            <span className="text-[0.625rem] text-[#64748B]">
              {getScoreLabel(score)}
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="h-1 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: colors.ring }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
      </div>

      {issues.length > 0 && (
        <div className="border-t border-white/[0.04] px-3 py-2 space-y-1">
          {issues.slice(0, 3).map((issue) => (
            <div key={issue.id} className="flex items-start gap-1.5">
              {issue.severity === 'error' ? (
                <AlertCircle className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
              ) : issue.severity === 'warning' ? (
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              ) : (
                <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[0.625rem] text-[#94A3B8] leading-snug">{issue.title}</p>
                {issue.suggestion && (
                  <p className="text-[0.5625rem] text-[#475569] mt-0.5">{issue.suggestion}</p>
                )}
              </div>
            </div>
          ))}
          {issues.length > 3 && (
            <p className="text-[0.5625rem] text-[#475569]">
              +{issues.length - 3} more issue{issues.length - 3 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}

/** Overall product health bar for studio headers */
export function ProductHealthBar({ productId }: { productId: string }) {
  const _nodes = useGraphStore((s) => s.nodes)
  const _edges = useGraphStore((s) => s.edges)
  const _tasks = useTaskStore((s) => s.tasks)

  const readiness = useMemo(() => calculateReadinessScore(productId), [productId, _nodes, _edges, _tasks])
  const colors = getScoreColor(readiness.overall)

  const studios: StudioKey[] = ['plan', 'brand', 'components', 'design', 'workflows', 'pages', 'code', 'testing', 'analytics']

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${colors.bg} ${colors.border}`}>
        {getScoreIcon(readiness.overall)}
        <span className={`text-[0.625rem] font-medium ${colors.text}`}>
          {readiness.overall}% ready
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {studios.map((s) => {
          const sc = readiness[s]
          const c = getScoreColor(sc)
          return (
            <div
              key={s}
              className="w-1.5 h-4 rounded-sm"
              style={{ backgroundColor: c.ring, opacity: Math.max(0.2, sc / 100) }}
              title={`${studioLabels[s]}: ${sc}%`}
            />
          )
        })}
      </div>
    </div>
  )
}
