'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

const studioBadgeColors: Record<string, string> = {
  Features: '#8B5CF6',
  Components: '#06B6D4',
  Design: '#3B82F6',
  Pages: '#06B6D4',
  Testing: '#10B981',
  Tasks: '#F59E0B',
  AI: '#8B5CF6',
  Releases: '#F43F5E',
}

const activities = [
  { actor: 'Alice', action: 'created Feature: User Auth', time: '2m ago', studio: 'Features' },
  { actor: 'Bob', action: 'approved Component: Button', time: '8m ago', studio: 'Components' },
  { actor: 'AI', action: 'suggested 3 improvements for Dashboard Page', time: '15m ago', studio: 'AI' },
  { actor: 'Carol', action: 'updated Design Token: primary-blue', time: '22m ago', studio: 'Design' },
  { actor: 'Dave', action: 'completed Task: Setup CI/CD pipeline', time: '35m ago', studio: 'Tasks' },
  { actor: 'Eve', action: 'published Page: Landing Page v2', time: '1h ago', studio: 'Pages' },
  { actor: 'Frank', action: 'added 12 test cases for Auth module', time: '1.5h ago', studio: 'Testing' },
  { actor: 'Alice', action: 'tagged Release: v0.3.0-beta', time: '2h ago', studio: 'Releases' },
  { actor: 'Bob', action: 'linked Feature: Notifications to Page: Settings', time: '3h ago', studio: 'Features' },
  { actor: 'AI', action: 'generated API schema for Payments module', time: '4h ago', studio: 'AI' },
]

function getInitials(name: string) {
  return name.charAt(0).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">
          Activity Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1 max-h-[340px] scrollbar-thin">
        {activities.map((item, i) => {
          const badgeColor = studioBadgeColors[item.studio] || '#64748B'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.35 }}
              className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
                style={{ backgroundColor: getAvatarColor(item.actor) + '30', color: getAvatarColor(item.actor) }}
              >
                {getInitials(item.actor)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F1F5F9] leading-snug">
                  <span className="font-medium">{item.actor}</span>{' '}
                  <span className="text-[#94A3B8]">{item.action}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#64748B]">{item.time}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: badgeColor + '15',
                      color: badgeColor,
                    }}
                  >
                    {item.studio}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
