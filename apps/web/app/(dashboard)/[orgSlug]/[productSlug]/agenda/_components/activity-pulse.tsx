'use client'

import { motion } from 'framer-motion'
import { Activity, CheckCircle2, Layers, Palette, Rocket, Sparkles, FileText, Component, ArrowRight } from 'lucide-react'
import { useActivityStore, type ActivityType } from '../../../../../lib/activity-store'

// R20: per-activity hex retired in favor of a 5-tone semantic ramp. Identity
// is carried by the icon; color carries meaning (success/warning/etc.), not
// distinguishability.
type ActivityTone = 'accent' | 'accent-text' | 'success' | 'warning' | 'neutral'

const TONE_BG_SOFT: Record<ActivityTone, string> = {
  accent:        'bg-[var(--accent-subtle)]',
  'accent-text': 'bg-[var(--accent-muted)]',
  success:       'bg-[var(--color-success-muted)]',
  warning:       'bg-[var(--color-warning-muted)]',
  neutral:       'bg-white/[0.04]',
}

const TONE_TEXT: Record<ActivityTone, string> = {
  accent:        'text-[var(--accent)]',
  'accent-text': 'text-[var(--accent-text)]',
  success:       'text-[var(--color-success)]',
  warning:       'text-[var(--color-warning)]',
  neutral:       'text-[var(--text-tertiary)]',
}

const activityMeta: Partial<Record<ActivityType, { icon: React.ElementType; tone: ActivityTone }>> = {
  task_created:      { icon: CheckCircle2, tone: 'accent' },
  task_completed:    { icon: CheckCircle2, tone: 'success' },
  product_created:   { icon: Layers,       tone: 'accent-text' },
  plan_created:      { icon: Sparkles,     tone: 'accent-text' },
  brand_updated:     { icon: Palette,      tone: 'accent-text' },
  component_created: { icon: Component,    tone: 'accent-text' },
  page_published:    { icon: FileText,     tone: 'success' },
  release_created:   { icon: Rocket,       tone: 'warning' },
  ai_skill_used:     { icon: Sparkles,     tone: 'accent-text' },
  comment_added:     { icon: FileText,     tone: 'neutral' },
  member_joined:     { icon: Activity,     tone: 'accent' },
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
            const meta = activityMeta[item.type] ?? { icon: Activity, tone: 'neutral' as const }
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
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${TONE_BG_SOFT[meta.tone]}`}>
                  <Icon size={13} className={TONE_TEXT[meta.tone]} />
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
