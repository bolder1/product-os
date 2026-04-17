'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutTemplate,
  Search,
  ChevronDown,
  X,
  Layers,
  GitBranch,
  Palette,
  Settings,
  Zap,
  Box,
  Loader2,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  Hash,
  Type,
  ToggleLeft,
  ChevronRight,
} from 'lucide-react'
import { trpcMutate, trpcQuery } from '../../../../lib/api'
import { useProduct } from '../layout'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = 'All' | 'saas' | 'mobile' | 'ecommerce' | 'marketing' | 'design_system' | 'internal_ops' | 'custom'

interface TemplateVariable {
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

interface BundleManifest {
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
  { key: 'All',          label: 'All'          },
  { key: 'saas',         label: 'SaaS'         },
  { key: 'mobile',       label: 'Mobile'       },
  { key: 'design_system',label: 'Design System'},
  { key: 'internal_ops', label: 'Internal Ops' },
  { key: 'marketing',    label: 'Marketing'    },
  { key: 'ecommerce',    label: 'E-Commerce'   },
]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  saas:         <GitBranch className="w-3 h-3" />,
  mobile:       <Box className="w-3 h-3" />,
  design_system:<Palette className="w-3 h-3" />,
  internal_ops: <Settings className="w-3 h-3" />,
  marketing:    <Zap className="w-3 h-3" />,
  ecommerce:    <FileText className="w-3 h-3" />,
  custom:       <Layers className="w-3 h-3" />,
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  saas:         'from-blue-500/20 to-violet-500/10',
  mobile:       'from-emerald-500/20 to-teal-500/10',
  design_system:'from-pink-500/20 to-rose-500/10',
  internal_ops: 'from-amber-500/20 to-orange-500/10',
  marketing:    'from-cyan-500/20 to-sky-500/10',
  ecommerce:    'from-purple-500/20 to-indigo-500/10',
  custom:       'from-slate-500/20 to-slate-700/10',
}

const KIND_COLORS: Record<string, string> = {
  module:   '#3B82F6',
  feature:  '#8B5CF6',
  page:     '#10B981',
  entity:   '#F59E0B',
  workflow: '#06B6D4',
  token:    '#EC4899',
  component:'#F97316',
  journey:  '#64748B',
}

/* ------------------------------------------------------------------ */
/*  Variable input component                                           */
/* ------------------------------------------------------------------ */

