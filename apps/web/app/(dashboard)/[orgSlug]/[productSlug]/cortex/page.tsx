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
import { useBudgetStore } from '../../../../lib/budget-store'
import { submitPromptThroughGate } from '../../../../lib/prompt-gate-store'
import { estimate, getPricing, type ExecutionPlan } from '@product-os/ai'
import { TokenEstimate } from '@product-os/ui'

// ---------------------------------------------------------------------------
// Mode config
// ---------------------------------------------------------------------------

// R20.6 — Mode/status/kind distinction via label + icon. Color reserved for
// true semantics: accent = neutral/active, success/warning/error = state truth.
const MODE_CONFIG: Record<CMMode, { label: string; description: string; icon: typeof Bot; color: string }> = {
  suggest: {
    label: 'Suggest',
    description: 'Cortex surfaces recommendations. You choose what to apply.',
    icon: Sparkles,
    color: 'var(--accent)',
  },
  assist: {
    label: 'Assist',
    description: 'Cortex drafts changes. Each mutation asks for your confirmation.',
    icon: Bot,
    color: 'var(--color-success)',
  },
  auto: {
    label: 'Autopilot',
    description: 'Cortex executes within policy bounds. Full action log preserved.',
    icon: Zap,
    color: 'var(--color-warning)',
  },
}

const STATUS_META: Record<ActionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  color: 'var(--color-warning)',  icon: <Clock size={11} /> },
  running:  { label: 'Running',  color: 'var(--accent)',         icon: <Loader2 size={11} className="animate-spin" /> },
  done:     { label: 'Done',     color: 'var(--color-success)',  icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejected', color: 'var(--text-tertiary)',  icon: <XCircle size={11} /> },
  failed:   { label: 'Failed',   color: 'var(--color-error)',    icon: <AlertCircle size={11} /> },
}

const KIND_META: Record<ActionKind, { label: string; color: string }> = {
  suggest:     { label: 'Suggest',     color: 'var(--accent)' },
  scaffold:    { label: 'Scaffold',    color: 'var(--accent)' },
  analyze:     { label: 'Analyze',     color: 'var(--accent)' },
  create_task: { label: 'Create task', color: 'var(--accent)' },
  update_node: { label: 'Update node', color: 'var(--accent)' },
  run_plan:    { label: 'Run plan',    color: 'var(--accent)' },
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

type StatTone = 'accent' | 'success' | 'warning' | 'info'
const STAT_TONE: Record<StatTone, { bg: string; fg: string }> = {
  accent:  { bg: 'bg-[var(--accent-subtle)]',        fg: 'text-[var(--accent)]' },
  success: { bg: 'bg-[var(--color-success-muted)]',  fg: 'text-[var(--color-success)]' },
  warning: { bg: 'bg-[var(--color-warning-muted)]',  fg: 'text-[var(--color-warning)]' },
  info:    { bg: 'bg-[var(--accent-subtle)]',        fg: 'text-[var(--accent)]' },
}

function StatCard({
  label, value, sub, icon: Icon, tone = 'accent',
}: { label: string; value: string | number; sub?: string; icon: typeof Bot; tone?: StatTone }) {
  const t = STAT_TONE[tone]
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${t.bg}`}>
          <Icon size={12} className={t.fg} />
        </div>
      </div>
      <p className="text-xl font-semibold text-[var(--text-primary)] leading-none">{value}</p>
      {sub && <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">{sub}</p>}
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
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              active
                ? 'bg-white/[0.04] ring-1 ring-inset ring-white/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={active ? { color: cfg.color } : undefined}
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
    <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/[0.04] p-3 flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--accent-subtle)]">
        <Clock size={13} className="text-[var(--accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide bg-[var(--accent-subtle)] text-[var(--accent-text)]">
            {kind.label}
          </span>
          {action.studio && (
            <span className="text-[10px] text-[var(--text-tertiary)]">in {action.studio}</span>
          )}
        </div>
        <p className="text-xs text-[var(--text-primary)] font-medium truncate">{action.label}</p>
        {action.detail && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{action.detail}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => rejectAction(action.id)}
          className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => confirmAction(action.id)}
          className="h-7 px-2.5 rounded-md text-[10px] font-semibold text-[var(--text-inverse)] bg-[var(--color-success)] hover:bg-[var(--color-success)]/85 transition-colors flex items-center gap-1"
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
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[var(--accent-subtle)]">
        <span style={{ color: status.color }}>{status.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide bg-[var(--accent-subtle)] text-[var(--accent-text)]">
            {kind.label}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-px rounded uppercase tracking-wide bg-white/[0.05]"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
          {action.studio && (
            <span className="text-[10px] text-[var(--text-tertiary)]">· {action.studio}</span>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">{timeAgo(action.timestamp)}</span>
        </div>
        <p className="text-xs text-[var(--text-primary)] truncate">{action.label}</p>
        {action.detail && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{action.detail}</p>
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
    <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
          <Target size={13} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Active plan</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{activePlan.goal}</p>
        </div>
        {running && (
          <button
            onClick={() => abortPlan(activePlan.id)}
            className="h-7 px-2 rounded-md text-[10px] text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] flex items-center gap-1"
          >
            <Pause size={11} />
            Abort
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {activePlan.steps.map((step) => {
          const dotClass =
            step.status === 'done' ? 'bg-[var(--color-success)]' :
            step.status === 'running' ? 'bg-[var(--accent)]' :
            step.status === 'skipped' ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--border-default)]'
          return (
            <div key={step.order} className="flex items-center gap-2 text-[11px]">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
              <span
                className={step.status === 'done' ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}
              >
                {step.label}
              </span>
              {step.status === 'running' && (
                <Loader2 size={11} className="text-[var(--accent)] animate-spin ml-auto" />
              )}
            </div>
          )
        })}
      </div>
      {running && (
        <button
          onClick={() => advancePlan(activePlan.id)}
          className="mt-3 w-full h-8 rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] text-[11px] font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-1.5"
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
          <Wand2 size={13} className="text-[var(--accent)]" />
          <p className="text-xs font-semibold text-[var(--text-primary)]">Quick skills</p>
        </div>
        <button
          onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/ai-skills`)}
          className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-0.5"
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
            <div className="w-6 h-6 rounded-md bg-[var(--accent)]/12 flex items-center justify-center shrink-0">
              <Sparkles size={11} className="text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">{sk.name}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] truncate">{sk.description}</p>
            </div>
            <ChevronRight
              size={11}
              className="text-[var(--text-tertiary)] group-hover:text-[#94A3B8] group-hover:translate-x-0.5 transition-all shrink-0"
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
// Cortex prompt box — entry point into the prompt gate
// ---------------------------------------------------------------------------

