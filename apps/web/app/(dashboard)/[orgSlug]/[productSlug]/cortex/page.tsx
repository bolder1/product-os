'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Sparkles, Bot, Zap, CheckCircle2, XCircle,
  Clock, Loader2, ChevronRight, Play, TrendingUp, Activity,
  AlertCircle, ListTodo, Wand2, Target, Pause,
} from 'lucide-react'
import { useProduct } from '../layout'
import {
  useComputerModeStore,
  type ComputerMode as CMMode,
  type ActionEntry,
  type ActionStatus,
  type ActionKind,
} from '../../../../lib/computer-mode-store'
import { useAISkillsStore, type AISkill } from '../../../../lib/ai-skills-store'

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------

const MODE_CONFIG: Record<CMMode, { label: string; description: string; icon: typeof Bot; color: string; glow: string }> = {
  suggest: {
    label: 'Suggest',
    description: 'Cortex surfaces recommendations. You choose what to apply.',
    icon: Sparkles,
    color: '#6398ff',
    glow: 'rgba(99,152,255,0.25)',
  },
  assist: {
    label: 'Assist',
    description: 'Cortex drafts changes. Each mutation asks for your confirmation.',
    icon: Bot,
    color: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
  },
  auto: {
    label: 'Autopilot',
    description: 'Cortex executes within policy bounds. Full action log preserved.',
    icon: Zap,
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.3)',
  },
}

const STATUS_META: Record<ActionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  color: '#F59E0B', icon: <Clock size={11} /> },
  running:  { label: 'Running',  color: '#6398ff', icon: <Loader2 size={11} className="animate-spin" /> },
  done:     { label: 'Done',     color: '#10B981', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejected', color: '#64748B', icon: <XCircle size={11} /> },
  failed:   { label: 'Failed',   color: '#EF4444', icon: <AlertCircle size={11} /> },
}

