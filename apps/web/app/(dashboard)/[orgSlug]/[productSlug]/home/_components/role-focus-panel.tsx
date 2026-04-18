'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import {
  Palette, Layers, FileCode2, Bug, BarChart3, ArrowRight,
  Paintbrush, GitBranch, CheckSquare, Boxes, Workflow,
  TestTube2, Package, Loader2,
} from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'
import type { OrgRole } from '../../../../../lib/role-config'

interface Props {
  role: OrgRole
  productId: string
}

// ---------------------------------------------------------------------------
// Designer Focus — token coverage + component count
// ---------------------------------------------------------------------------

function DesignerFocus({ productId }: { productId: string }) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const { data, isLoading } = trpc.controlTower.getHealthSummary.useQuery(
    { productId }, { staleTime: 30_000, enabled: !!productId },
  )

  const studioScores = data?.studioScores ?? []
  const brandScore  = studioScores.find((s) => s.studio === 'brand')?.score   ?? 0
  const designScore = studioScores.find((s) => s.studio === 'design')?.score  ?? 0
  const compScore   = studioScores.find((s) => s.studio === 'components')?.score ?? 0

  const items = [
    { label: 'Brand / Tokens', score: brandScore,  color: '#EC4899', icon: Paintbrush, route: 'brand' },
    { label: 'Design System',  score: designScore, color: '#3B82F6', icon: Palette,    route: 'design' },
    { label: 'Components',     score: compScore,   color: '#06B6D4', icon: Layers,     route: 'components' },
  ]

  return (
    <FocusPanelShell title="Studio Readiness" icon={Palette} color="#EC4899">
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            const barColor = item.score >= 70 ? '#10B981' : item.score >= 35 ? '#F59E0B' : '#F43F5E'
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} style={{ color: item.color }} />
                    <span className="text-[11px] text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </FocusPanelShell>
  )
}

// ---------------------------------------------------------------------------
// Dev Focus — code + handoff health
// ---------------------------------------------------------------------------

function DevFocus({ productId, subRole }: { productId: string; subRole: 'frontend_dev' | 'backend_dev' }) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const { data, isLoading } = trpc.controlTower.getHealthSummary.useQuery(
    { productId }, { staleTime: 30_000, enabled: !!productId },
  )

  const studioScores = data?.studioScores ?? []
  const codeScore     = studioScores.find((s) => s.studio === 'code')?.score      ?? 0
  const workflowScore = studioScores.find((s) => s.studio === 'workflows')?.score ?? 0
  const compScore     = studioScores.find((s) => s.studio === 'components')?.score ?? 0

  const isFE = subRole === 'frontend_dev'
  const items = isFE
    ? [
        { label: 'Components', score: compScore,  color: '#06B6D4', icon: Layers,    route: 'components' },
        { label: 'Code',       score: codeScore,  color: '#10B981', icon: FileCode2, route: 'code' },
      ]
    : [
        { label: 'Workflows', score: workflowScore, color: '#10B981', icon: Workflow, route: 'workflows' },
        { label: 'Code',      score: codeScore,     color: '#06B6D4', icon: FileCode2, route: 'code' },
      ]

  return (
    <FocusPanelShell
      title={isFE ? 'Frontend Health' : 'Backend Health'}
      icon={isFE ? FileCode2 : GitBranch}
      color={isFE ? '#06B6D4' : '#10B981'}
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            const barColor = item.score >= 70 ? '#10B981' : item.score >= 35 ? '#F59E0B' : '#F43F5E'
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} style={{ color: item.color }} />
                    <span className="text-[11px] text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </FocusPanelShell>
  )
}

// ---------------------------------------------------------------------------
// QA Focus — test coverage + release readiness
// ---------------------------------------------------------------------------

