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

const stats = [
  { label: 'Total Members', value: '24', icon: Users, color: '#3B82F6', change: '+3 this month' },
  { label: 'Active Products', value: '7', icon: Package, color: '#10B981', change: '+1 this week' },
  { label: 'Pending Requests', value: '4', icon: Clock, color: '#F59E0B', change: '2 urgent' },
  { label: 'Storage Used', value: '18.4 GB', icon: HardDrive, color: '#8B5CF6', change: 'of 50 GB' },
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

const recentActions = [
  { id: '1', text: 'Invited alex.chen@company.com as Frontend Dev', icon: UserPlus, color: '#3B82F6', time: '2 hours ago' },
  { id: '2', text: 'Changed role of Sarah Kim to Manager', icon: Shield, color: '#F59E0B', time: '5 hours ago' },
  { id: '3', text: 'Approved access request for Design Studio', icon: UserCheck, color: '#10B981', time: '1 day ago' },
  { id: '4', text: 'Updated permissions for QA Engineer role', icon: Settings, color: '#8B5CF6', time: '2 days ago' },
  { id: '5', text: 'Removed inactive member john.doe@company.com', icon: Trash2, color: '#F43F5E', time: '3 days ago' },
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
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-[#F1F5F9]">{stat.value}</div>
              <div className="text-xs text-[#64748B] mt-1">{stat.label}</div>
              <div className="text-[10px] mt-2 px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94A3B8] inline-block">
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
              <h3 className="text-sm font-medium text-[#F1F5F9]">Activity</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                Logins
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]/30" />
                Actions
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {activityBars.map((bar, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-[#3B82F6]/60 to-[#3B82F6]/20"
                initial={{ height: 0 }}
                animate={{ height: `${bar.height}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {activityBars.map((bar, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-[#4A5568]">
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
          <h3 className="text-sm font-medium text-[#F1F5F9] mb-4">Recent Admin Actions</h3>
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
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${action.color}12` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#94A3B8] truncate">{action.text}</p>
                    <p className="text-xs text-[#4A5568] mt-0.5">{action.time}</p>
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