function VariableField({
  variable,
  value,
  onChange,
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
          <input
            type="color"
            value={String(value ?? variable.default ?? '#3B82F6')}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-md cursor-pointer border border-white/[0.08] bg-transparent"
          />
          <input
            type="text"
            value={String(value ?? variable.default ?? '#3B82F6')}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]/40"
          />
        </div>
      ) : variable.type === 'select' && variable.options ? (
        <select
          value={String(value ?? variable.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40"
        >
          {variable.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
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
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({ bundle, onClick }: { bundle: BundleManifest; onClick: () => void }) {
  const gradient = CATEGORY_GRADIENTS[bundle.category] ?? CATEGORY_GRADIENTS.custom
  const Icon = CATEGORY_ICONS[bundle.category] ?? <Layers className="w-3 h-3" />

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="text-left bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-active)] rounded-lg overflow-hidden transition-colors flex flex-col"
    >
      {/* Gradient header */}
      <div className={`h-16 bg-gradient-to-br ${gradient} flex items-end px-3 pb-2`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1">
            {Icon}
            {bundle.category.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{bundle.name}</h3>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{bundle.description}</p>

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

        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-default)]">
          <span>{bundle.nodeCount} nodes · {bundle.edgeCount} edges</span>
          {bundle.variables.length > 0 && (
            <span className="text-[var(--accent-text)]">{bundle.variables.length} vars</span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/*  Apply flow modal (preview → personalize → apply → done)           */
/* ------------------------------------------------------------------ */

type ApplyStep = 'preview' | 'personalize' | 'applying' | 'done'

interface ApplyProgress {
  nodesCreated: number
  edgesCreated: number
  bundleName: string
}

function ApplyModal({
  bundle,
  onClose,
  onSuccess,
  productId,
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
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ApplyProgress | null>(null)
  const [animStep, setAnimStep] = useState(0)

  const gradient = CATEGORY_GRADIENTS[bundle.category] ?? CATEGORY_GRADIENTS.custom

  const handleApply = useCallback(async () => {
    setStep('applying')
    setError(null)

    // Animate steps
    const interval = setInterval(() => {
      setAnimStep((s) => Math.min(s + 1, bundle.nodeCount))
    }, Math.max(20, 1200 / bundle.nodeCount))

    try {
      const result = await trpcMutate<{
        bundleName: string
        nodesCreated: number
        edgesCreated: number
      }>('template.applyBuiltIn', {
        bundleId: bundle.id,
        productId,
        variables: variableValues,
      })
      clearInterval(interval)
      setAnimStep(bundle.nodeCount)
      setProgress({ nodesCreated: result.nodesCreated, edgesCreated: result.edgesCreated, bundleName: result.bundleName })
      setStep('done')
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Apply failed')
      setStep('personalize')
    }
  }, [bundle, productId, variableValues])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'applying') onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0B1120] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className={`h-20 bg-gradient-to-br ${gradient} flex items-end px-5 pb-3 shrink-0`}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">{bundle.category.replace('_', ' ')}</p>
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
          <div className="flex px-5 py-2 gap-2 border-b border-white/[0.06] shrink-0">
            {(['preview', 'personalize', 'applying'] as ApplyStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center transition-colors ${
                  s === step ? 'bg-[var(--accent)] text-white' :
                  ['preview', 'personalize', 'applying'].indexOf(s) < ['preview', 'personalize', 'applying'].indexOf(step)
                    ? 'bg-[#10B981] text-white' : 'bg-white/[0.08] text-[#64748B]'
                }`}>{i + 1}</div>
                <span className={`text-[10px] capitalize ${s === step ? 'text-[var(--text-primary)]' : 'text-[#64748B]'}`}>{s}</span>
                {i < 2 && <ChevronRight size={10} className="text-[#475569]" />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{bundle.description}</p>

                {/* Node kind breakdown */}
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">What gets created</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bundle.nodeSample.map((n, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: KIND_COLORS[n.kind] ?? '#64748B' }}
                        />
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
                    <span className="flex items-center gap-1 text-[var(--accent-text)]">
                      <Settings size={10} />{bundle.variables.length} personalizable
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'personalize' && (
              <motion.div key="personalize" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-4">
                {bundle.variables.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-secondary)]">This template has no variables. Click Apply to proceed.</p>
                ) : (
                  <>
                    <p className="text-[12px] text-[var(--text-secondary)]">Personalize this template before applying it to your product.</p>
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
                {error && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">{error}</div>
                )}
              </motion.div>
            )}

            {step === 'applying' && (
              <motion.div key="applying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <motion.circle
                      cx="32" cy="32" r="28"
                      fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
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
                  <p className="text-[12px] text-[#64748B] mt-1">
                    {progress.nodesCreated} nodes and {progress.edgesCreated} edges added to your product graph.
                  </p>
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

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-white/[0.06] shrink-0">
          {step === 'preview' && (
            <>
              <button onClick={onClose} className="tool-btn text-[11px]">Cancel</button>
              <button
                onClick={() => bundle.variables.length > 0 ? setStep('personalize') : handleApply()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                {bundle.variables.length > 0 ? 'Personalize' : 'Apply Template'}
                <ArrowRight size={12} />
              </button>
            </>
          )}
          {step === 'personalize' && (
            <>
              <button onClick={() => setStep('preview')} className="tool-btn text-[11px]">Back</button>
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
                View in Graph Explorer
                <ArrowRight size={12} />
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
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()
  const product = useProduct()

  const [bundles, setBundles] = useState<BundleManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [selectedBundle, setSelectedBundle] = useState<BundleManifest | null>(null)

  // Load built-in bundles from registry (no DB seed needed)
  useEffect(() => {
    trpcQuery<BundleManifest[]>('template.listBuiltInBundles', {})
      .then((rows) => setBundles(rows))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = bundles
    if (category !== 'All') result = result.filter((b) => b.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.includes(q)),
      )
    }
    return result
  }, [bundles, category, search])

  const handleSuccess = useCallback(() => {
    setSelectedBundle(null)
    router.push(`/${params.orgSlug}/${params.productSlug}/graph-explorer?from=template`)
  }, [router, params])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] flex items-center gap-2 px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] shrink-0">
        <LayoutTemplate className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">Template Gallery</span>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-1">{bundles.length} bundles</span>

        <div className="w-px h-3.5 bg-[var(--border-default)] mx-2" />

        {/* Category tabs */}
        <div className="flex items-center overflow-x-auto gap-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`tool-tab py-1 px-2.5 text-[10px] whitespace-nowrap ${category === cat.key ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-workspace)] border border-[var(--border-default)] rounded-[var(--radius-sm)] w-44">
          <Search className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bundles..."
            className="tool-input flex-1 bg-transparent border-none p-0 text-[11px] outline-none"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-[var(--text-tertiary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Loading templates…</span>
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
              <TemplateCard key={bundle.id} bundle={bundle} onClick={() => setSelectedBundle(bundle)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Apply modal ── */}
      <AnimatePresence>
        {selectedBundle && product?.id && (
          <ApplyModal
            bundle={selectedBundle}
            productId={product.id}
            onClose={() => setSelectedBundle(null)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