const KIND_META: Record<ActionKind, { label: string; color: string }> = {
  suggest:     { label: 'Suggest',     color: '#6398ff' },
  scaffold:    { label: 'Scaffold',    color: '#10B981' },
  analyze:     { label: 'Analyze',     color: '#8B5CF6' },
  create_task: { label: 'Create task', color: '#EC4899' },
  update_node: { label: 'Update node', color: '#F59E0B' },
  run_plan:    { label: 'Run plan',    color: '#EF4444' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function StatCard({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: typeof Bot; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider">{label}</span>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-semibold text-[#F1F5F9] leading-none">{value}</p>
      {sub && <p className="text-[10px] text-[#64748B] mt-1.5">{sub}</p>}
    </div>
  )
}

function ModeSwitcher() {
  const mode = useComputerModeStore((s) => s.mode)
  const setMode = useComputerModeStore((s) => s.setMode)
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      {(Object.keys(MODE_CONFIG) as CMMode[]).map((m) => {
        const cfg = MODE_CONFIG[m]
        const Icon = cfg.icon
        const active = m === mode
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              color: active ? cfg.color : '#94A3B8',
              background: active ? `${cfg.color}14` : 'transparent',
              boxShadow: active ? `0 0 0 1px ${cfg.color}40 inset, 0 0 12px ${cfg.glow}` : 'none',
            }}
          >
            <Icon size={11} />
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

function PendingActionRow({ action }: { action: ActionEntry }) {
  const confirmAction = useComputerModeStore((s) => s.confirmAction)
  const rejectAction = useComputerModeStore((s) => s.rejectAction)
  const kind = KIND_META[action.kind]
  return (
    <div className="rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/[0.04] p-3 flex items-start gap-3">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${kind.color}18` }}
      >
        <Clock size={13} style={{ color: kind.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide"
            style={{ color: kind.color, background: `${kind.color}12` }}>
            {kind.label}
          </span>
          {action.studio && (
            <span className="text-[10px] text-[#64748B]">in {action.studio}</span>
          )}
        </div>
        <p className="text-xs text-[#F1F5F9] font-medium truncate">{action.label}</p>
        {action.detail && (
          <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-2">{action.detail}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => rejectAction(action.id)}
          className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9] transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => confirmAction(action.id)}
          className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-white bg-[#10B981] hover:bg-[#0EA371] transition-colors flex items-center gap-1"
        >
          <CheckCircle2 size={11} />
          Approve
        </button>
      </div>
    </div>
  )
}

function ActionLogRow({ action }: { action: ActionEntry }) {
  const status = STATUS_META[action.status]
  const kind = KIND_META[action.kind]
  return (
    <div className="group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${kind.color}14` }}
      >
        <span style={{ color: kind.color }}>{status.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide"
            style={{ color: kind.color, background: `${kind.color}12` }}>
            {kind.label}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide"
            style={{ color: status.color, background: `${status.color}12` }}
          >
            {status.label}
          </span>
          {action.studio && (
            <span className="text-[10px] text-[#64748B]">· {action.studio}</span>
          )}
          <span className="text-[10px] text-[#64748B] ml-auto">{timeAgo(action.timestamp)}</span>
        </div>
        <p className="text-xs text-[#F1F5F9] truncate">{action.label}</p>
        {action.detail && (
          <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-2">{action.detail}</p>
        )}
      </div>
    </div>
  )
}

function ActivePlanPanel() {
  const activePlan = useComputerModeStore((s) => s.activePlan)
  const advancePlan = useComputerModeStore((s) => s.advancePlan)
  const abortPlan = useComputerModeStore((s) => s.abortPlan)
  if (!activePlan) return null
  const running = activePlan.status === 'running' || activePlan.status === 'planning'
  return (
    <div className="rounded-xl border border-[#6398ff]/25 bg-[#6398ff]/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#6398ff]/15 flex items-center justify-center">
          <Target size={13} className="text-[#6398ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Active plan</p>
          <p className="text-sm font-semibold text-[#F1F5F9] truncate">{activePlan.goal}</p>
        </div>
        {running && (
          <button
            onClick={() => abortPlan(activePlan.id)}
            className="h-7 px-2 rounded-md text-[10px] text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9] flex items-center gap-1"
          >
            <Pause size={11} />
            Abort
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {activePlan.steps.map((step) => {
          const dotColor =
            step.status === 'done' ? '#10B981' :
            step.status === 'running' ? '#6398ff' :
            step.status === 'skipped' ? '#64748B' : '#475569'
          return (
            <div key={step.order} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: dotColor }}
              />
              <span
                className={step.status === 'done' ? 'text-[#64748B] line-through' : 'text-[#F1F5F9]'}
              >
                {step.label}
              </span>
              {step.status === 'running' && (
                <Loader2 size={11} className="text-[#6398ff] animate-spin ml-auto" />
              )}
            </div>
          )
        })}
      </div>
      {running && (
        <button
          onClick={() => advancePlan(activePlan.id)}
          className="mt-3 w-full h-8 rounded-lg bg-[#6398ff] text-white text-[11px] font-semibold hover:bg-[#4f7ad9] transition-colors flex items-center justify-center gap-1.5"
        >
          <Play size={11} />
          Advance step
        </button>
      )}
    </div>
  )
}

function SkillLauncher({ productId }: { productId: string }) {
  const skills = useAISkillsStore((s) => s.skills)
  const featured = useMemo<AISkill[]>(() => skills.filter((s) => s.enabled).slice(0, 6), [skills])
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wand2 size={13} className="text-[#8B5CF6]" />
          <p className="text-xs font-semibold text-[#F1F5F9]">Quick skills</p>
        </div>
        <button
          onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/ai-skills`)}
          className="text-[10px] text-[#94A3B8] hover:text-[#F1F5F9] flex items-center gap-0.5"
        >
          Browse all
          <ChevronRight size={10} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {featured.map((sk) => (
          <button
            key={sk.id}
            onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/ai-skills`)}
            className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all text-left"
          >
            <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/12 flex items-center justify-center shrink-0">
              <Sparkles size={11} className="text-[#8B5CF6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#F1F5F9] truncate">{sk.name}</p>
              <p className="text-[10px] text-[#64748B] truncate">{sk.description}</p>
            </div>
            <ChevronRight
              size={11}
              className="text-[#475569] group-hover:text-[#94A3B8] group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo seed — helps first-run feel alive when no real actions have run yet
// ---------------------------------------------------------------------------

function useSeedDemoActions(productId: string) {
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const { actionLog, addAction } = useComputerModeStore.getState()
    if (actionLog.length > 0) return
    const demos: Array<Omit<ActionEntry, 'id' | 'timestamp'>> = [
      {
        kind: 'scaffold', status: 'pending', studio: 'planner', productId,
        label: 'Scaffold "Onboarding revamp" module',
        detail: 'Cortex suggests 4 features, 3 workflows, and 6 pages based on your PRD.',
        confirmRequired: true,
      },
      {
        kind: 'suggest', status: 'done', studio: 'brand', productId,
        label: 'Tighten button radius for better brand alignment',
        detail: 'Primary buttons use 10px radius; brand spec says 8px.',
        confirmRequired: false,
      },
      {
        kind: 'analyze', status: 'done', studio: 'analytics', productId,
        label: 'Detected drop-off at Step 3 of onboarding',
        detail: '42% of users exit before completing workspace creation.',
        confirmRequired: false,
      },
      {
        kind: 'create_task', status: 'done', studio: 'tasks', productId,
        label: 'Create "Fix empty-state copy on /pages"',
        detail: 'Auto-created from Control Tower blocker scan.',
        confirmRequired: false,
      },
    ]
    demos.forEach((d) => addAction(d))
  }, [productId])
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CortexPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  useSeedDemoActions(productId)

  const mode = useComputerModeStore((s) => s.mode)
  const actionLog = useComputerModeStore((s) => s.actionLog)
  const clearLog = useComputerModeStore((s) => s.clearLog)
  // Derive pending from actionLog — pendingActions isn't persisted, so we
  // rebuild the queue from entries that still require confirmation.
  const pendingActions = useMemo(
    () => actionLog.filter((a) => a.status === 'pending' && a.confirmRequired),
    [actionLog],
  )

  const modeCfg = MODE_CONFIG[mode]
  const ModeIcon = modeCfg.icon

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayActions = actionLog.filter((a) => new Date(a.timestamp) >= today)
    const done = actionLog.filter((a) => a.status === 'done').length
    const failed = actionLog.filter((a) => a.status === 'failed').length
    const totalTerminal = done + failed
    const successRate = totalTerminal === 0 ? 100 : Math.round((done / totalTerminal) * 100)
    return {
      today: todayActions.length,
      pending: pendingActions.length,
      success: successRate,
      total: actionLog.length,
    }
  }, [actionLog, pendingActions])

  const [filter, setFilter] = useState<'all' | ActionKind>('all')
  const filteredLog = useMemo(
    () => (filter === 'all' ? actionLog : actionLog.filter((a) => a.kind === filter)),
    [actionLog, filter],
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg-workspace)] text-[#F1F5F9]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
            boxShadow: '0 0 24px rgba(124,58,237,0.35)',
          }}
        >
          <BrainCircuit size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[#F1F5F9] leading-none">Cortex</h1>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            The AI brain of your Product OS — acts across every studio.
          </p>
        </div>
        <ModeSwitcher />
      </div>

      {/* ── Mode banner ── */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06]"
        style={{ background: `${modeCfg.color}08` }}
      >
        <ModeIcon size={14} style={{ color: modeCfg.color }} />
        <p className="text-[11px]" style={{ color: modeCfg.color }}>
          <span className="font-semibold">{modeCfg.label} mode:</span>{' '}
          <span className="text-[#94A3B8]">{modeCfg.description}</span>
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-5 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Actions today" value={stats.today} icon={Activity} color="#6398ff" />
            <StatCard label="Pending" value={stats.pending} sub={stats.pending > 0 ? 'Needs approval' : 'All clear'} icon={Clock} color="#F59E0B" />
            <StatCard label="Success rate" value={`${stats.success}%`} icon={TrendingUp} color="#10B981" />
            <StatCard label="Total logged" value={stats.total} sub="Last 200 actions" icon={ListTodo} color="#8B5CF6" />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-12 gap-5">

            {/* Left column — action log */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
              {/* Pending queue */}
              <AnimatePresence>
                {pendingActions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={13} className="text-[#F59E0B]" />
                      <p className="text-xs font-semibold text-[#F1F5F9]">Awaiting your approval</p>
                      <span className="ml-auto text-[10px] text-[#94A3B8]">
                        {pendingActions.length} action{pendingActions.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {pendingActions.map((a) => (
                        <PendingActionRow key={a.id} action={a} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action log */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <Activity size={13} className="text-[#6398ff]" />
                  <p className="text-xs font-semibold text-[#F1F5F9]">Action log</p>
                  <div className="ml-auto flex items-center gap-1">
                    {(['all', 'suggest', 'scaffold', 'analyze', 'create_task'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f as typeof filter)}
                        className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                        style={{
                          color: filter === f ? '#F1F5F9' : '#94A3B8',
                          background: filter === f ? 'rgba(99,152,255,0.14)' : 'transparent',
                        }}
                      >
                        {f === 'all' ? 'All' : KIND_META[f as ActionKind].label}
                      </button>
                    ))}
                    {actionLog.length > 0 && (
                      <button
                        onClick={clearLog}
                        className="ml-2 px-2 py-1 rounded text-[10px] text-[#64748B] hover:bg-white/[0.04] hover:text-[#94A3B8] transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2 max-h-[520px] overflow-auto">
                  {filteredLog.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                        <BrainCircuit size={18} className="text-[#64748B]" />
                      </div>
                      <p className="text-sm font-medium text-[#F1F5F9]">No actions yet</p>
                      <p className="text-[11px] text-[#64748B] mt-1 max-w-[320px]">
                        Cortex will log every suggestion, scaffold, and decision it makes across your studios.
                      </p>
                    </div>
                  ) : (
                    filteredLog.map((a) => <ActionLogRow key={a.id} action={a} />)
                  )}
                </div>
              </div>
            </div>

            {/* Right column — plan + skills */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
              <ActivePlanPanel />
              <SkillLauncher productId={productId} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
