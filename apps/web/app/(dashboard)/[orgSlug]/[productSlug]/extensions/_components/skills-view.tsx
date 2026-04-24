'use client'

import { useState, useMemo } from 'react'
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  BarChart3,
  Code,
  Palette,
  TrendingUp,
  Settings2,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  Shield,
  Bot,
  Activity,
  Cpu,
  FlaskConical,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useProduct } from '../../layout'
import {
  useAISkillsStore,
  type AISkill,
  type AISkillFamily,
  type AIActionClass,
  type SkillExecution,
  type ComputerMode,
} from '../../../../../lib/ai-skills-store'
import { useBudgetStore } from '../../../../../lib/budget-store'
import { usageHistory } from '@product-os/ai'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FAMILY_CONFIG: Record<AISkillFamily, { label: string; icon: typeof Sparkles; color: string; bg: string }> = {
  product: { label: 'Product', icon: Zap, color: '#6398ff', bg: 'rgba(99,152,255,0.12)' },
  design: { label: 'Design', icon: Palette, color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  engineering: { label: 'Engineering', icon: Code, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  growth: { label: 'Growth', icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  system: { label: 'System', icon: Cpu, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
}

const ACTION_CLASS_COLORS: Record<AIActionClass, string> = {
  suggest: 'var(--color-info)',
  scaffold: 'var(--color-success)',
  transform: 'var(--color-warning)',
  analyze: 'var(--accent-text)',
  operate: 'var(--color-error)',
}

// Maps action class to routed model — lighter models for fast suggestions, heavier for mutations
const ACTION_CLASS_MODEL: Record<AIActionClass, string> = {
  suggest:   'claude-haiku-4-5',
  analyze:   'claude-haiku-4-5',
  scaffold:  'claude-sonnet-4-6',
  transform: 'claude-sonnet-4-6',
  operate:   'claude-opus-4-7',
}

// Display labels for model chips
const MODEL_DISPLAY: Record<string, string> = {
  'claude-haiku-4-5':   'Haiku 4.5',
  'claude-sonnet-4-6':  'Sonnet 4.6',
  'claude-opus-4-7':    'Opus 4.7',
}

// Estimated tokens per action class (used for budget projection)
const ACTION_CLASS_TOKENS: Record<AIActionClass, number> = {
  suggest:   800,
  analyze:   1200,
  scaffold:  2500,
  transform: 3000,
  operate:   5000,
}

const COMPUTER_MODE_CONFIG: Record<ComputerMode, { label: string; description: string; icon: typeof Bot; color: string }> = {
  suggest: {
    label: 'Suggest',
    description: 'AI surfaces recommendations. You decide what to apply.',
    icon: Sparkles,
    color: '#6398ff',
  },
  assist: {
    label: 'Assist',
    description: 'AI drafts changes and applies with one-click approval.',
    icon: Bot,
    color: '#10b981',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI executes within policy bounds autonomously.',
    icon: Zap,
    color: '#f59e0b',
  },
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ---------------------------------------------------------------------------
// Run skill modal
// ---------------------------------------------------------------------------

function RunModal({
  skill,
  productId,
  onClose,
}: {
  skill: AISkill
  productId: string
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const recordRun = useBudgetStore((s) => s.recordRun)
  const usedToday = useBudgetStore((s) => s.usedToday())
  const capToday = useBudgetStore((s) => s.capToday)

  const estimatedTokens = ACTION_CLASS_TOKENS[skill.actionClass]
  const estimatedCost = (estimatedTokens / 1_000_000) * 3 // ~$3/M tokens blended estimate
  const budgetUsedPct = capToday > 0 ? usedToday / capToday : 0
  const wouldExceedBudget = capToday > 0 && usedToday + estimatedCost > capToday

  async function handleRun() {
    setRunning(true)
    try {
      const { aiRuntime } = await import('../../../../../lib/ai-runtime')
      const { useAuthStore } = await import('../../../../../lib/auth-store')
      const userId = useAuthStore.getState().user?.id ?? 'anon'
      const userName = useAuthStore.getState().user?.name ?? 'Unknown'
      await aiRuntime.run(skill.id, productId, { prompt }, { id: userId, name: userName })
      // Learning loop — record actual run to budget + usage history
      recordRun({ skillId: skill.id, cost: estimatedCost, tokens: estimatedTokens })
      usageHistory.record({
        skillId: skill.id,
        stepId: skill.actionClass,
        model: ACTION_CLASS_MODEL[skill.actionClass] as never,
        inputTokens: Math.round(estimatedTokens * 0.4),
        outputTokens: Math.round(estimatedTokens * 0.6),
        at: new Date().toISOString(),
      })
      setDone(true)
    } catch {
      // error state implicit via done=false
    } finally {
      setRunning(false)
    }
  }

  const cfg = FAMILY_CONFIG[skill.family]
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[520px] rounded-2xl border border-[var(--border-default)] overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
              <Icon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{skill.name}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{skill.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)]">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Budget warning */}
        {wouldExceedBudget && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/20">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] flex-shrink-0" />
            <p className="text-[11px] text-[var(--color-warning)]">
              This run may exceed today&apos;s budget cap (${capToday.toFixed(2)} limit, ${usedToday.toFixed(2)} used).
            </p>
          </div>
        )}

        <div className="p-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success-muted)' }}>
                <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Skill executed successfully</p>
              <p className="text-xs text-[var(--text-tertiary)]">Results added to execution history</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 text-xs font-medium rounded-xl"
                style={{ background: 'var(--accent-text)', color: '#fff' }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">
                  Context / Prompt <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder={`Describe what you want ${skill.name} to focus on…`}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)] resize-none"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <FlaskConical className="w-3.5 h-3.5" />
                  {skill.creditCost === 0 ? 'Free skill' : `${skill.creditCost} credits`}
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <Cpu className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span className="text-[var(--text-tertiary)]">{MODEL_DISPLAY[ACTION_CLASS_MODEL[skill.actionClass]] ?? ACTION_CLASS_MODEL[skill.actionClass]}</span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: ACTION_CLASS_COLORS[skill.actionClass], background: 'var(--bg-hover)' }}
                >
                  {skill.actionClass}
                </span>
              </div>
              {/* Budget meter */}
              {capToday > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                    <span>Daily budget</span>
                    <span>${usedToday.toFixed(2)} / ${capToday.toFixed(2)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, budgetUsedPct * 100)}%`,
                        background: budgetUsedPct > 0.8 ? '#F43F5E' : budgetUsedPct > 0.6 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-60"
                  style={{ background: wouldExceedBudget ? '#F59E0B' : cfg.color, color: '#fff' }}
                >
                  {running
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running…</>
                    : wouldExceedBudget
                      ? <><AlertTriangle className="w-3.5 h-3.5" />Run Anyway</>
                      : <><Play className="w-3.5 h-3.5" />Run Skill</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skill card
// ---------------------------------------------------------------------------

function SkillCard({ skill, onRun }: { skill: AISkill; onRun: (s: AISkill) => void }) {
  const toggleSkill = useAISkillsStore((s) => s.toggleSkill)
  const cfg = FAMILY_CONFIG[skill.family]
  const Icon = cfg.icon

  return (
    <div
      className="rounded-2xl border border-[var(--border-subtle)] p-4 flex flex-col gap-3 transition-all hover:border-[var(--border-default)]"
      style={{ background: 'var(--bg-card)', opacity: skill.enabled ? 1 : 0.5 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">{skill.name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{skill.description}</p>
          </div>
        </div>
        <button
          onClick={() => toggleSkill(skill.id)}
          className="flex-shrink-0 mt-0.5"
        >
          {skill.enabled
            ? <ToggleRight className="w-5 h-5 text-[var(--accent-text)]" />
            : <ToggleLeft className="w-5 h-5 text-[var(--text-tertiary)]" />
          }
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{ color: ACTION_CLASS_COLORS[skill.actionClass], background: 'var(--bg-hover)' }}
          >
            {skill.actionClass}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]" style={{ background: 'var(--bg-subtle)' }}>
            <Cpu className="w-2.5 h-2.5" />{MODEL_DISPLAY[ACTION_CLASS_MODEL[skill.actionClass]] ?? ACTION_CLASS_MODEL[skill.actionClass]}
          </span>
          {skill.targetStudio && (
            <span className="text-[10px] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]" style={{ background: 'var(--bg-subtle)' }}>
              {skill.targetStudio}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {skill.creditCost === 0 ? 'Free' : `${skill.creditCost}cr`}
          </span>
          <button
            onClick={() => skill.enabled && onRun(skill)}
            disabled={!skill.enabled}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-40 hover:opacity-80"
            style={{ background: cfg.color, color: '#fff' }}
          >
            <Play className="w-2.5 h-2.5" />Run
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Execution history row
// ---------------------------------------------------------------------------

function ExecRow({ exec, skillName }: { exec: SkillExecution; skillName: string }) {
  const icon = {
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />,
    running: <Loader2 className="w-3.5 h-3.5 text-[var(--accent-text)] animate-spin" />,
    failed: <AlertCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />,
    idle: <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />,
  }[exec.status]

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{skillName}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          {exec.mode} · {exec.artifactsCreated} artifacts · {exec.tokensUsed.toLocaleString()} tokens
        </p>
      </div>
      <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">{timeAgo(exec.startedAt)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Computer Mode card
// ---------------------------------------------------------------------------

function ComputerModeCard({ mode, active, onSelect }: { mode: ComputerMode; active: boolean; onSelect: () => void }) {
  const cfg = COMPUTER_MODE_CONFIG[mode]
  const Icon = cfg.icon
  return (
    <button
      onClick={onSelect}
      className="flex-1 flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all"
      style={{
        borderColor: active ? cfg.color : 'var(--border-subtle)',
        background: active ? `${cfg.color}18` : 'var(--bg-subtle)',
        boxShadow: active ? `0 0 0 1px ${cfg.color}` : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: active ? `${cfg.color}30` : 'var(--bg-hover)' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: active ? cfg.color : 'var(--text-tertiary)' }} />
        </div>
        {active && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}30`, color: cfg.color }}>
            Active
          </span>
        )}
      </div>
      <p className="text-xs font-semibold" style={{ color: active ? cfg.color : 'var(--text-primary)' }}>{cfg.label}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">{cfg.description}</p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FamilyTab = 'all' | AISkillFamily

