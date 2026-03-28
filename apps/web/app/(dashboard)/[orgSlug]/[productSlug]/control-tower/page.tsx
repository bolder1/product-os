'use client'

import { motion } from 'framer-motion'
import { Radar } from 'lucide-react'
import { HealthScore } from './_components/health-score'
import { QuickStats } from './_components/quick-stats'
import { ActivityFeed } from './_components/activity-feed'
import { DependencyGraphMini } from './_components/dependency-graph-mini'
import { OpenTasks } from './_components/open-tasks'
import { PendingApprovals } from './_components/pending-approvals'
import { AiInsights } from './_components/ai-insights'

export default function ControlTowerPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
          <Radar className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F1F5F9]">Control Tower</h1>
          <p className="text-xs text-[#64748B]">Real-time product health and activity overview</p>
        </div>
      </motion.div>

      {/* Top Row: Health Score (large) + Quick Stats (3 small) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <HealthScore />
        </div>
        <div className="col-span-8">
          <QuickStats />
        </div>
      </div>

      {/* Middle Row: Activity Feed (~60%) + Dependency Graph (~40%) */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <ActivityFeed />
        </div>
        <div className="col-span-5">
          <DependencyGraphMini />
        </div>
      </div>

      {/* Bottom Row: Open Tasks + Pending Approvals + AI Insights */}
      <div className="grid grid-cols-3 gap-4">
        <OpenTasks />
        <PendingApprovals />
        <AiInsights />
      </div>
    </div>
  )
}
