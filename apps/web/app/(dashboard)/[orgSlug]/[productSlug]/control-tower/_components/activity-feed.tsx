'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useProduct } from '../../layout'
import { useActivityStore } from '../../../../../lib/activity-store'

// R20.6 — studio badge identity via label only. Uniform accent background.
// Previously role-coded per studio; retired per palette consolidation.

const fallbackActivities = [
  { actor: 'Alice', action: 'created Feature: User Auth', time: '2m ago', studio: 'Features' },
  { actor: 'Bob', action: 'approved Component: Button', time: '8m ago', studio: 'Components' },
  { actor: 'AI', action: 'suggested 3 improvements for Dashboard Page', time: '15m ago', studio: 'AI' },
  { actor: 'Carol', action: 'updated Design Token: primary-blue', time: '22m ago', studio: 'Design' },
  { actor: 'Dave', action: 'completed Task: Setup CI/CD pipeline', time: '35m ago', studio: 'Tasks' },
  { actor: 'Eve', action: 'published Page: Landing Page v2', time: '1h ago', studio: 'Pages' },
  { actor: 'Frank', action: 'added 12 test cases for Auth module', time: '1.5h ago', studio: 'Testing' },
  { actor: 'Alice', action: 'tagged Release: v0.3.0-beta', time: '2h ago', studio: 'Releases' },
]

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getInitials(name: string) {
  return name.charAt(0).toUpperCase()
}

// R20.6 — avatars rendered uniformly with --accent; actor distinction via initials.

export function ActivityFeed() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug
  const allActivities = useActivityStore((s) => s.activities)
  const storeActivities = useMemo(() => allActivities.filter((a) => a.productId === productId), [allActivities, productId])

  const activities = useMemo(() => {
    if (storeActivities.length > 0) {
      return storeActivities.slice(0, 10).map((a) => ({
        actor: a.actor?.name ?? 'Unknown',
        action: a.title,
        time: timeAgo(a.timestamp),
        studio: a.studio ? a.studio.charAt(0).toUpperCase() + a.studio.slice(1) : 'General',
      }))
    }
    return fallbackActivities
  }, [storeActivities])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Activity Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1 max-h-[340px] scrollbar-thin">
        {activities.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.06, duration: 0.35 }}
            className="flex items-start gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-text)]">
              {getInitials(item.actor)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] leading-snug">
                <span className="font-medium">{item.actor}</span>{' '}
                <span className="text-[var(--text-secondary)]">{item.action}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[var(--text-tertiary)]">{item.time}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                  {item.studio}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
