'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, CheckCircle2, GitBranch, ArrowRight, Wand2 } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

// ── Target structure options ──────────────────────────────────────────────
type TargetStructure =
  | 'product_plan'
  | 'feature_breakdown'
  | 'entity_schema'
  | 'workflow'
  | 'journey_map'
  | 'page_layout'
  | 'component_tree'
  | 'brand_system'

const STRUCTURES: { key: TargetStructure; label: string; hint: string }[] = [
  { key: 'product_plan',       label: 'Product Plan',       hint: 'Modules, features, entities, journeys' },
  { key: 'feature_breakdown',  label: 'Features',           hint: 'Feature list with pages and components' },
  { key: 'entity_schema',      label: 'Data Model',         hint: 'Entities, fields, and relationships' },
  { key: 'workflow',           label: 'Workflow',           hint: 'Steps, triggers, and actions' },
  { key: 'journey_map',        label: 'User Journey',       hint: 'Steps and touchpoints' },
  { key: 'page_layout',        label: 'Pages',              hint: 'Routes, layouts, components' },
  { key: 'component_tree',     label: 'Components',         hint: 'UI components and variants' },
  { key: 'brand_system',       label: 'Brand System',       hint: 'Tokens, colors, typography' },
]

const EXAMPLE_PROMPTS: Record<TargetStructure, string> = {
  product_plan:      'A SaaS project management tool with teams, tasks, and real-time collaboration',
  feature_breakdown: 'User authentication with login, signup, OAuth, password reset, and MFA',
  entity_schema:     'E-commerce platform with products, orders, customers, reviews, and inventory',
  workflow:          'New user onboarding: email verification → profile setup → team invite → tutorial',
  journey_map:       'Customer buying journey from discovery through checkout and post-purchase support',
  page_layout:       'Marketing website with landing page, pricing, docs, blog, and dashboard app',
  component_tree:    'Design system with buttons, forms, modals, tables, charts, and navigation',
  brand_system:      'Modern fintech brand with color tokens, typography scale, and spacing system',
}

// ── Animated counter ──────────────────────────────────────────────────────
function Counter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setVal(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return <>{val}</>
}

// ── Building animation ────────────────────────────────────────────────────
function BuildingState({ prompt }: { prompt: string }) {
  const steps = [
    'Reading your description…',
    'Planning node structure…',
    'Generating graph scaffold…',
    'Writing nodes to database…',
    'Connecting edges…',
  ]
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1))
    }, 1400)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4 text-center">
      {/* Spinning sparkle */}
      <div className="relative w-16 h-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <svg width={64} height={64}>
            <circle cx={32} cy={32} r={28} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth={3} />
            <circle
              cx={32} cy={32} r={28}
              fill="none"
              stroke="url(#spin-grad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="44 132"
            />
            <defs>
              <linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0} />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={22} className="text-[var(--accent)]" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Building your graph…</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-[11px] text-[var(--text-tertiary)]"
          >
            {steps[stepIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i <= stepIdx ? 6 : 4,
              height: i <= stepIdx ? 6 : 4,
              backgroundColor: i <= stepIdx ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] max-w-[240px] leading-relaxed">
        "{prompt.length > 80 ? prompt.slice(0, 80) + '…' : prompt}"
      </p>
    </div>
  )
}

