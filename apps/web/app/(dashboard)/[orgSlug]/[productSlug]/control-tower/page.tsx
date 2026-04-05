'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Wand2, Shield, GitCompare, Store, Brain, Plug } from 'lucide-react'
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
import { ConnectorsPanel } from '../../../../components/shared/connectors-panel'
import { AISkillsPanel } from '../../../../components/shared/ai-skills-panel'

const toolButtons = [
  { key: 'remix', label: 'AI Remix', icon: Wand2 },
  { key: 'conflict', label: 'Conflicts', icon: Shield },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'drift', label: 'Drift', icon: GitCompare },
  { key: 'marketplace', label: 'Marketplace', icon: Store },
  { key: 'connectors', label: 'Connectors', icon: Plug },
  { key: 'skills', label: 'AI Skills', icon: Brain },
] as const

export default function ControlTowerPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const [openModal, setOpenModal] = useState<string | null>(null)

  const remixRequest: RemixRequest = {
    target: 'component',
    sourceLabel: 'Selected Element',
    sourceProps: { variant: 'primary', size: 'md' },
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex-shrink-0">
        <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mr-2">Tools</span>
        {toolButtons.map((t) => (
          <button
            key={t.key}
            onClick={() => setOpenModal(t.key)}
            className="tool-btn text-[10px] h-[22px] px-2 py-0 gap-1"
          >
            <t.icon size={11} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-12 gap-3 auto-rows-min">
          {/* Health + Stats */}
          <div className="col-span-3">
            <HealthScore />
          </div>
          <div className="col-span-9">
            <QuickStats />
          </div>

          {/* Activity + Graph */}
          <div className="col-span-7">
            <ActivityFeed />
          </div>
          <div className="col-span-5">
            <DependencyGraphMini />
          </div>

          {/* Tasks + Approvals + Insights */}
          <div className="col-span-4">
            <OpenTasks />
          </div>
          <div className="col-span-4">
            <PendingApprovals />
          </div>
          <div className="col-span-4">
            <AiInsights />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AIRemixEngine open={openModal === 'remix'} onClose={() => setOpenModal(null)} request={remixRequest} />
      <GraphConflictResolver productId={productId} open={openModal === 'conflict'} onClose={() => setOpenModal(null)} />
      <BrandComplianceChecker productId={productId} open={openModal === 'compliance'} onClose={() => setOpenModal(null)} />
      <DriftDetector productId={productId} open={openModal === 'drift'} onClose={() => setOpenModal(null)} />
      <TemplateMarketplace open={openModal === 'marketplace'} onClose={() => setOpenModal(null)} />
      <ConnectorsPanel productId={productId} open={openModal === 'connectors'} onClose={() => setOpenModal(null)} />
      <AISkillsPanel productId={productId} open={openModal === 'skills'} onClose={() => setOpenModal(null)} />
    </div>
  )
}
