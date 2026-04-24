'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Boxes, ListTodo, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useProduct } from '../../layout'
import { useGraphStore } from '../../../../../lib/graph-store'
import { useTaskStore } from '../../../../../lib/task-store'
import { useValidation } from '../../../../../lib/validation-engine'

// R20: stat tone — categorical identity via tone ramp, not raw hex.
type StatTone = 'accent' | 'accent-text' | 'warning'

const TONE_BG_SOFT: Record<StatTone, string> = {
  accent:        'bg-[var(--accent-subtle)]',
  'accent-text': 'bg-[var(--accent-muted)]',
  warning:       'bg-[var(--color-warning-muted)]',
}

const TONE_ICON_TEXT: Record<StatTone, string> = {
  accent:        'text-[var(--accent)]',
  'accent-text': 'text-[var(--accent-text)]',
  warning:       'text-[var(--color-warning)]',
}

function useLiveStats() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params?.orgSlug && params?.productSlug
    ? `${params.orgSlug}-${params.productSlug}`
    : '')

  const rawNodes = useGraphStore((s) => s.nodes)
  const rawTasks = useTaskStore((s) => s.tasks)

  const graphNodes = useMemo(() => rawNodes.filter((n) => n.productId === productId), [rawNodes, productId])
  const productTasks = useMemo(() => rawTasks.filter((t) => t.productId === productId), [rawTasks, productId])
  const openTasks = useMemo(() => productTasks.filter((t) => t.status !== 'done'), [productTasks])
  const inReview = useMemo(() => productTasks.filter((t) => t.status === 'in_review'), [productTasks])
  const { warningCount } = useValidation(productId)

  const hasRealData = graphNodes.length > 0 || productTasks.length > 0

  return hasRealData
    ? [
        { label: 'Graph Nodes', value: graphNodes.length, trend: graphNodes.length > 0 ? +graphNodes.length : 0, icon: Boxes, tone: 'accent' as StatTone },
        { label: 'Open Tasks', value: openTasks.length, trend: openTasks.length > 0 ? -openTasks.length : 0, icon: ListTodo, tone: 'warning' as StatTone },
        { label: 'Pending Reviews', value: inReview.length, trend: inReview.length, icon: ShieldCheck, tone: 'accent-text' as StatTone },
      ]
    : [
        { label: 'Total Nodes', value: 47, trend: +5, icon: Boxes, tone: 'accent' as StatTone },
        { label: 'Open Tasks', value: 12, trend: -2, icon: ListTodo, tone: 'warning' as StatTone },
        { label: 'Pending Approvals', value: 3, trend: +1, icon: ShieldCheck, tone: 'accent-text' as StatTone },
      ]
}

export function QuickStats() {
  const stats = useLiveStats()
  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const isPositive = stat.trend > 0
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TONE_BG_SOFT[stat.tone]}`}>
                <Icon className={`w-4 h-4 ${TONE_ICON_TEXT[stat.tone]}`} />
              </div>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-[var(--color-success)]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[var(--color-error)]" />
                )}
                <span className={`text-xs font-medium ${isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                  {isPositive ? '+' : ''}
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</span>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{stat.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