// ── Done state ────────────────────────────────────────────────────────────
function DoneState({
  nodesCreated,
  edgesCreated,
  summary,
  isFallback,
  onViewGraph,
  onClose,
}: {
  nodesCreated: number
  edgesCreated: number
  summary: string
  isFallback: boolean
  onViewGraph: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.4 }}
        className="w-14 h-14 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center"
      >
        <CheckCircle2 size={28} className="text-[var(--color-success)]" />
      </motion.div>

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Graph generated!</p>
        <p className="text-[11px] text-[var(--text-tertiary)] max-w-[260px] leading-relaxed">{summary}</p>
      </div>

      {/* Stats tiles */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <span className="text-[24px] font-bold text-[var(--text-primary)]">
            <Counter target={nodesCreated} />
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
            <GitBranch size={10} /> nodes
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <span className="text-[24px] font-bold text-[var(--text-primary)]">
            <Counter target={edgesCreated} />
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">edges</span>
        </div>
      </div>

      {isFallback && (
        <p className="text-[10px] text-[var(--color-warning)]/70 bg-[var(--color-warning)]/08 border border-[var(--color-warning)]/20 rounded-lg px-3 py-1.5 max-w-[280px]">
          Demo mode — add ANTHROPIC_API_KEY for AI-generated graphs
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onViewGraph}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors"
        >
          View in Graph <ArrowRight size={13} />
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────
interface AIScaffoldModalProps {
  productId: string
  onClose: () => void
  onSuccess: () => void  // called after graph is written — triggers refetch
}

export function AIScaffoldModal({ productId, onClose, onSuccess }: AIScaffoldModalProps) {
  const [structure, setStructure] = useState<TargetStructure>('product_plan')
  const [prompt, setPrompt] = useState('')
  const [step, setStep] = useState<'compose' | 'building' | 'done'>('compose')
  const [result, setResult] = useState<{
    nodesCreated: number; edgesCreated: number; summary: string; isFallback: boolean
  } | null>(null)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const mutation = trpc.ai.scaffoldAndApply.useMutation({
    onSuccess: (data) => {
      setResult({
        nodesCreated: data.nodesCreated,
        edgesCreated: data.edgesCreated,
        summary: data.summary,
        isFallback: data.model === 'fallback',
      })
      setStep('done')
      onSuccess()
    },
    onError: (err) => {
      setStep('compose')
      setError(err.message)
    },
  })

  const handleGenerate = () => {
    if (!prompt.trim()) { setError('Describe your product first'); return }
    setError('')
    setStep('building')
    mutation.mutate({ productId, prompt: prompt.trim(), targetStructure: structure })
  }

  const useExample = () => {
    setPrompt(EXAMPLE_PROMPTS[structure])
    setError('')
    textareaRef.current?.focus()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
        className="w-[500px] rounded-2xl border border-white/[0.1] bg-[#0D1117]/96 backdrop-blur shadow-2xl shadow-black/70 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
              <Wand2 size={14} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">AI: Generate Graph</h2>
              <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">Describe your product — AI builds the graph</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {step === 'compose' && (
            <motion.div
              key="compose"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 p-5"
            >
              {/* Structure selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Generate a…</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {STRUCTURES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { setStructure(s.key); setPrompt('') }}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-medium text-left transition-all leading-tight ${
                        s.key === structure
                          ? 'bg-[var(--accent)]/18 text-[var(--accent)] ring-1 ring-[var(--accent)]/35'
                          : 'bg-white/[0.03] text-[var(--text-tertiary)] hover:bg-white/[0.06] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                  {STRUCTURES.find((s) => s.key === structure)?.hint}
                </p>
              </div>

              {/* Prompt textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Description</label>
                  <button
                    onClick={useExample}
                    className="text-[10px] text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    Use example
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setError('') }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
                  }}
                  placeholder={`e.g. ${EXAMPLE_PROMPTS[structure]}`}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--accent)]/40 focus:ring-1 focus:ring-[var(--accent)]/20 leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  {error ? (
                    <span className="text-[11px] text-red-400">{error}</span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {prompt.length > 0 ? `${prompt.length} chars` : 'Be as specific as you like'}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-tertiary)]">⌘↵ to generate</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed max-w-[240px]">
                  AI will generate nodes and edges and add them to your graph
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles size={13} />
                  Generate
                </button>
              </div>
            </motion.div>
          )}

          {step === 'building' && (
            <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BuildingState prompt={prompt} />
            </motion.div>
          )}

          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DoneState
                nodesCreated={result.nodesCreated}
                edgesCreated={result.edgesCreated}
                summary={result.summary}
                isFallback={result.isFallback}
                onViewGraph={() => { onSuccess(); onClose() }}
                onClose={onClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
