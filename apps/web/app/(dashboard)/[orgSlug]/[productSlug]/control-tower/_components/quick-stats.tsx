'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Boxes, ListTodo, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useGraphStore } from '../../../../../lib/graph-store'
import { useTaskStore } from '../../../../../lib/task-store'
import { useValidation } from '../../../../../lib/validation-engine'

function useLiveStats() {
  const params = useParams()
  const productId = params?.orgSlug && params?.productSlug
    ? `${params.orgSlug}-${params.productSlug}`
    : ''

  const graphNodes = useGraphStore((s) => s.nodes).filter((n) => n.productId === productId)
  const allTasks = useTaskStore((s) => s.tasks).filter((t) => t.productId === productId)
  const openTasks = allTasks.filter((t) => t.status !== 'done')
  const inReview = allTasks.filter((t) => t.status === 'in_review')
  const { warningCount } = useValidation(productId)

  const hasRealData = graphNodes.length > 0 || allTasks.length > 0

  return hasRealData
    ? [
        { label: 'Graph Nodes', value: graphNodes.length, trend: graphNodes.length > 0 ? +graphNodes.length : 0, icon: Boxes, color: '#3B82F6' },
        { label: 'Open Tasks', value: openTasks.length, trend: openTasks.length > 0 ? -openTasks.length : 0, icon: ListTodo, color: '#F59E0B' },
        { label: 'Pending Reviews', value: inReview.length, trend: inReview.length, icon: ShieldCheck, color: '#8B5CF6' },
      ]
    : [
        { label: 'Total Nodes', value: 47, trend: +5, icon: Boxes, color: '#3B82F6' },
        { label: 'Open Tasks', value: 12, trend: -2, icon: ListTodo, color: '#F59E0B' },
        { label: 'Pending Approvals', value: 3, trend: +1, icon: ShieldCheck, color: '#8B5CF6' },
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
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-[#10B981]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#F43F5E]" />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: isPositive ? '#10B981' : '#F43F5E' }}
                >
                  {isPositive ? '+' : ''}
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-[#F1F5F9]">{stat.value}</span>
              <p className="text-xs text-[#64748B] mt-1">{stat.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