function QAFocus({ productId }: { productId: string }) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const { data, isLoading } = trpc.controlTower.getHealthSummary.useQuery(
    { productId }, { staleTime: 30_000, enabled: !!productId },
  )

  const studioScores = data?.studioScores ?? []
  const testingScore  = studioScores.find((s) => s.studio === 'testing')?.score  ?? 0
  const releaseScore  = studioScores.find((s) => s.studio === 'analytics')?.score ?? 0
  const blockers      = (data?.blockers ?? []).filter((b) => b.severity === 'error').length

  return (
    <FocusPanelShell title="QA Snapshot" icon={Bug} color="#F59E0B">
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {/* Test coverage bar */}
          {[
            { label: 'Testing Coverage', score: testingScore, color: '#F59E0B', icon: TestTube2, route: 'testing' },
            { label: 'Release Readiness', score: releaseScore, color: '#10B981', icon: Package,   route: 'releases' },
          ].map((item) => {
            const Icon = item.icon
            const barColor = item.score >= 70 ? '#10B981' : item.score >= 35 ? '#F59E0B' : '#F43F5E'
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} style={{ color: item.color }} />
                    <span className="text-[11px] text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </button>
            )
          })}

          {/* Blockers count */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2">
              <CheckSquare size={11} className="text-[#F43F5E]" />
              <span className="text-[11px] text-[#94A3B8]">Critical blockers</span>
            </div>
            <span className={`text-[12px] font-bold ${blockers > 0 ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
              {blockers === 0 ? 'None ✓' : blockers}
            </span>
          </div>
        </div>
      )}
    </FocusPanelShell>
  )
}

// ---------------------------------------------------------------------------
// BA Focus — graph coverage
// ---------------------------------------------------------------------------

function BAFocus({ productId }: { productId: string }) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const { data, isLoading } = trpc.controlTower.getHealthSummary.useQuery(
    { productId }, { staleTime: 30_000, enabled: !!productId },
  )

  const studioScores = data?.studioScores ?? []
  const modules      = data?.modules ?? []
  const overall      = data?.overall ?? 0

  return (
    <FocusPanelShell title="Coverage Overview" icon={BarChart3} color="#8B5CF6">
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {/* Overall */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#8B5CF6]/08 border border-[#8B5CF6]/15">
            <div className="text-center">
              <p className="text-[22px] font-bold text-[#F1F5F9]">{overall}</p>
              <p className="text-[9px] text-[#64748B]">overall</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: overall >= 70 ? '#10B981' : overall >= 35 ? '#F59E0B' : '#F43F5E' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${overall}%` }}
                  transition={{ duration: 0.9 }}
                />
              </div>
              <p className="text-[10px] text-[#475569] mt-1">{modules.length} module{modules.length !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>

          {/* Top studio scores */}
          {studioScores.slice(0, 3).map((s) => {
            const barColor = s.score >= 70 ? '#10B981' : s.score >= 35 ? '#F59E0B' : '#F43F5E'
            return (
              <button
                key={s.studio}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${s.route}`)}
                className="w-full flex items-center gap-3 group"
              >
                <span className="text-[10px] text-[#64748B] w-[72px] text-left capitalize group-hover:text-[#94A3B8] transition-colors truncate">{s.label}</span>
                <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
                <span className="text-[10px] font-semibold w-[28px] text-right shrink-0" style={{ color: barColor }}>{s.score}%</span>
              </button>
            )
          })}
        </div>
      )}
    </FocusPanelShell>
  )
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-[#475569]">
      <Loader2 size={14} className="animate-spin" />
      <span className="text-[11px]">Loading…</span>
    </div>
  )
}

function FocusPanelShell({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string
  icon: React.ElementType
  color: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color }} />
        <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Public export — picks the right panel by role
// ---------------------------------------------------------------------------

export function RoleFocusPanel({ role, productId }: Props) {
  if (role === 'product_designer')
    return <DesignerFocus productId={productId} />
  if (role === 'frontend_dev')
    return <DevFocus productId={productId} subRole="frontend_dev" />
  if (role === 'backend_dev')
    return <DevFocus productId={productId} subRole="backend_dev" />
  if (role === 'qa')
    return <QAFocus productId={productId} />
  if (role === 'business_analyst')
    return <BAFocus productId={productId} />
  // admin / manager / viewer — use HealthScore already in their grid
  return <BAFocus productId={productId} />
}
