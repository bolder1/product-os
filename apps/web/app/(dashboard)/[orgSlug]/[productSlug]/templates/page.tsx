'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutTemplate, Search, X, Layers, GitBranch, Palette, Settings,
  Zap, Box, Loader2, CheckCircle2, FileText, Sparkles, ArrowRight,
  Hash, Type, ToggleLeft, ChevronRight, Plus, Minus, Save, Tag,
} from 'lucide-react'
import { trpcMutate, trpcQuery } from '../../../../lib/api'
import { trpc } from '../../../../lib/trpc'
import { useProduct } from '../layout'
import { useGraphStore } from '../../../../lib/graph-store'
import { ConflictPreviewStep, type ConflictItem, type ConflictResolution } from './_components/conflict-preview'
import { AIRemixPanel } from './_components/ai-remix-panel'
import { TemplateBasket, type BasketItem } from './_components/template-basket'
import { SaveAsTemplateModal } from './_components/save-template-modal'

/* ------------------------------------------------------------------ */
/*  Types (exported so sub-components can import)                      */
/* ------------------------------------------------------------------ */

export type Category = 'All' | 'saas' | 'mobile' | 'ecommerce' | 'marketing' | 'design_system' | 'internal_ops' | 'custom' | 'my_templates'

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'color' | 'boolean' | 'number' | 'select'
  default: unknown
  options?: string[]
  description?: string
}

interface BundleNodeSample {
  kind: string
  label: string
}

export interface BundleManifest {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  version: string
  author: string
  nodeCount: number
  edgeCount: number
  variables: TemplateVariable[]
  nodeKinds: string[]
  nodeSample: BundleNodeSample[]
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'All',           label: 'All'           },
  { key: 'saas',          label: 'SaaS'          },
  { key: 'mobile',        label: 'Mobile'        },
  { key: 'design_system', label: 'Design System' },
  { key: 'internal_ops',  label: 'Internal Ops'  },
  { key: 'marketing',     label: 'Marketing'     },
  { key: 'ecommerce',     label: 'E-Commerce'    },
  { key: 'my_templates',  label: 'My Templates'  },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  saas:          <GitBranch className="w-3 h-3" />,
  mobile:        <Box className="w-3 h-3" />,
  design_system: <Palette className="w-3 h-3" />,
  internal_ops:  <Settings className="w-3 h-3" />,
  marketing:     <Zap className="w-3 h-3" />,
  ecommerce:     <FileText className="w-3 h-3" />,
  custom:        <Layers className="w-3 h-3" />,
  my_templates:  <Save className="w-3 h-3" />,
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  saas:          'from-blue-500/20 to-violet-500/10',
  mobile:        'from-emerald-500/20 to-teal-500/10',
  design_system: 'from-pink-500/20 to-rose-500/10',
  internal_ops:  'from-amber-500/20 to-orange-500/10',
  marketing:     'from-cyan-500/20 to-sky-500/10',
  ecommerce:     'from-purple-500/20 to-indigo-500/10',
  custom:        'from-slate-500/20 to-slate-700/10',
  my_templates:  'from-teal-500/20 to-cyan-500/10',
}

const KIND_COLORS: Record<string, string> = {
  module:    '#3B82F6',
  feature:   '#8B5CF6',
  page:      '#10B981',
  entity:    '#F59E0B',
  workflow:  '#06B6D4',
  token:     '#EC4899',
  component: '#F97316',
  journey:   '#64748B',
}

/* ------------------------------------------------------------------ */
/*  Variable input                                                     */
/* ------------------------------------------------------------------ */