export default function SkillsView() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)

  const skills = useAISkillsStore((s) => s.skills)
  const executions = useAISkillsStore((s) => s.executions)
  const computerMode = useAISkillsStore((s) => s.computerMode)
  const setComputerMode = useAISkillsStore((s) => s.setComputerMode)

  const [familyTab, setFamilyTab] = useState<FamilyTab>('all')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<AIActionClass | 'all'>('all')
  const [runningSkill, setRunningSkill] = useState<AISkill | null>(null)
  const [activeTab, setActiveTab] = useState<'catalog' | 'history' | 'settings'>('catalog')

  const productExecs = useMemo(
    () => executions.filter((e) => e.productId === productId),
    [executions, productId]
  )

  const filteredSkills = useMemo(() => {
    let list = skills
    if (familyTab !== 'all') list = list.filter((s) => s.family === familyTab)
    if (actionFilter !== 'all') list = list.filter((s) => s.actionClass === actionFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return list
  }, [skills, familyTab, actionFilter, search])

  const usedToday = useBudgetStore((s) => s.usedToday())
  const capToday = useBudgetStore((s) => s.capToday)
  const budgetPct = capToday > 0 ? usedToday / capToday : 0
  const showBudgetAlert = capToday > 0 && budgetPct >= 0.8

  const enabledCount = skills.filter((s) => s.enabled).length
  const completedExecs = productExecs.filter((e) => e.status === 'completed')
  const totalArtifacts = completedExecs.reduce((a, e) => a + e.artifactsCreated, 0)
  const credits = useMemo(() =>
    completedExecs.reduce((sum, e) => {
      const skill = skills.find((sk) => sk.id === e.skillId)
      return sum + (skill?.creditCost ?? 0)
    }, 0),
    [completedExecs, skills]
  )

  const familyTabs: { key: FamilyTab; label: string }[] = [
    { key: 'all', label: 'All' },
    ...Object.entries(FAMILY_CONFIG).map(([k, v]) => ({ key: k as AISkillFamily, label: v.label })),
  ]

  const actionClasses: { key: AIActionClass | 'all'; label: string }[] = [
    { key: 'all', label: 'Any type' },
    { key: 'suggest', label: 'Suggest' },
    { key: 'scaffold', label: 'Scaffold' },
    { key: 'transform', label: 'Transform' },
    { key: 'analyze', label: 'Analyze' },
    { key: 'operate', label: 'Operate' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] flex-shrink-0"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,152,255,0.15)' }}>
            <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">AI Skills</h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              {enabledCount}/{skills.length} skills active · {computerMode.activeMode} mode
            </p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
          {(['catalog', 'history', 'settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-1.5 text-xs rounded-lg font-medium capitalize transition-all"
              style={{
                background: activeTab === t ? 'var(--bg-card)' : 'transparent',
                color: activeTab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Budget alert bar */}
      {showBudgetAlert && (
        <div className="flex items-center gap-2 px-6 py-2 bg-[var(--color-warning)]/10 border-b border-[var(--color-warning)]/20 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] flex-shrink-0" />
          <p className="text-[11px] text-[var(--color-warning)] flex-1">
            Daily AI budget at {Math.round(budgetPct * 100)}% — ${usedToday.toFixed(2)} of ${capToday.toFixed(2)} used today.
          </p>
          <div className="h-1.5 w-24 rounded-full bg-[var(--color-warning)]/20 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, budgetPct * 100)}%`, background: budgetPct >= 1 ? '#F43F5E' : '#F59E0B' }}
            />
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 flex-shrink-0">
        {[
          { label: 'Skills Active', value: enabledCount, color: 'var(--accent-text)' },
          { label: 'Runs Today', value: productExecs.length, color: 'var(--color-success)' },
          { label: 'Artifacts Created', value: totalArtifacts, color: 'var(--color-warning)' },
          { label: 'Credits Used', value: credits, color: 'var(--text-primary)' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-4 py-3 border border-[var(--border-subtle)]" style={{ background: 'var(--bg-card)' }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* === CATALOG TAB === */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Family tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
                {familyTabs.map((ft) => {
                  const cfg = ft.key !== 'all' ? FAMILY_CONFIG[ft.key] : null
                  return (
                    <button
                      key={ft.key}
                      onClick={() => setFamilyTab(ft.key)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                      style={{
                        background: familyTab === ft.key ? (cfg?.bg ?? 'var(--bg-card)') : 'transparent',
                        color: familyTab === ft.key ? (cfg?.color ?? 'var(--text-primary)') : 'var(--text-tertiary)',
                      }}
                    >
                      {ft.label}
                    </button>
                  )
                })}
              </div>
              {/* Action filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as AIActionClass | 'all')}
                className="text-xs px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none"
              >
                {actionClasses.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]"
                />
              </div>
              <span className="text-xs text-[var(--text-tertiary)] ml-auto">{filteredSkills.length} skills</span>
            </div>

            {/* Skills grid */}
            {filteredSkills.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Sparkles className="w-8 h-8 text-[var(--text-tertiary)] mb-3" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">No matching skills</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} onRun={setRunningSkill} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === 'history' && (
          <div
            className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">Execution History</span>
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">{productExecs.length} runs</span>
            </div>
            {productExecs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Activity className="w-8 h-8 text-[var(--text-tertiary)] mb-3" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">No executions yet</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Run a skill from the Catalog tab to get started.</p>
              </div>
            ) : (
              <div className="px-4">
                {productExecs.map((exec) => {
                  const skill = skills.find((s) => s.id === exec.skillId)
                  return <ExecRow key={exec.id} exec={exec} skillName={skill?.name ?? exec.skillId} />
                })}
              </div>
            )}
          </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Computer Mode */}
            <div className="rounded-2xl border border-[var(--border-subtle)] p-5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-[var(--accent-text)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Computer Mode</span>
              </div>
              <div className="flex gap-3">
                {(['suggest', 'assist', 'autopilot'] as ComputerMode[]).map((m) => (
                  <ComputerModeCard
                    key={m}
                    mode={m}
                    active={computerMode.activeMode === m}
                    onSelect={() => setComputerMode(m)}
                  />
                ))}
              </div>
            </div>

            {/* Execution policy */}
            <div className="rounded-2xl border border-[var(--border-subtle)] p-5" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-[var(--color-warning)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Execution Policy</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">Require approval for mutations</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">AI must get explicit approval before modifying graph nodes</p>
                  </div>
                  <div
                    className="w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors"
                    style={{ background: computerMode.executionPolicy.requireApprovalForMutations ? 'var(--accent-text)' : 'var(--border-subtle)' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: computerMode.executionPolicy.requireApprovalForMutations ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">Max auto-actions per session</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Cap on consecutive AI actions in Autopilot mode</p>
                  </div>
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-lg"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--accent-text)' }}
                  >
                    {computerMode.executionPolicy.maxAutoActions}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Allowed studios for auto-execution</p>
                  <div className="flex flex-wrap gap-1.5">
                    {computerMode.executionPolicy.allowedStudios.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-1 rounded-lg font-medium"
                        style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action log */}
            {computerMode.actionLog.length > 0 && (
              <div className="rounded-2xl border border-[var(--border-subtle)] p-5" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Action Log</span>
                  <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">{computerMode.actionLog.length} actions</span>
                </div>
                <div>
                  {computerMode.actionLog.slice(0, 10).map((action) => (
                    <div key={action.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                        style={{
                          color: action.status === 'executed' ? 'var(--color-success)' : action.status === 'rejected' ? 'var(--color-error)' : 'var(--color-warning)',
                          background: 'var(--bg-subtle)',
                        }}
                      >
                        {action.status}
                      </span>
                      <p className="text-xs text-[var(--text-primary)] flex-1 truncate">{action.action}</p>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{timeAgo(action.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Run modal */}
      {runningSkill && (
        <RunModal
          skill={runningSkill}
          productId={productId}
          onClose={() => setRunningSkill(null)}
        />
      )}
    </div>
  )
}
