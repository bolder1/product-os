'use client'

import { motion } from 'framer-motion'
import {
  Users,
  Package,
  Clock,
  HardDrive,
  Shield,
  UserPlus,
  Settings,
  Trash2,
  UserCheck,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

// R20: stat/action tone — semantic tone ramp replaces raw hex. Tone maps
// to chrome classes via TONE_BG_SOFT / TONE_ICON_TEXT below.
type StatTone = 'accent' | 'accent-text' | 'success' | 'warning' | 'error'

const TONE_BG_SOFT: Record<StatTone, string> = {
  accent:        'bg-[var(--accent-subtle)]',
  'accent-text': 'bg-[var(--accent-muted)]',
  success:       'bg-[var(--color-success-muted)]',
  warning:       'bg-[var(--color-warning-muted)]',
  error:         'bg-[var(--color-error-muted)]',
}

const TONE_ICON_TEXT: Record<StatTone, string> = {
  accent:        'text-[var(--accent)]',
  'accent-text': 'text-[var(--accent-text)]',
  success:       'text-[var(--color-success)]',
  warning:       'text-[var(--color-warning)]',
  error:         'text-[var(--color-error)]',
}

const stats: { label: string; value: string; icon: typeof Users; tone: StatTone; change: string }[] = [
  { label: 'Total Members', value: '24', icon: Users, tone: 'accent', change: '+3 this month' },
  { label: 'Active Products', value: '7', icon: Package, tone: 'success', change: '+1 this week' },
  { label: 'Pending Requests', value: '4', icon: Clock, tone: 'warning', change: '2 urgent' },
  { label: 'Storage Used', value: '18.4 GB', icon: HardDrive, tone: 'accent-text', change: 'of 50 GB' },
]

const activityBars = [
  { day: 'Mon', height: 60 },
  { day: 'Tue', height: 85 },
  { day: 'Wed', height: 45 },
  { day: 'Thu', height: 92 },
  { day: 'Fri', height: 70 },
  { day: 'Sat', height: 30 },
  { day: 'Sun', height: 20 },
  { day: 'Mon', height: 75 },
  { day: 'Tue', height: 55 },
  { day: 'Wed', height: 88 },
  { day: 'Thu', height: 65 },
  { day: 'Fri', height: 50 },
]

const recentActions: { id: string; text: string; icon: typeof UserPlus; tone: StatTone; time: string }[] = [
  { id: '1', text: 'Invited alex.chen@company.com as Frontend Dev', icon: UserPlus, tone: 'accent', time: '2 hours ago' },
  { id: '2', text: 'Changed role of Sarah Kim to Manager', icon: Shield, tone: 'warning', time: '5 hours ago' },
  { id: '3', text: 'Approved access request for Design Studio', icon: UserCheck, tone: 'success', time: '1 day ago' },
  { id: '4', text: 'Updated permissions for QA Engineer role', icon: Settings, tone: 'accent-text', time: '2 days ago' },
  { id: '5', text: 'Removed inactive member john.doe@company.com', icon: Trash2, tone: 'error', time: '3 days ago' },
]

export default function AdminOverview() {
  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
              variants={fadeUp}
              custom={i}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TONE_BG_SOFT[stat.tone]}`}>
                  <Icon className={`w-5 h-5 ${TONE_ICON_TEXT[stat.tone]}`} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">{stat.label}</div>
              <div className="text-[10px] mt-2 px-2 py-0.5 rounded-full bg-white/[0.04] text-[var(--text-secondary)] inline-block">
                {stat.change}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity chart placeholder */}
        <motion.div
          className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          variants={fadeUp}
          custom={4}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Activity</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                Logins
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]/30" />
                Actions
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {activityBars.map((bar, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[var(--accent)]/60 to-[var(--accent)]/20"
                initial={{ height: 0 }}
                animate={{ height: `${bar.height}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {activityBars.map((bar, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-[var(--text-tertiary)]">
                {i % 3 === 0 ? bar.day : ''}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent admin actions */}
        <motion.div
          className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          variants={fadeUp}
          custom={5}
        >
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Recent Admin Actions</h3>
          <div className="flex flex-col gap-3">
            {recentActions.map((action, i) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.id}
                  className="flex items-start gap-3 group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TONE_BG_SOFT[action.tone]}`}>
                    <Icon className={`w-4 h-4 ${TONE_ICON_TEXT[action.tone]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)] truncate">{action.text}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{action.time}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
