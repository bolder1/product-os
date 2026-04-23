'use client'

import { motion } from 'framer-motion'
import { AgendaHeader } from './_components/agenda-header'
import { TodaysTasksPanel } from './_components/todays-tasks'
import { ApprovalQueue } from './_components/approval-queue'
import { AIDailyBrief } from './_components/ai-daily-brief'
import { MilestoneTimeline } from './_components/milestone-timeline'
import { ActivityPulse } from './_components/activity-pulse'

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

export default function AgendaPage() {
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-workspace)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={sectionVariants}
        >
          <AgendaHeader />
        </motion.div>

        {/* 3-column grid: Tasks (50%) | Approvals (25%) | AI Brief (25%) */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={sectionVariants}
        >
          {/* Today's Tasks — 2 cols */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm min-h-[320px] flex flex-col">
            <TodaysTasksPanel />
          </div>

          {/* Approval Queue — 1 col */}
          <div className="p-5 rounded-xl border border-[var(--color-warning)]/15 bg-[var(--color-warning)]/[0.03] min-h-[320px] flex flex-col">
            <ApprovalQueue />
          </div>

          {/* AI Daily Brief — 1 col */}
          <div className="p-5 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent)]/[0.03] min-h-[320px] flex flex-col">
            <AIDailyBrief />
          </div>
        </motion.div>

        {/* Milestone Timeline */}
        <motion.div
          className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] mb-6"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={sectionVariants}
        >
          <MilestoneTimeline />
        </motion.div>

        {/* Activity Pulse */}
        <motion.div
          className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.02]"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={sectionVariants}
        >
          <ActivityPulse />
        </motion.div>
      </div>
    </div>
  )
}