function CortexPromptBox({ mode }: { mode: CMMode }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const addAction = useComputerModeStore((s) => s.addAction)

  async function submit() {
    const raw = value.trim()
    if (!raw) return
    setBusy(true)
    try {
      const result = await submitPromptThroughGate(raw, {
        entryPoint: 'cortex',
        studioKey: 'cortex',
        computerMode: mode === 'auto' ? 'autopilot' : (mode as 'suggest' | 'assist'),
      })
      if (!result) return
      setValue('')
      addAction({
        kind: 'suggest',
        status: 'pending',
        studio: 'cortex',
        label: `Prompt: ${result.prompt.slice(0, 80)}${result.prompt.length > 80 ? '…' : ''}`,
        detail: result.usedEnhancement ? 'Enhanced before submit.' : 'Sent as-is.',
        confirmRequired: mode !== 'auto',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-5 py-3 border-b border-white/[0.06] bg-black/20">
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="text-[var(--accent)] shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submit()
            }
          }}
          placeholder="Ask Cortex — vague prompts get rewritten before they run…"
          disabled={busy}
          className="flex-1 h-[32px] bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          aria-label="Cortex prompt"
        />
        <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-[var(--text-tertiary)] font-mono">↵</kbd>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || value.trim().length === 0}
          className="h-[28px] px-3 rounded-md text-[11px] font-medium text-[var(--text-inverse)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Estimate panel — token / cost preview for a representative plan
// ---------------------------------------------------------------------------

const DEMO_PLAN: ExecutionPlan = {
  skillId: 'cortex.demo-refine',
  steps: [
    { id: 'plan',   label: 'Planner',   role: 'planner',   model: 'claude-opus-4-7',    approxInputChars: 3200, toolCount: 4 },
    { id: 'gen',    label: 'Generator', role: 'generator', model: 'claude-sonnet-4-6',  approxInputChars: 12800, toolCount: 6 },
    { id: 'critic', label: 'Critic',    role: 'critic',    model: 'claude-haiku-4-5',   approxInputChars: 5200, toolCount: 2 },
    { id: 'embed',  label: 'Embedding', role: 'embedding', model: 'voyage-3',           approxInputChars: 2400, toolCount: 0 },
  ],
}

function EstimatePanel() {
  const capToday = useBudgetStore((s) => s.capToday)
  const capThisMonth = useBudgetStore((s) => s.capThisMonth)
  const runs = useBudgetStore((s) => s.runs)

  const budgetSnapshot = useMemo(() => {
    const dayCutoff = Date.now() - 24 * 60 * 60 * 1000
    const now = new Date()
    const usedToday = runs
      .filter((r) => new Date(r.at).getTime() >= dayCutoff)
      .reduce((a, r) => a + r.cost, 0)
    const usedThisMonth = runs
      .filter((r) => {
        const d = new Date(r.at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((a, r) => a + r.cost, 0)
    return { usedToday, capToday, usedThisMonth, capThisMonth }
  }, [runs, capToday, capThisMonth])

  const est = useMemo(() => estimate(DEMO_PLAN, { budget: budgetSnapshot }), [budgetSnapshot])

  return (
    <TokenEstimate
      title="Estimate — refine skill"
      steps={est.steps.map((s) => ({
        stepId: s.stepId,
        label: s.label,
        modelDisplay: getPricing(s.model).displayName,
        tokensP50: s.inputTokens.p50 + s.outputTokens.p50,
        costP50: s.cost.p50,
      }))}
      totalTokensP50={est.total.tokens.p50}
      totalCostP50={est.total.cost.p50}
      budget={{
        usedToday: est.budget.usedToday,
        capToday: est.budget.capToday,
        projectedAfter: est.budget.projectedAfter,
      }}
      alternatives={est.alternatives.map((a) => ({
        label: a.label,
        description: a.description,
        savingsPct: a.savingsPct,
        qualityDeltaPct: a.qualityDeltaPct,
        costP50: a.cost.p50,
      }))}
      confidence={est.confidence}
    />
  )
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
    <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg-workspace)] text-[var(--text-primary)]">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent)] shadow-[0_0_24px_var(--accent-subtle)]">
          <BrainCircuit size={20} className="text-[var(--text-inverse)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--text-primary)] leading-none">Cortex</h1>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            The AI brain of your Product OS — acts across every studio.
          </p>
        </div>
        <ModeSwitcher />
      </div>

      {/* ── Prompt box ── */}
      <CortexPromptBox mode={mode} />

      {/* ── Mode banner ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <ModeIcon size={14} style={{ color: modeCfg.color }} />
        <p className="text-[11px]" style={{ color: modeCfg.color }}>
          <span className="font-semibold">{modeCfg.label} mode:</span>{' '}
          <span className="text-[var(--text-secondary)]">{modeCfg.description}</span>
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-5 flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Actions today" value={stats.today} icon={Activity} tone="accent" />
            <StatCard label="Pending" value={stats.pending} sub={stats.pending > 0 ? 'Needs approval' : 'All clear'} icon={Clock} tone="warning" />
            <StatCard label="Success rate" value={`${stats.success}%`} icon={TrendingUp} tone="success" />
            <StatCard label="Total logged" value={stats.total} sub="Last 200 actions" icon={ListTodo} tone="accent" />
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
                    className="rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={13} className="text-[var(--color-warning)]" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Awaiting your approval</p>
                      <span className="ml-auto text-[10px] text-[var(--text-secondary)]">
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
                  <Activity size={13} className="text-[var(--accent)]" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Action log</p>
                  <div className="ml-auto flex items-center gap-1">
                    {(['all', 'suggest', 'scaffold', 'analyze', 'create_task'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f as typeof filter)}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          filter === f
                            ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {f === 'all' ? 'All' : KIND_META[f as ActionKind].label}
                      </button>
                    ))}
                    {actionLog.length > 0 && (
                      <button
                        onClick={clearLog}
                        className="ml-2 px-2 py-1 rounded text-[10px] text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-secondary)] transition-colors"
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
                        <BrainCircuit size={18} className="text-[var(--text-tertiary)]" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">No actions yet</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1 max-w-[320px]">
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
              <EstimatePanel />
              <SkillLauncher productId={productId} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