function VariableField({
  variable, value, onChange,
}: {
  variable: TemplateVariable
  value: unknown
  onChange: (v: unknown) => void
}) {
  const Icon = variable.type === 'color' ? Palette : variable.type === 'boolean' ? ToggleLeft : Type

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-[#64748B]" />
        <label className="text-[11px] font-medium text-[var(--text-primary)]">{variable.label}</label>
        {variable.description && (
          <span className="text-[10px] text-[var(--text-tertiary)]">— {variable.description}</span>
        )}
      </div>
      {variable.type === 'boolean' ? (
        <button
          onClick={() => onChange(!value)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
            value
              ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-text)]'
              : 'border-white/[0.08] bg-white/[0.03] text-[var(--text-tertiary)]'
          }`}
        >
          <div className={`w-7 h-3.5 rounded-full transition-colors ${value ? 'bg-[var(--accent)]' : 'bg-white/[0.12]'} relative`}>
            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
          </div>
          {value ? 'Enabled' : 'Disabled'}
        </button>
      ) : variable.type === 'color' ? (
        <div className="flex items-center gap-2">
          <input type="color" value={String(value ?? variable.default ?? '#3B82F6')} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-md cursor-pointer border border-white/[0.08] bg-transparent" />
          <input type="text" value={String(value ?? variable.default ?? '#3B82F6')} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]/40" />
        </div>
      ) : variable.type === 'select' && variable.options ? (
        <select value={String(value ?? variable.default ?? '')} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40">
          {variable.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={variable.type === 'number' ? 'number' : 'text'}
          value={String(value ?? variable.default ?? '')}
          onChange={(e) => onChange(variable.type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
          placeholder={String(variable.default ?? '')}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Enhanced Template card                                             */
/* ------------------------------------------------------------------ */

function TemplateCard({
  bundle, isInBasket, isApplied, onClick, onBasketToggle,
}: {
  bundle: BundleManifest
  isInBasket: boolean
  isApplied: boolean
  onClick: () => void
  onBasketToggle: (e: React.MouseEvent) => void
}) {
  const gradient = CATEGORY_GRADIENTS[bundle.category] ?? CATEGORY_GRADIENTS.custom
  const Icon = CATEGORY_ICONS[bundle.category] ?? <Layers className="w-3 h-3" />

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative text-left bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-active)] rounded-xl overflow-hidden transition-colors flex flex-col group"
    >
      {/* Applied badge */}
      {isApplied && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 text-[#6EE7B7] text-[9px] font-medium">
          <CheckCircle2 size={9} />
          Applied
        </div>
      )}

      {/* Gradient header — click opens preview */}
      <button onClick={onClick} className="text-left w-full">
        <div className={`h-16 bg-gradient-to-br ${gradient} flex items-end px-3 pb-2`}>
          <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1">
            {Icon}
            {bundle.category.replace(/_/g, ' ')}
          </span>
        </div>
      </button>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <button onClick={onClick} className="text-left">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{bundle.name}</h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-0.5">{bundle.description}</p>
        </button>

        {/* Tags */}
        {bundle.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {bundle.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[#64748B]">
                <Tag size={7} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Node kind pills */}
        <div className="flex items-center gap-1 flex-wrap mt-auto">
          {bundle.nodeKinds.slice(0, 4).map((kind) => (
            <span
              key={kind}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${KIND_COLORS[kind] ?? '#64748B'}18`, color: KIND_COLORS[kind] ?? '#94A3B8' }}
            >
              {kind}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
            <span>{bundle.nodeCount} nodes</span>
            {bundle.variables.length > 0 && (
              <span className="text-[var(--accent-text)]">{bundle.variables.length} vars</span>
            )}
            <span className="text-[#334155]">v{bundle.version}</span>
          </div>

          {/* Basket toggle */}
          <button
            onClick={onBasketToggle}
            title={isInBasket ? 'Remove from basket' : 'Add to basket'}
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-medium border transition-all ${
              isInBasket
                ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-text)]'
                : 'border-white/[0.08] text-[#64748B] hover:border-white/[0.18] hover:text-[#94A3B8] opacity-0 group-hover:opacity-100'
            }`}
          >
            {isInBasket ? <Minus size={9} /> : <Plus size={9} />}
            {isInBasket ? 'In basket' : 'Add'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Apply modal — 5 steps: preview → personalize → conflicts → applying → done  */
/* ------------------------------------------------------------------ */

type ApplyStep = 'preview' | 'personalize' | 'conflicts' | 'applying' | 'done'

interface ApplyProgress {
  nodesCreated: number
  edgesCreated: number
  bundleName: string
}

function ApplyModal({
  bundle, onClose, onSuccess, productId,
}: {
  bundle: BundleManifest
  onClose: () => void
  onSuccess: (result: ApplyProgress) => void
  productId: string
}) {
  const [step, setStep] = useState<ApplyStep>('preview')
  const [variableValues, setVariableValues] = useState<Record<string, unknown>>(
    Object.fromEntries(bundle.variables.map((v) => [v.key, v.default]))
  )
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({})
  const [conflictData, setConflictData] = useState<{
    totalNodes: number; newNodes: number; conflicts: ConflictItem[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ApplyProgress | null>(null)
  const [animStep, setAnimStep] = useState(0)
  const [showAIRemix, setShowAIRemix] = useState(false)

  const gradient = CATEGORY_GRADIENTS[bundle.category] ?? CATEGORY_GRADIENTS.custom

  // Conflict preview query — lazy, only fires when entering conflicts step
  const conflictsQuery = trpc.template.previewConflicts.useQuery(
    { bundleId: bundle.id, productId, variables: variableValues },
    { enabled: step === 'conflicts', staleTime: 0 },
  )

  // Sync conflict data when query resolves
  useEffect(() => {
    if (conflictsQuery.data && step === 'conflicts') {
      const data = conflictsQuery.data
      setConflictData({ totalNodes: data.totalNodes, newNodes: data.newNodes, conflicts: data.conflicts })
      // Default all conflicts to 'skip'
      setResolutions(
        Object.fromEntries(data.conflicts.map((c) => [c.templateNodeId, 'skip' as ConflictResolution]))
      )
    }
  }, [conflictsQuery.data, step])

  const handleGoToConflicts = useCallback(() => {
    setStep('conflicts')
  }, [])

  const handleApply = useCallback(async () => {
    setStep('applying')
    setError(null)
    const interval = setInterval(() => setAnimStep((s) => Math.min(s + 1, bundle.nodeCount)), Math.max(20, 1200 / bundle.nodeCount))

    try {
      const result = await trpcMutate<{
        bundleName: string; nodesCreated: number; edgesCreated: number
      }>('template.applyBuiltIn', {
        bundleId: bundle.id,
        productId,
        variables: variableValues,
        conflictResolutions: resolutions,
      })
      clearInterval(interval)
      setAnimStep(bundle.nodeCount)
      setProgress({ nodesCreated: result.nodesCreated, edgesCreated: result.edgesCreated, bundleName: result.bundleName })
      setStep('done')
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Apply failed')
      setStep('conflicts')
    }
  }, [bundle, productId, variableValues, resolutions])

  const STEPS: ApplyStep[] = ['preview', 'personalize', 'conflicts', 'applying']
  const STEP_LABELS: Record<ApplyStep, string> = {
    preview: 'Preview', personalize: 'Personalise', conflicts: 'Conflicts', applying: 'Applying', done: 'Done',
  }
  const currentStepIdx = STEPS.indexOf(step)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'applying') onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0B1120] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className={`h-20 bg-gradient-to-br ${gradient} flex items-end px-5 pb-3 shrink-0`}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">{bundle.category.replace(/_/g, ' ')}</p>
            <h2 className="text-[16px] font-bold text-white truncate">{bundle.name}</h2>
          </div>
          {step !== 'applying' && (
            <button onClick={onClose} className="p-1.5 rounded-lg bg-black/20 text-white/60 hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center px-5 py-2 gap-1 border-b border-white/[0.06] shrink-0 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                  s === step ? 'bg-[var(--accent)] text-white' :
                  i < currentStepIdx ? 'bg-[#10B981] text-white' : 'bg-white/[0.08] text-[#64748B]'
                }`}>{i + 1}</div>
                <span className={`text-[10px] ${s === step ? 'text-[var(--text-primary)]' : 'text-[#64748B]'}`}>{STEP_LABELS[s]}</span>
                {i < STEPS.length - 1 && <ChevronRight size={10} className="text-[#475569] ml-0.5" />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── Preview ── */}
            {step === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{bundle.description}</p>

                <div>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">What gets created</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bundle.nodeSample.map((n, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: KIND_COLORS[n.kind] ?? '#64748B' }} />
                        <span className="text-[11px] text-[var(--text-primary)] truncate">{n.label}</span>
                        <span className="text-[9px] text-[#64748B] ml-auto shrink-0">{n.kind}</span>
                      </div>
                    ))}
                    {bundle.nodeCount > 8 && (
                      <div className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.06]">
                        <span className="text-[10px] text-[#64748B]">+{bundle.nodeCount - 8} more nodes</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-[#64748B]">
                  <span className="flex items-center gap-1"><Layers size={10} />{bundle.nodeCount} nodes</span>
                  <span className="flex items-center gap-1"><Hash size={10} />{bundle.edgeCount} edges</span>
                  {bundle.variables.length > 0 && (
                    <span className="flex items-center gap-1 text-[var(--accent-text)]"><Settings size={10} />{bundle.variables.length} personalizable</span>
                  )}
                  <span className="flex items-center gap-1 text-[#475569]">v{bundle.version} · {bundle.author}</span>
                </div>

                {/* AI Remix toggle */}
                {bundle.variables.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => setShowAIRemix((p) => !p)}
                      className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors ${
                        showAIRemix ? 'text-[#C4B5FD]' : 'text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      <Sparkles size={11} />
                      {showAIRemix ? 'Hide AI Remix' : 'AI Remix this template'}
                    </button>
                    <AnimatePresence>
                      {showAIRemix && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <AIRemixPanel
                            bundleId={bundle.id}
                            productId={productId}
                            variables={bundle.variables}
                            currentValues={variableValues}
                            onApplySuggestions={(suggestions) => {
                              setVariableValues((prev) => ({ ...prev, ...suggestions }))
                              setShowAIRemix(false)
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Personalise ── */}
            {step === 'personalize' && (
              <motion.div key="personalize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                {bundle.variables.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-secondary)]">This template has no variables. Click Next to check for conflicts.</p>
                ) : (
                  <>
                    <p className="text-[12px] text-[var(--text-secondary)]">Personalise this template before applying it to your product.</p>
                    <div className="space-y-4">
                      {bundle.variables.map((v) => (
                        <VariableField
                          key={v.key}
                          variable={v}
                          value={variableValues[v.key]}
                          onChange={(val) => setVariableValues((prev) => ({ ...prev, [v.key]: val }))}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Conflicts ── */}
            {step === 'conflicts' && (
              <motion.div key="conflicts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {conflictsQuery.isLoading || !conflictData ? (
                  <div className="flex items-center justify-center gap-2 p-10 text-[#64748B]">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[11px]">Scanning for conflicts…</span>
                  </div>
                ) : (
                  <ConflictPreviewStep
                    bundleName={conflictData ? bundle.name : ''}
                    totalNodes={conflictData?.totalNodes ?? 0}
                    newNodes={conflictData?.newNodes ?? 0}
                    conflicts={conflictData?.conflicts ?? []}
                    resolutions={resolutions}
                    onResolutionChange={(id, res) => setResolutions((prev) => ({ ...prev, [id]: res }))}
                    onResolveAll={(res) =>
                      setResolutions(Object.fromEntries((conflictData?.conflicts ?? []).map((c) => [c.templateNodeId, res])))
                    }
                  />
                )}
                {error && (
                  <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">{error}</div>
                )}
              </motion.div>
            )}

            {/* ── Applying ── */}
            {step === 'applying' && (
              <motion.div key="applying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <motion.circle cx="32" cy="32" r="28" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - animStep / bundle.nodeCount)}
                      transition={{ ease: 'linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={18} className="text-[var(--accent-text)] animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Applying template…</p>
                  <p className="text-[11px] text-[#64748B] mt-1">Creating {animStep} / {bundle.nodeCount} nodes</p>
                </div>
              </motion.div>
            )}

            {/* ── Done ── */}
            {step === 'done' && progress && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center"
                >
                  <CheckCircle2 size={28} className="text-[#10B981]" />
                </motion.div>
                <div>
                  <p className="text-[16px] font-bold text-[var(--text-primary)]">{progress.bundleName} applied!</p>
                  <p className="text-[12px] text-[#64748B] mt-1">{progress.nodesCreated} nodes and {progress.edgesCreated} edges added to your product graph.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">{progress.nodesCreated}</p>
                    <p className="text-[10px] text-[#64748B]">Nodes created</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">{progress.edgesCreated}</p>
                    <p className="text-[10px] text-[#64748B]">Edges linked</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/[0.06] shrink-0">
          {step === 'preview' && (
            <>
              <button onClick={onClose} className="tool-btn text-[11px]">Cancel</button>
              <button
                onClick={() => bundle.variables.length > 0 ? setStep('personalize') : handleGoToConflicts()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                {bundle.variables.length > 0 ? 'Personalise' : 'Check Conflicts'}
                <ArrowRight size={12} />
              </button>
            </>
          )}
          {step === 'personalize' && (
            <>
              <button onClick={() => setStep('preview')} className="tool-btn text-[11px]">Back</button>
              <button
                onClick={handleGoToConflicts}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                Check Conflicts <ArrowRight size={12} />
              </button>
            </>
          )}
          {step === 'conflicts' && !conflictsQuery.isLoading && (
            <>
              <button onClick={() => setStep(bundle.variables.length > 0 ? 'personalize' : 'preview')} className="tool-btn text-[11px]">Back</button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Sparkles size={12} />
                Apply Template
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button onClick={onClose} className="tool-btn text-[11px]">Back to Templates</button>
              <button
                onClick={() => onSuccess(progress!)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#10B981] text-white text-[11px] font-medium hover:bg-[#059669] transition-colors"
              >
                View in Graph Explorer <ArrowRight size={12} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TemplateGalleryPage() {
  const params  = useParams<{ orgSlug: string; productSlug: string }>()
  const router  = useRouter()
  const product = useProduct()
  const productId = product?.id ?? ''

  // Graph store — to count nodes for "save as template"
  const allNodes = useGraphStore((s) => s.nodes)
  const productNodeCount = allNodes.filter((n) => n.productId === productId).length

  const [bundles, setBundles]           = useState<BundleManifest[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState<Category>('All')
  const [selectedBundle, setSelectedBundle] = useState<BundleManifest | null>(null)
  const [appliedIds, setAppliedIds]     = useState<Set<string>>(new Set())
  const [basket, setBasket]             = useState<BasketItem[]>([])
  const [basketBundleIdx, setBasketBundleIdx] = useState(0)  // for sequential apply-all
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savedName, setSavedName]       = useState<string | null>(null)

  // Load built-in bundles
  useEffect(() => {
    trpcQuery<BundleManifest[]>('template.listBuiltInBundles', {})
      .then((rows) => setBundles(rows))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = bundles
    if (category !== 'All' && category !== 'my_templates') result = result.filter((b) => b.category === category)
    if (category === 'my_templates') result = []  // placeholder; would load from DB
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q))
      )
    }
    return result
  }, [bundles, category, search])

  const handleSuccess = useCallback(() => {
    if (selectedBundle) setAppliedIds((prev) => new Set([...prev, selectedBundle.id]))
    setSelectedBundle(null)
    router.push(`/${params.orgSlug}/${params.productSlug}/graph-explorer?from=template`)
  }, [router, params, selectedBundle])

  const toggleBasket = useCallback((bundle: BundleManifest, e: React.MouseEvent) => {
    e.stopPropagation()
    setBasket((prev) => {
      const exists = prev.find((i) => i.id === bundle.id)
      if (exists) return prev.filter((i) => i.id !== bundle.id)
      return [...prev, { id: bundle.id, name: bundle.name, category: bundle.category, nodeCount: bundle.nodeCount }]
    })
  }, [])

  // Apply-all: open the modal for each bundle in sequence
  const handleApplyAll = useCallback(() => {
    if (basket.length === 0) return
    const first = bundles.find((b) => b.id === basket[0].id)
    if (first) { setBasketBundleIdx(0); setSelectedBundle(first) }
  }, [basket, bundles])

  const handleBasketItemSuccess = useCallback(() => {
    if (selectedBundle) setAppliedIds((prev) => new Set([...prev, selectedBundle.id]))
    const nextIdx = basketBundleIdx + 1
    if (nextIdx < basket.length) {
      const nextBundle = bundles.find((b) => b.id === basket[nextIdx].id)
      if (nextBundle) { setBasketBundleIdx(nextIdx); setSelectedBundle(nextBundle); return }
    }
    // All done
    setSelectedBundle(null)
    setBasket([])
    router.push(`/${params.orgSlug}/${params.productSlug}/graph-explorer?from=template`)
  }, [basket, basketBundleIdx, bundles, selectedBundle, router, params])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] flex items-center gap-2 px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] shrink-0">
        <LayoutTemplate className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">Template Gallery</span>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-1">{bundles.length} bundles</span>

        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />

        {/* Category tabs */}
        <div className="flex items-center overflow-x-auto gap-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`tool-tab py-1 px-2.5 text-[10px] whitespace-nowrap flex items-center gap-1 ${category === cat.key ? 'active' : ''}`}
            >
              {cat.key === 'my_templates' && <Save size={9} />}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Save as template */}
        {productNodeCount > 0 && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 tool-btn text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]"
            title="Save current product graph as a template"
          >
            <Save size={11} />
            Save as Template
          </button>
        )}

        {/* Basket */}
        <TemplateBasket
          items={basket}
          onRemove={(id) => setBasket((prev) => prev.filter((i) => i.id !== id))}
          onApplyAll={handleApplyAll}
        />

        {/* Search */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-workspace)] border border-[var(--border-default)] rounded-[var(--radius-sm)] w-44">
          <Search className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bundles..."
            className="tool-input flex-1 bg-transparent border-none p-0 text-[11px] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#475569] hover:text-[#94A3B8]">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ── Saved confirmation banner ── */}
      <AnimatePresence>
        {savedName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onAnimationComplete={() => setTimeout(() => setSavedName(null), 3000)}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border-b border-[#10B981]/20 text-[#6EE7B7] text-[11px] shrink-0"
          >
            <CheckCircle2 size={13} />
            <span>Template <strong>"{savedName}"</strong> saved to My Templates.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-[var(--text-tertiary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Loading templates…</span>
          </div>
        ) : category === 'my_templates' ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <Save className="w-7 h-7 text-[var(--text-tertiary)]" />
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">No saved templates yet</p>
            <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs">
              Build a product and click <strong>Save as Template</strong> in the toolbar to capture it as a reusable bundle.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <LayoutTemplate className="w-6 h-6 text-[var(--text-tertiary)]" />
            <p className="text-[12px] text-[var(--text-secondary)]">No templates match your filters</p>
            <button onClick={() => { setSearch(''); setCategory('All') }} className="text-[11px] text-[var(--accent-text)] hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filtered.map((bundle) => (
              <TemplateCard
                key={bundle.id}
                bundle={bundle}
                isInBasket={basket.some((i) => i.id === bundle.id)}
                isApplied={appliedIds.has(bundle.id)}
                onClick={() => setSelectedBundle(bundle)}
                onBasketToggle={(e) => toggleBasket(bundle, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Apply modal ── */}
      <AnimatePresence>
        {selectedBundle && productId && (
          <ApplyModal
            key={selectedBundle.id}
            bundle={selectedBundle}
            productId={productId}
            onClose={() => setSelectedBundle(null)}
            onSuccess={basket.length > 0 ? handleBasketItemSuccess : handleSuccess}
          />
        )}
      </AnimatePresence>

      {/* ── Save as Template modal ── */}
      {showSaveModal && productId && (
        <SaveAsTemplateModal
          productId={productId}
          nodeCount={productNodeCount}
          onClose={() => setShowSaveModal(false)}
          onSaved={(name) => { setSavedName(name); setShowSaveModal(false) }}
        />
      )}
    </div>
  )
}
