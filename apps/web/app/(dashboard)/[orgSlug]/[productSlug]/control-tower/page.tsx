'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Radar, Wand2, Shield, GitCompare, Store } from 'lucide-react'
import { HealthScore } from './_components/health-score'
import { QuickStats } from './_components/quick-stats'
import { ActivityFeed } from './_components/activity-feed'
import { DependencyGraphMini } from './_components/dependency-graph-mini'
import { OpenTasks } from './_components/open-tasks'
import { PendingApprovals } from './_components/pending-approvals'
import { AiInsights } from './_components/ai-insights'
import { AIRemixEngine, type RemixRequest } from '../../../../components/shared/ai-remix-engine'
import { GraphConflictResolver } from '../../../../components/shared/graph-conflict-resolver'
import { BrandComplianceChecker } from '../../../../components/shared/brand-compliance-checker'
import { DriftDetector } from '../../../../components/shared/drift-detector'
import { TemplateMarketplace } from '../../../../components/shared/template-marketplace'

export default function ControlTowerPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

  const [remixOpen, setRemixOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [complianceOpen, setComplianceOpen] = useState(false)
  const [driftOpen, setDriftOpen] = useState(false)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)

  const remixRequest: RemixRequest = {
    target: 'component',
    sourceLabel: 'Selected Element',
    sourceProps: { variant: 'primary', size: 'md' },
  }

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

      {/* Phase 5 Intelligence Tools */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-3">
          Intelligence Tools
        </p>
        <div className="grid grid-cols-5 gap-3">
          <button
            onClick={() => setRemixOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-[#EC4899]/10 flex items-center justify-center group-hover:from-[#6366F1]/20 group-hover:to-[#EC4899]/20 transition-colors">
              <Wand2 className="w-4 h-4 text-[#818CF8]" />
            </div>
            <span className="text-[0.6875rem] text-[#94A3B8] font-medium">AI Remix</span>
          </button>

          <button
            onClick={() => setConflictOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[0.6875rem] text-[#94A3B8] font-medium">Conflicts</span>
          </button>

          <button
            onClick={() => setComplianceOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center group-hover:bg-[#6366F1]/20 transition-colors">
              <Shield className="w-4 h-4 text-[#6366F1]" />
            </div>
            <span className="text-[0.6875rem] text-[#94A3B8] font-medium">Compliance</span>
          </button>

          <button
            onClick={() => setDriftOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <GitCompare className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-[0.6875rem] text-[#94A3B8] font-medium">Drift</span>
          </button>

          <button
            onClick={() => setMarketplaceOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-[#10B981]/10 flex items-center justify-center group-hover:from-[#6366F1]/20 group-hover:to-[#10B981]/20 transition-colors">
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[0.6875rem] text-[#94A3B8] font-medium">Marketplace</span>
          </button>
        </div>
      </motion.div>

      {/* Modals */}
      <AIRemixEngine open={remixOpen} onClose={() => setRemixOpen(false)} request={remixRequest} />
      <GraphConflictResolver productId={productId} open={conflictOpen} onClose={() => setConflictOpen(false)} />
      <BrandComplianceChecker productId={productId} open={complianceOpen} onClose={() => setComplianceOpen(false)} />
      <DriftDetector productId={productId} open={driftOpen} onClose={() => setDriftOpen(false)} />
      <TemplateMarketplace open={marketplaceOpen} onClose={() => setMarketplaceOpen(false)} />
    </div>
  )
}
