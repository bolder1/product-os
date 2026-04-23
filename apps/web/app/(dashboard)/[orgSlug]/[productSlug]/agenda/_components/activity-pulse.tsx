'use client'

import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Layers, Palette, Rocket, Sparkles, FileText, Component, ArrowRight } from 'lucide-react'
import { useActivityStore, type ActivityType } from '../../../../../lib/activity-store'

const activityMeta: Partial<Record<ActivityType, { icon: React.ElementType; color: string }>> = {
  task_created: { icon: CheckCircle2, color: '#6398ff' },
  task_completed: { icon: CheckCircle2, color: '#3dd68c' },
  product_created: { icon: Layers, color: '#8b5cf6' },
  plan_created: { icon: Sparkles, color: '#8b5cf6' },
  brand_updated: { icon: Palette, color: '#ec4899' },
  component_created: { icon: Component, color: '#06b6d4' },
  page_published: { icon: FileText, color: '#3dd68c' },
  release_created: { icon: Rocket, color: '#e8a830' },
  ai_skill_used: { icon: Sparkles, color: '#8b5cf6' },
  comment_added: { icon: FileText, color: '#64748b' },
  member_joined: { icon: Activity, color: '#6398ff' },
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ActivityPulse() {
  const activities = useActivityStore((s) => s.activities.slice(0, 8))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
          Recent Activity
        </h2>
        {activities.length > 0 && (
          <button className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
            View all <ArrowRight size={10} />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-tertiary)]">No recent activity</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {activities.map((item, i) => {
            const meta = activityMeta[item.type] ?? { icon: Activity, color: '#64748b' }
            const Icon = meta.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                className="flex items-center gap-3 py-2.5 px-1 rounded-md cursor-default transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${meta.color}15` }}
                >
                  <Icon size={13} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--text-secondary)] truncate">{item.title}</p>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
                  {timeAgo(item.timestamp)}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
