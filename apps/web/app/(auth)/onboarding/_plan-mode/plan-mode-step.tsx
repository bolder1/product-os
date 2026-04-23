'use client'

/**
 * Plan Mode — multi-phase Step 3 of onboarding.
 *
 * Phases (internal progress bar):
 *   1. Memory   — upload PDFs/assets, AI ingests in background
 *   2. Brief    — freeform textarea + gamified MCQ (hybrid)
 *   3. Summary  — AI-drafted one-liner, voice, palette, MVP features (editable)
 *   4. Template — template pick or scratch
 *   5. Team     — invite teammates
 *   6. Tasks    — preview AI-generated tasks, toggle autopilot
 *
 * Exposes `onComplete(payload)` — the parent onboarding page consumes the
 * payload to create the product + scaffold graph/brand/voice/tasks.
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, X, Sparkles, Send, Palette, Users, ListChecks, ChevronRight, ChevronLeft, Check,
  Rocket, Globe, LayoutTemplate, Plus, Wand2,
} from 'lucide-react'
import { usePlanModeStore, type PlanStep, type MCQAnswer } from '../../../lib/plan-mode-store'
import { useProductMemoryStore, kindFromFilename } from '../../../lib/product-memory-store'

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export interface PlanModePayload {
  freeform: string
  mcq: MCQAnswer
  summary: {
    oneLiner: string
    targetUsers: string
    voiceAdjectives: string[]
    palette: string[]
    features: Array<{ name: string; description: string; priority: 'must' | 'should' | 'nice' }>
  }
  selectedTemplateId: string | null
  invitees: Array<{ email: string; role: string }>
  autopilotTasks: boolean
  memoryAssetIds: string[]
}

interface Props {
  defaultProductName?: string
  onComplete: (payload: PlanModePayload) => void
  onSkip: () => void
}

// ──────────────────────────────────────────────────────────────────────────
// MCQ questions
// ──────────────────────────────────────────────────────────────────────────

const MCQ_BANK: Array<{
  key: keyof MCQAnswer
  question: string
  options: Array<{ value: string; label: string; color?: string }>
}> = [
  {
    key: 'building',
    question: 'What are you building?',
    options: [
      { value: 'saas', label: 'SaaS product' },
      { value: 'mobile', label: 'Mobile app' },
      { value: 'marketing', label: 'Marketing site' },
      { value: 'internal', label: 'Internal tool' },
      { value: 'other', label: 'Something else' },
    ],
  },
  {
    key: 'audience',
    question: 'Who is it for?',
    options: [
      { value: 'consumers', label: 'Consumers' },
      { value: 'smb', label: 'Small / mid-market' },
      { value: 'enterprise', label: 'Enterprise' },
      { value: 'internal', label: 'Our internal team' },
    ],
  },
  {
    key: 'stage',
    question: 'What stage are you at?',
    options: [
      { value: 'idea', label: 'Idea' },
      { value: 'prototype', label: 'Prototype' },
      { value: 'beta', label: 'Beta' },
      { value: 'production', label: 'Production' },
    ],
  },
  {
    key: 'vibe',
    question: 'What vibe fits best?',
    options: [
      { value: 'playful', label: 'Playful' },
      { value: 'professional', label: 'Professional' },
      { value: 'technical', label: 'Technical' },
      { value: 'minimal', label: 'Minimal' },
      { value: 'bold', label: 'Bold' },
    ],
  },
  {
    key: 'voice',
    question: 'How should the product talk?',
    options: [
      { value: 'friendly', label: 'Friendly' },
      { value: 'authoritative', label: 'Authoritative' },
      { value: 'casual', label: 'Casual' },
      { value: 'witty', label: 'Witty' },
      { value: 'neutral', label: 'Neutral' },
    ],
  },
]

const COLOR_SWATCHES = ['#6398ff', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#64748b']

const TEMPLATE_OPTIONS = [
  { id: 'saas-starter', name: 'SaaS Starter', description: 'Auth, billing, dashboard scaffolding.', icon: <Rocket size={18} />, color: '#3B82F6' },
  { id: 'ops-pilot', name: 'OpsPilot', description: 'Internal ops dashboard + analytics.', icon: <Sparkles size={18} />, color: '#8B5CF6' },
  { id: 'landing-page', name: 'Landing Page', description: 'Marketing page with components library.', icon: <Globe size={18} />, color: '#06B6D4' },
]

const PHASE_ORDER: PlanStep[] = ['memory', 'brief', 'summary', 'template', 'team', 'tasks']
const PHASE_LABELS: Record<PlanStep, string> = {
  memory: 'Memory',
  brief: 'Brief',
  summary: 'Summary',
  template: 'Template',
  team: 'Team',
  tasks: 'Tasks',
  done: 'Done',
}

// ──────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────

export function PlanModeStep({ defaultProductName, onComplete, onSkip }: Props) {
  const plan = usePlanModeStore()
  const memory = useProductMemoryStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const phase = plan.step === 'done' ? 'memory' : plan.step
  const phaseIndex = PHASE_ORDER.indexOf(phase)

  // Auto-generate an AI summary when user reaches the summary phase
  useEffect(() => {
    if (plan.step === 'summary' && !plan.summary) {
      const summary = generateLocalSummary(plan.freeformBrief, plan.mcq, defaultProductName ?? 'Your Product')
      plan.setSummary(summary)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.step])

  function next() {
    const nextIdx = phaseIndex + 1
    if (nextIdx >= PHASE_ORDER.length) {
      handleFinalize()
    } else {
      plan.setStep(PHASE_ORDER[nextIdx])
    }
  }

  function back() {
    if (phaseIndex === 0) return
    plan.setStep(PHASE_ORDER[phaseIndex - 1])
  }

  function handleFinalize() {
    if (!plan.summary) return
    onComplete({
      freeform: plan.freeformBrief,
      mcq: plan.mcq,
      summary: plan.summary,
      selectedTemplateId: plan.selectedTemplateId,
      invitees: plan.invitees,
      autopilotTasks: plan.autopilotTasks,
      memoryAssetIds: plan.memoryAssetIds,
    })
  }

  // File upload (client-side; real upload via tRPC is invoked in handleUpload)
  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      const localId = crypto.randomUUID()
      memory.addAsset({
        id: localId,
        productId: 'pending', // product not yet created
        kind: kindFromFilename(file.name),
        filename: file.name,
        size: file.size,
        status: 'uploading',
        tags: [],
        createdAt: new Date().toISOString(),
      })
      plan.addMemoryAsset(localId)

      // Simulate background parse→embed. Real upload deferred until product exists;
      // payload returned to parent, which persists memory via memory.upload tRPC.
      setTimeout(() => memory.updateAsset(localId, { status: 'parsing' }), 500)
      setTimeout(() => memory.updateAsset(localId, { status: 'embedding' }), 1500)
      setTimeout(() => memory.updateAsset(localId, { status: 'ready' }), 2600)
    }
  }

  const memoryAssets = memory.assets.filter((a) => plan.memoryAssetIds.includes(a.id))

  const canProceed = (() => {
    if (phase === 'memory') return true // always skippable
    if (phase === 'brief') return plan.freeformBrief.trim().length > 10 || Object.keys(plan.mcq).length >= 3
    if (phase === 'summary') return !!plan.summary
    if (phase === 'template') return true // scratch allowed
    if (phase === 'team') return true // invites optional
    if (phase === 'tasks') return true
    return false
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-progress bar */}
      <div className="flex items-center gap-1.5">
        {PHASE_ORDER.map((p, i) => {
          const done = i < phaseIndex
          const active = i === phaseIndex
          return (
            <div key={p} className="flex items-center gap-1.5 flex-1">
              <button
                onClick={() => plan.setStep(p)}
                className="flex items-center gap-2 flex-1"
                disabled={!done && !active}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 transition-colors ${
                    done ? 'bg-[#3dd68c] text-black' : active ? 'bg-[#6398ff] text-white' : 'bg-white/[0.05] text-[#64748b]'
                  }`}
                >
                  {done ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium truncate ${active ? 'text-[#e4e4e7]' : 'text-[#64748b]'}`}>
                  {PHASE_LABELS[p]}
                </span>
              </button>
              {i < PHASE_ORDER.length - 1 && (
                <div className={`h-px flex-1 ${done ? 'bg-[#3dd68c]/50' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Phase body */}
      <div className="min-h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
          >
            {/* ─────────── MEMORY ─────────── */}
            {phase === 'memory' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#6398ff]/15 flex items-center justify-center shrink-0">
                    <Upload size={18} className="text-[#6398ff]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#e4e4e7]">Product Memory</h3>
                    <p className="text-xs text-[#94a3b8] leading-relaxed mt-0.5">
                      Upload briefs, research, PDFs — anything that helps AI understand your product.
                      We’ll read, embed, and use this context throughout Plan Mode.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-white/[0.1] rounded-xl hover:border-[#6398ff]/40 hover:bg-white/[0.02] transition-colors"
                >
                  <Upload size={22} className="text-[#6398ff]" />
                  <p className="text-sm text-[#e4e4e7] font-medium">Drop files or click to upload</p>
                  <p className="text-[11px] text-[#64748b]">PDF · DOCX · MD · TXT · Images</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.md,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                {memoryAssets.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {memoryAssets.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                        <FileText size={14} className="text-[#94a3b8] shrink-0" />
                        <span className="text-xs text-[#e4e4e7] flex-1 truncate">{a.filename}</span>
                        <StatusPill status={a.status} />
                        <button
                          onClick={() => { memory.removeAsset(a.id); plan.removeMemoryAsset(a.id) }}
                          className="text-[#64748b] hover:text-[#ef5350] transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-[#64748b] text-center mt-2">
                  You can always add more to Memory later from the sidebar.
                </p>
              </div>
            )}

            {/* ─────────── BRIEF ─────────── */}
            {phase === 'brief' && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                {/* Freeform */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <label className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#6398ff]" />
                    Describe your product in your own words
                  </label>
                  <textarea
                    value={plan.freeformBrief}
                    onChange={(e) => plan.setFreeform(e.target.value)}
                    placeholder="What are you building? Who is it for? What problem does it solve?"
                    rows={12}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#e4e4e7] placeholder:text-[#64748b] focus:border-[#6398ff]/50 focus:outline-none focus:ring-1 focus:ring-[#6398ff]/30 resize-none text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-[#64748b]">
                    {plan.freeformBrief.length} characters · AI reads freeform text + Memory + MCQ answers together.
                  </p>
                </div>

                {/* MCQ cards */}
                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="text-xs text-[#94a3b8]">Quick answers (optional)</label>
                  <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {MCQ_BANK.map((q) => (
                      <MCQCard
                        key={q.key}
                        question={q.question}
                        options={q.options}
                        value={plan.mcq[q.key] as string | undefined}
                        onChange={(v) => plan.setMCQ({ [q.key]: v as any })}
                      />
                    ))}
                    <ColorPicker
                      value={plan.mcq.primaryColor}
                      onChange={(v) => plan.setMCQ({ primaryColor: v })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─────────── SUMMARY ─────────── */}
            {phase === 'summary' && plan.summary && (
              <SummaryEditor
                summary={plan.summary}
                onPatch={(p) => plan.patchSummary(p)}
              />
            )}

            {/* ─────────── TEMPLATE ─────────── */}
            {phase === 'template' && (
              <div className="flex flex-col gap-3">
                <label className="text-xs text-[#94a3b8]">Start from a template or scratch</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TEMPLATE_OPTIONS.map((t) => {
                    const isSelected = plan.selectedTemplateId === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => plan.setTemplate(t.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                          isSelected ? 'border-[#6398ff]/50 bg-[#6398ff]/10' : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${t.color}25`, color: t.color }}>
                          {t.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#e4e4e7]">{t.name}</p>
                            {t.id === recommendTemplate(plan.mcq) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#6398ff]/20 text-[#6398ff] font-semibold">RECOMMENDED</span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748b] mt-0.5">{t.description}</p>
                        </div>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => plan.setTemplate(null)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                      plan.selectedTemplateId === null ? 'border-[#6398ff]/50 bg-[#6398ff]/10' : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <LayoutTemplate size={18} className="text-[#94a3b8]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#e4e4e7]">Start from scratch</p>
                      <p className="text-xs text-[#64748b] mt-0.5">Empty product — AI scaffolds from your brief only.</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ─────────── TEAM ─────────── */}
            {phase === 'team' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center">
                    <Users size={18} className="text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#e4e4e7]">Invite teammates</h3>
                    <p className="text-xs text-[#94a3b8]">They’ll get their own role-specific dashboard and task list.</p>
                  </div>
                </div>
                <TeamInviter invitees={plan.invitees} onAdd={plan.addInvitee} onRemove={plan.removeInvitee} />
              </div>
            )}

            {/* ─────────── TASKS ─────────── */}
            {phase === 'tasks' && (
              <TaskPreview
                mcq={plan.mcq}
                summary={plan.summary}
                autopilot={plan.autopilotTasks}
                skipped={plan.skippedTaskIds}
                onToggleAutopilot={plan.setAutopilot}
                onToggleSkip={plan.toggleSkippedTask}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={back}
            disabled={phaseIndex === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              phaseIndex === 0 ? 'text-[#64748b]/40 cursor-not-allowed' : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#e4e4e7]'
            }`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button onClick={onSkip} className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors">
            Skip Plan Mode
          </button>
        </div>

        <motion.button
          onClick={next}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            canProceed ? 'bg-[#6398ff] text-white hover:bg-[#5286e6]' : 'bg-white/[0.06] text-[#64748b] cursor-not-allowed'
          }`}
        >
          {phase === 'tasks' ? 'Scaffold product' : 'Next'}
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const color = status === 'ready' ? '#3dd68c' : status === 'failed' ? '#ef5350' : '#e8a830'
  const label = status === 'uploading' ? 'uploading' : status
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  )
}

function MCQCard({
  question, options, value, onChange,
}: {
  question: string
  options: Array<{ value: string; label: string }>
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <p className="text-[11px] text-[#94a3b8] mb-2 font-medium">{question}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`text-[11px] px-2.5 py-1.5 rounded-md border transition-colors ${
                selected
                  ? 'border-[#6398ff]/60 bg-[#6398ff]/15 text-[#6398ff]'
                  : 'border-white/[0.08] bg-white/[0.02] text-[#94a3b8] hover:text-[#e4e4e7] hover:bg-white/[0.04]'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string | undefined; onChange: (c: string) => void }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <p className="text-[11px] text-[#94a3b8] mb-2 font-medium flex items-center gap-1.5">
        <Palette size={11} /> Primary color instinct?
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-md transition-transform ${value === c ? 'scale-110 ring-2 ring-white/40' : 'hover:scale-105'}`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  )
}

function SummaryEditor({
  summary, onPatch,
}: {
  summary: PlanModePayload['summary']
  onPatch: (patch: Partial<PlanModePayload['summary']>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#3dd68c]/15 flex items-center justify-center shrink-0">
          <Wand2 size={18} className="text-[#3dd68c]" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#e4e4e7]">Here’s what I understood</h3>
          <p className="text-xs text-[#94a3b8]">Tweak anything before we scaffold your product.</p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-[#94a3b8]">Product one-liner</span>
        <input
          value={summary.oneLiner}
          onChange={(e) => onPatch({ oneLiner: e.target.value })}
          className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#e4e4e7] focus:border-[#6398ff]/50 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] text-[#94a3b8]">Target users</span>
        <input
          value={summary.targetUsers}
          onChange={(e) => onPatch({ targetUsers: e.target.value })}
          className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#e4e4e7] focus:border-[#6398ff]/50 focus:outline-none"
        />
      </label>

      <div>
        <span className="text-[11px] text-[#94a3b8]">Voice</span>
        <div className="flex gap-2 mt-1.5">
          {summary.voiceAdjectives.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => {
                const next = [...summary.voiceAdjectives]
                next[i] = e.target.value
                onPatch({ voiceAdjectives: next })
              }}
              className="flex-1 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#e4e4e7]"
            />
          ))}
        </div>
      </div>

      <div>
        <span className="text-[11px] text-[#94a3b8]">Suggested palette</span>
        <div className="flex gap-2 mt-1.5">
          {summary.palette.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-lg border border-white/[0.1]" style={{ backgroundColor: c }} />
              <span className="text-[9px] font-mono text-[#64748b]">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="text-[11px] text-[#94a3b8]">MVP features ({summary.features.length})</span>
        <div className="flex flex-col gap-1.5 mt-1.5 max-h-[180px] overflow-y-auto pr-1">
          {summary.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                f.priority === 'must' ? 'bg-[#ef5350]/20 text-[#ef5350]' :
                f.priority === 'should' ? 'bg-[#e8a830]/20 text-[#e8a830]' :
                'bg-white/[0.06] text-[#94a3b8]'
              }`}>{f.priority}</span>
              <input
                value={f.name}
                onChange={(e) => {
                  const next = [...summary.features]
                  next[i] = { ...f, name: e.target.value }
                  onPatch({ features: next })
                }}
                className="flex-1 bg-transparent text-sm text-[#e4e4e7] focus:outline-none"
              />
              <button
                onClick={() => onPatch({ features: summary.features.filter((_, j) => j !== i) })}
                className="text-[#64748b] hover:text-[#ef5350]"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamInviter({
  invitees, onAdd, onRemove,
}: {
  invitees: Array<{ email: string; role: string }>
  onAdd: (i: { email: string; role: string }) => void
  onRemove: (email: string) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')

  function submit() {
    if (!email.includes('@')) return
    onAdd({ email, role })
    setEmail('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#e4e4e7] placeholder:text-[#64748b] focus:border-[#6398ff]/50 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#e4e4e7] focus:outline-none"
        >
          <option value="manager">Manager</option>
          <option value="business_analyst">BA</option>
          <option value="qa">QA</option>
          <option value="product_designer">Designer</option>
          <option value="frontend_dev">Frontend</option>
          <option value="backend_dev">Backend</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          onClick={submit}
          className="px-3 py-2 rounded-lg bg-[#6398ff]/15 border border-[#6398ff]/30 text-[#6398ff] text-sm font-medium hover:bg-[#6398ff]/25 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {invitees.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {invitees.map((i) => (
            <div key={i.email} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <Send size={12} className="text-[#94a3b8]" />
              <span className="flex-1 text-xs text-[#e4e4e7]">{i.email}</span>
              <span className="text-[10px] text-[#94a3b8]">{i.role}</span>
              <button onClick={() => onRemove(i.email)} className="text-[#64748b] hover:text-[#ef5350]">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#64748b]">You can invite more people anytime from Settings.</p>
    </div>
  )
}

function TaskPreview({
  mcq, summary, autopilot, skipped, onToggleAutopilot, onToggleSkip,
}: {
  mcq: MCQAnswer
  summary: PlanModePayload['summary'] | null
  autopilot: boolean
  skipped: string[]
  onToggleAutopilot: (v: boolean) => void
  onToggleSkip: (id: string) => void
}) {
  const tasks = useMemo(() => generateLocalTasks(mcq, summary), [mcq, summary])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#6398ff]/15 flex items-center justify-center shrink-0">
          <ListChecks size={18} className="text-[#6398ff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-[#e4e4e7]">AI-generated tasks</h3>
          <p className="text-xs text-[#94a3b8]">Grouped by role. Skip any that don’t apply.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer">
          <input
            type="checkbox"
            checked={autopilot}
            onChange={(e) => onToggleAutopilot(e.target.checked)}
            className="accent-[#6398ff]"
          />
          AI manages tasks
        </label>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {tasks.map((t) => {
          const isSkipped = skipped.includes(t.id)
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                isSkipped ? 'border-white/[0.04] bg-white/[0.01] opacity-50' : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <span className="text-[9px] font-semibold uppercase text-[#94a3b8] px-1.5 py-0.5 rounded bg-white/[0.05]">
                {t.role}
              </span>
              <span className={`flex-1 text-xs ${isSkipped ? 'line-through text-[#64748b]' : 'text-[#e4e4e7]'}`}>
                {t.title}
              </span>
              <button onClick={() => onToggleSkip(t.id)} className="text-[#64748b] hover:text-[#ef5350] text-[11px]">
                {isSkipped ? 'Unskip' : 'Skip'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Local AI helpers (placeholder until real skill runtime is wired)
// ──────────────────────────────────────────────────────────────────────────

function generateLocalSummary(freeform: string, mcq: MCQAnswer, name: string): PlanModePayload['summary'] {
  const buildingLabel = {
    saas: 'SaaS product', mobile: 'mobile app', marketing: 'marketing site', internal: 'internal tool', other: 'product',
  }[mcq.building ?? 'other']
  const audienceLabel = {
    consumers: 'consumers', smb: 'small and mid-sized businesses', enterprise: 'enterprise teams', internal: 'internal teams',
  }[mcq.audience ?? 'smb']
  const oneLiner = freeform.trim().split(/\.|\n/)[0]?.slice(0, 140) || `${name} — a ${buildingLabel} for ${audienceLabel}.`

  const voiceMap: Record<string, string[]> = {
    friendly: ['Warm', 'Clear', 'Encouraging'],
    authoritative: ['Confident', 'Precise', 'Direct'],
    casual: ['Relaxed', 'Conversational', 'Approachable'],
    witty: ['Witty', 'Playful', 'Smart'],
    neutral: ['Clear', 'Neutral', 'Factual'],
  }
  const voiceAdjectives = voiceMap[mcq.voice ?? 'friendly']

  const primary = mcq.primaryColor ?? '#6398ff'
  const palette = deriveFivePalette(primary)

  const features: PlanModePayload['summary']['features'] = [
    { name: 'User authentication', description: 'Sign up, log in, password reset.', priority: 'must' },
    { name: 'Core dashboard', description: 'Main view after login.', priority: 'must' },
    { name: 'Primary workflow', description: 'Main user flow for the product.', priority: 'must' },
    { name: 'Notifications', description: 'Email + in-app alerts.', priority: 'should' },
    { name: 'Settings', description: 'Profile and preferences.', priority: 'should' },
    { name: 'Search', description: 'Global search across content.', priority: 'nice' },
  ]

  return {
    oneLiner,
    targetUsers: audienceLabel,
    voiceAdjectives,
    palette,
    features,
  }
}

function deriveFivePalette(primaryHex: string): string[] {
  // Very rough tint/shade derivation for visual preview.
  const hex = primaryHex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  return [
    `#${toHex(mix(r, 255, 0.8))}${toHex(mix(g, 255, 0.8))}${toHex(mix(b, 255, 0.8))}`,
    `#${toHex(mix(r, 255, 0.4))}${toHex(mix(g, 255, 0.4))}${toHex(mix(b, 255, 0.4))}`,
    primaryHex,
    `#${toHex(mix(r, 0, 0.25))}${toHex(mix(g, 0, 0.25))}${toHex(mix(b, 0, 0.25))}`,
    `#${toHex(mix(r, 0, 0.5))}${toHex(mix(g, 0, 0.5))}${toHex(mix(b, 0, 0.5))}`,
  ]
}

function recommendTemplate(mcq: MCQAnswer): string {
  if (mcq.building === 'marketing') return 'landing-page'
  if (mcq.building === 'internal') return 'ops-pilot'
  return 'saas-starter'
}

function generateLocalTasks(
  mcq: MCQAnswer,
  summary: PlanModePayload['summary'] | null,
): Array<{ id: string; title: string; role: string }> {
  const tasks: Array<{ id: string; title: string; role: string }> = [
    { id: 't1', title: 'Set up brand identity (colors, voice, logo)', role: 'Designer' },
    { id: 't2', title: 'Design login + signup screens', role: 'Designer' },
    { id: 't3', title: 'Create component library (buttons, inputs, cards)', role: 'Designer' },
    { id: 't4', title: 'Define data model for core entities', role: 'BA' },
    { id: 't5', title: 'Draft product requirements document', role: 'PM' },
    { id: 't6', title: 'Scaffold frontend app shell', role: 'Frontend' },
    { id: 't7', title: 'Set up authentication backend', role: 'Backend' },
    { id: 't8', title: 'Write test plan for MVP features', role: 'QA' },
  ]
  if (summary) {
    summary.features.filter((f) => f.priority === 'must').forEach((f, i) =>
      tasks.push({ id: `f${i}`, title: `Build feature: ${f.name}`, role: 'Frontend' }),
    )
  }
  return tasks
}
