'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu,
  X,
  Send,
  Lightbulb,
  Wand2,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Play,
  StopCircle,
  Info,
  BarChart3,
  Trash2,
} from 'lucide-react'
import {
  useComputerModeStore,
  type ComputerMode,
  type ActionEntry,
  type ActionStatus,
} from '../../lib/computer-mode-store'
import { trpcMutate } from '../../lib/api'
import { submitPromptThroughGate } from '../../lib/prompt-gate-store'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MODES: Array<{
  key: ComputerMode
  label: string
  icon: typeof Lightbulb
  color: string
  description: string
}> = [
  {
    key: 'suggest',
    label: 'Suggest',
    icon: Lightbulb,
    color: '#F59E0B',
    description: 'AI surfaces ideas and analysis. No changes made.',
  },
  {
    key: 'assist',
    label: 'Assist',
    icon: Wand2,
    color: 'var(--accent-text)',
    description: 'AI proposes each action, you confirm before it runs.',
  },
  {
    key: 'auto',
    label: 'Auto',
    icon: Zap,
    color: '#10B981',
    description: 'AI executes approved plan autonomously. Fully logged.',
  },
]

const STATUS_CONFIG: Record<ActionStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending:  { icon: Clock,        color: '#F59E0B', label: 'Waiting'   },
  running:  { icon: Loader2,      color: 'var(--accent-text)', label: 'Running'  },
  done:     { icon: CheckCircle2, color: '#10B981', label: 'Done'      },
  rejected: { icon: XCircle,      color: '#64748B', label: 'Rejected'  },
  failed:   { icon: AlertTriangle,color: '#EF4444', label: 'Failed'    },
}

/* ------------------------------------------------------------------ */
/*  Demo plans keyed by keyword in the command                         */
/* ------------------------------------------------------------------ */

