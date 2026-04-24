'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import {
  Palette, Layers, FileCode2, Bug, BarChart3,
  Paintbrush, GitBranch, CheckSquare, Workflow,
  TestTube2, Package, Loader2,
} from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'
import type { OrgRole } from '../../../../../lib/role-config'

interface Props {
  role: OrgRole
  productId: string
}

// R20.6 — score-threshold → semantic tokens. Single helper to keep all four
// focus panels consistent.
function scoreToken(score: number): string {
  if (score >= 70) return 'var(--color-success)'
  if (score >= 35) return 'var(--color-warning)'
  return 'var(--color-error)'
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
    { label: 'Brand / Tokens', score: brandScore,  icon: Paintbrush, route: 'brand' },
    { label: 'Design System',  score: designScore, icon: Palette,    route: 'design' },
    { label: 'Components',     score: compScore,   icon: Layers,     route: 'components' },
  ]

  return (
    <FocusPanelShell title="Studio Readiness" icon={Palette}>
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            const barColor = scoreToken(item.score)
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} className="text-[var(--accent)]" />
                    <span className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
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
        { label: 'Components', score: compScore,  icon: Layers,    route: 'components' },
        { label: 'Code',       score: codeScore,  icon: FileCode2, route: 'code' },
      ]
    : [
        { label: 'Workflows', score: workflowScore, icon: Workflow,  route: 'workflows' },
        { label: 'Code',      score: codeScore,     icon: FileCode2, route: 'code' },
      ]

  return (
    <FocusPanelShell
      title={isFE ? 'Frontend Health' : 'Backend Health'}
      icon={isFE ? FileCode2 : GitBranch}
    >
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            const barColor = scoreToken(item.score)
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} className="text-[var(--accent)]" />
                    <span className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
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
    <FocusPanelShell title="QA Snapshot" icon={Bug}>
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {/* Test coverage bar */}
          {[
            { label: 'Testing Coverage', score: testingScore, icon: TestTube2, route: 'testing' },
            { label: 'Release Readiness', score: releaseScore, icon: Package,   route: 'releases' },
          ].map((item) => {
            const Icon = item.icon
            const barColor = scoreToken(item.score)
            return (
              <button
                key={item.label}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${item.route}`)}
                className="w-full group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon size={11} className="text-[var(--accent)]" />
                    <span className="text-[11px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: barColor }}>{item.score}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
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
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <CheckSquare size={11} className="text-[var(--color-error)]" />
              <span className="text-[11px] text-[var(--text-secondary)]">Critical blockers</span>
            </div>
            <span className={`text-[12px] font-bold ${blockers > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}`}>
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
    <FocusPanelShell title="Coverage Overview" icon={BarChart3}>
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {/* Overall */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]/20">
            <div className="text-center">
              <p className="text-[22px] font-bold text-[var(--text-primary)]">{overall}</p>
              <p className="text-[9px] text-[var(--text-tertiary)]">overall</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-[var(--bg-inset)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: scoreToken(overall) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${overall}%` }}
                  transition={{ duration: 0.9 }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{modules.length} module{modules.length !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>

          {/* Top studio scores */}
          {studioScores.slice(0, 3).map((s) => {
            const barColor = scoreToken(s.score)
            return (
              <button
                key={s.studio}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${s.route}`)}
                className="w-full flex items-center gap-3 group"
              >
                <span className="text-[10px] text-[var(--text-tertiary)] w-[72px] text-left capitalize group-hover:text-[var(--text-secondary)] transition-colors truncate">{s.label}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
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
    <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-tertiary)]">
      <Loader2 size={14} className="animate-spin" />
      <span className="text-[11px]">Loading…</span>
    </div>
  )
}

function FocusPanelShell({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-[var(--accent)]" />
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{title}</span>
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