function buildDemoPlan(goal: string): Array<{ kind: 'analyze' | 'suggest' | 'scaffold' | 'create_task'; label: string }> {
  const g = goal.toLowerCase()
  if (g.includes('onboard') || g.includes('drop')) {
    return [
      { kind: 'analyze',     label: 'Analyze onboarding funnel metrics' },
      { kind: 'suggest',     label: 'Identify top drop-off steps' },
      { kind: 'scaffold',    label: 'Scaffold improved onboarding workflow' },
      { kind: 'create_task', label: 'Create tasks for design + dev handoff' },
    ]
  }
  if (g.includes('brand') || g.includes('token')) {
    return [
      { kind: 'analyze',     label: 'Audit token coverage across components' },
      { kind: 'suggest',     label: 'Suggest missing semantic tokens' },
      { kind: 'scaffold',    label: 'Generate token scaffold for dark mode' },
    ]
  }
  if (g.includes('release') || g.includes('deploy')) {
    return [
      { kind: 'analyze',     label: 'Check release readiness across studios' },
      { kind: 'suggest',     label: 'Surface blockers and missing handoffs' },
      { kind: 'create_task', label: 'Create pre-release checklist tasks' },
    ]
  }
  return [
    { kind: 'analyze',     label: `Analyze product state for: "${goal.slice(0, 40)}"` },
    { kind: 'suggest',     label: 'Surface improvement opportunities' },
    { kind: 'scaffold',    label: 'Generate draft artifacts' },
    { kind: 'create_task', label: 'Create action tasks from findings' },
  ]
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ActionCard({ entry, onConfirm, onReject }: {
  entry: ActionEntry
  onConfirm: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[entry.status]
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${
        entry.status === 'pending'
          ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5'
          : entry.status === 'done'
          ? 'border-[#10B981]/20 bg-[#10B981]/5'
          : entry.status === 'rejected'
          ? 'border-white/[0.04] bg-transparent opacity-50'
          : entry.status === 'failed'
          ? 'border-[#EF4444]/20 bg-[#EF4444]/5'
          : 'border-white/[0.06] bg-white/[0.02]'
      } p-2.5`}
    >
      <div className="flex items-start gap-2">
        <Icon
          size={12}
          style={{ color: cfg.color }}
          className={entry.status === 'running' ? 'animate-spin mt-0.5' : 'mt-0.5'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{entry.label}</span>
            <div className="flex items-center gap-1 shrink-0">
              {entry.detail && (
                <button onClick={() => setExpanded((v) => !v)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                  {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
              )}
              <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>

          {expanded && entry.detail && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 leading-relaxed">{entry.detail}</p>
          )}

          {entry.status === 'pending' && entry.confirmRequired && (
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => onConfirm(entry.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent-text)] text-[10px] hover:bg-[var(--accent)]/30 transition-colors"
              >
                <CheckCircle2 size={9} />
                Confirm
              </button>
              <button
                onClick={() => onReject(entry.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] text-[var(--text-tertiary)] text-[10px] hover:bg-white/[0.08] transition-colors"
              >
                <XCircle size={9} />
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

interface ComputerModePanelProps {
  studio: string
  productId?: string
}

export function ComputerModePanel({ studio, productId }: ComputerModePanelProps) {
  const mode = useComputerModeStore((s) => s.mode)
  const isOpen = useComputerModeStore((s) => s.isOpen)
  const actionLog = useComputerModeStore((s) => s.actionLog)
  const pendingActions = useComputerModeStore((s) => s.pendingActions)
  const activePlan = useComputerModeStore((s) => s.activePlan)
  const commandInput = useComputerModeStore((s) => s.commandInput)
  const { setMode, open, close, setCommandInput, addAction, updateAction, confirmAction, rejectAction, clearLog, startPlan, advancePlan, abortPlan } = useComputerModeStore()

  const [isExecuting, setIsExecuting] = useState(false)
  const [activeTab, setActiveTab] = useState<'run' | 'log'>('run')
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [actionLog.length])

  /* ── Execute a command ─────────────────────────────────────────── */
  const handleExecute = async () => {
    const raw = commandInput.trim()
    if (!raw || isExecuting || !productId) return

    const submission = await submitPromptThroughGate(raw, {
      entryPoint: 'computer-mode',
      studio,
      productId,
    })
    if (!submission) return

    const goal = submission.prompt
    setCommandInput('')
    setIsExecuting(true)
    setActiveTab('log')

    if (mode === 'suggest') {
      // Just run one analyze + suggest cycle
      const id = addAction({ kind: 'analyze', label: `Analyzing: ${goal}`, status: 'running', studio, productId, confirmRequired: false })
      try {
        const result = await trpcMutate<{ success: boolean; data?: unknown }>('ai.analyze', {
          productId, analysisType: 'gaps', context: { studioOrigin: studio, goal },
        })
        updateAction(id, { status: 'done', output: result as Record<string, unknown>, detail: (result as { data?: { summary?: string } }).data?.summary as string | undefined })
        const sid = addAction({ kind: 'suggest', label: 'Generating recommendations', status: 'running', studio, productId, confirmRequired: false })
        await new Promise((r) => setTimeout(r, 800))
        updateAction(sid, { status: 'done', detail: 'Suggestions ready — open AI Assistant for details' })
      } catch {
        updateAction(id, { status: 'failed', detail: 'Analysis failed — check AI configuration' })
      }
    } else {
      // Build execution plan
      const steps = buildDemoPlan(goal).map((s, i) => ({ ...s, order: i }))
      const planId = startPlan(goal, steps)

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!
        const confirmRequired = mode === 'assist' && (step.kind === 'scaffold' || step.kind === 'create_task')
        const actionId = addAction({
          kind: step.kind,
          label: step.label,
          status: confirmRequired ? 'pending' : 'running',
          studio,
          productId,
          confirmRequired,
        })

        if (confirmRequired) {
          // Wait for user to confirm or reject
          await new Promise<void>((resolve) => {
            const unsubscribe = useComputerModeStore.subscribe((state) => {
              const action = state.actionLog.find((a) => a.id === actionId)
              if (action && (action.status === 'running' || action.status === 'rejected' || action.status === 'failed')) {
                unsubscribe()
                resolve()
              }
            })
            // Auto-advance after 30s to avoid blocking
            setTimeout(() => { unsubscribe(); resolve() }, 30_000)
          })
        } else {
          // Simulate execution delay
          await new Promise((r) => setTimeout(r, 600 + Math.random() * 600))
          updateAction(actionId, { status: 'done' })
        }

        advancePlan(planId)
      }
    }

    setIsExecuting(false)
  }

  const currentMode = MODES.find((m) => m.key === mode)!

  return (
    <>
      {/* ── Toggle Button ─────────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={open}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-medium shadow-lg transition-all hover:scale-105"
          style={{
            background: mode === 'auto' ? 'linear-gradient(135deg, #10B981, #059669)' : mode === 'assist' ? 'linear-gradient(135deg, var(--accent), #6ba3ff)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <Cpu size={14} />
          Computer Mode
          <span className="ml-1 text-[10px] opacity-80 capitalize">{mode}</span>
        </button>
      )}

      {/* ── Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-screen w-[400px] flex flex-col bg-[#0A0F1E] border-l border-white/[0.08]"
            >
              {/* Header */}
              <div className="h-[var(--topbar-h)] flex items-center justify-between px-4 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                  <Cpu size={13} className="text-[var(--accent-text)]" />
                  <span className="text-[13px] font-semibold text-[#F1F5F9]">Computer Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearLog} className="p-1 rounded text-[#475569] hover:text-[#94A3B8] transition-colors" title="Clear log">
                    <Trash2 size={12} />
                  </button>
                  <button onClick={close} className="p-1 rounded text-[#475569] hover:text-[#94A3B8] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Mode selector */}
              <div className="px-4 pt-3 pb-2 border-b border-white/[0.06] shrink-0">
                <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  {MODES.map((m) => {
                    const MIcon = m.icon
                    const active = mode === m.key
                    return (
                      <button
                        key={m.key}
                        onClick={() => setMode(m.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
                        style={{ color: active ? m.color : '#64748B' }}
                      >
                        <MIcon size={11} />
                        {m.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-[#64748B] mt-2 leading-relaxed">{currentMode.description}</p>
              </div>

              {/* Pending confirmations (assist mode) */}
              {pendingActions.length > 0 && (
                <div className="px-4 py-2 border-b border-[#F59E0B]/20 bg-[#F59E0B]/5 shrink-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={11} className="text-[#F59E0B]" />
                    <span className="text-[11px] font-medium text-[#F59E0B]">{pendingActions.length} action{pendingActions.length !== 1 ? 's' : ''} awaiting confirmation</span>
                  </div>
                  <div className="space-y-1.5">
                    {pendingActions.map((a) => (
                      <ActionCard key={a.id} entry={a} onConfirm={confirmAction} onReject={rejectAction} />
                    ))}
                  </div>
                </div>
              )}

              {/* Active plan progress */}
              {activePlan && activePlan.status !== 'done' && activePlan.status !== 'aborted' && (
                <div className="px-4 py-2.5 border-b border-white/[0.06] shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Play size={10} className="text-[var(--accent-text)]" />
                      <span className="text-[11px] font-medium text-[var(--text-primary)] truncate">{activePlan.goal}</span>
                    </div>
                    <button onClick={() => abortPlan(activePlan.id)} className="p-1 text-[#64748B] hover:text-red-400">
                      <StopCircle size={11} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {activePlan.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          step.status === 'done' ? 'bg-[#10B981]' :
                          step.status === 'running' ? 'bg-[var(--accent)] animate-pulse' :
                          'bg-white/[0.12]'
                        }`} />
                        <span className={`text-[10px] truncate ${step.status === 'done' ? 'text-[#64748B] line-through' : step.status === 'running' ? 'text-[var(--text-primary)]' : 'text-[#475569]'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${((activePlan.currentStep) / activePlan.steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tab bar */}
              <div className="flex border-b border-white/[0.06] shrink-0">
                {(['run', 'log'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === tab ? 'text-[var(--accent-text)] border-b-2 border-[var(--accent)]' : 'text-[#64748B] hover:text-[#94A3B8]'}`}
                  >
                    {tab === 'run' ? 'Command' : `Log${actionLog.length > 0 ? ` (${actionLog.length})` : ''}`}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {activeTab === 'run' ? (
                  <div className="p-4 space-y-3">
                    {/* Quick action chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Fix onboarding drop-off',
                        'Audit brand tokens',
                        'Prepare release checklist',
                        'Analyze feature gaps',
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setCommandInput(chip)}
                          className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-[#94A3B8] hover:border-[var(--accent)]/30 hover:text-[var(--accent-text)] transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Mode info box */}
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                      <div className="flex items-start gap-2">
                        <Info size={11} className="text-[var(--accent-text)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-[var(--text-primary)] mb-0.5">
                            {mode === 'suggest' && 'Suggestion mode — read only'}
                            {mode === 'assist' && 'Assist mode — you approve each step'}
                            {mode === 'auto' && 'Auto mode — executes full plan autonomously'}
                          </p>
                          <p className="text-[10px] text-[#64748B] leading-relaxed">
                            {mode === 'suggest' && 'AI will analyze and recommend. Nothing will be created or changed.'}
                            {mode === 'assist' && 'AI plans the steps, you confirm mutations (scaffold, create tasks) before they run.'}
                            {mode === 'auto' && 'AI executes the full plan. All actions are logged and revertible.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Actions', value: actionLog.length, icon: BarChart3 },
                        { label: 'Pending', value: pendingActions.length, icon: Clock },
                        { label: 'Done', value: actionLog.filter((a) => a.status === 'done').length, icon: CheckCircle2 },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                          <Icon size={12} className="mx-auto mb-1 text-[var(--text-tertiary)]" />
                          <p className="text-[16px] font-bold text-[var(--text-primary)]">{value}</p>
                          <p className="text-[9px] text-[#64748B]">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {actionLog.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Cpu size={20} className="text-[#475569] mb-3" />
                        <p className="text-[12px] text-[#64748B]">No actions yet</p>
                        <p className="text-[10px] text-[#475569] mt-0.5">Run a command to see the log</p>
                      </div>
                    ) : (
                      [...actionLog].reverse().map((entry) => (
                        <ActionCard
                          key={entry.id}
                          entry={entry}
                          onConfirm={confirmAction}
                          onReject={rejectAction}
                        />
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>

              {/* Command input */}
              <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-[var(--accent)]/40 transition-colors">
                  <Cpu size={12} className="text-[#475569] shrink-0" />
                  <input
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                    placeholder={`Tell AI what to do in ${studio}…`}
                    disabled={isExecuting}
                    className="flex-1 bg-transparent text-[12px] text-[#F1F5F9] placeholder-[#475569] outline-none"
                  />
                  <button
                    onClick={handleExecute}
                    disabled={!commandInput.trim() || isExecuting || !productId}
                    className="p-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  </button>
                </div>
                <p className="text-[9px] text-[#475569] mt-1.5 text-center">
                  {mode === 'auto' ? '⚡ Auto mode — actions will execute without confirmation' : 'Press ↵ to run'}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
