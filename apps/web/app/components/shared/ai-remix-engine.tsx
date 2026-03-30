'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2,
  Shuffle,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  X,
  Zap,
  Palette,
  Type,
  Layout,
  Box,
  FileText,
  Loader2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RemixTarget = 'component' | 'color' | 'typography' | 'layout' | 'content' | 'page'

export interface RemixVariation {
  id: string
  label: string
  description: string
  preview: Record<string, string> // key-value pairs representing changed properties
  confidence: number // 0-100
  tags: string[]
}

export interface RemixRequest {
  target: RemixTarget
  sourceLabel: string
  sourceProps: Record<string, string>
  context?: string
}

interface AIRemixEngineProps {
  open: boolean
  onClose: () => void
  request: RemixRequest | null
  onApplyVariation?: (variation: RemixVariation) => void
}

// ---------------------------------------------------------------------------
// Mock AI generation (simulates LLM remix)
// ---------------------------------------------------------------------------

const targetIcons: Record<RemixTarget, React.ReactNode> = {
  component: <Box className="w-4 h-4" />,
  color: <Palette className="w-4 h-4" />,
  typography: <Type className="w-4 h-4" />,
  layout: <Layout className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  page: <Layout className="w-4 h-4" />,
}

function generateRemixVariations(req: RemixRequest): RemixVariation[] {
  const { target, sourceLabel, sourceProps } = req

  switch (target) {
    case 'component':
      return [
        {
          id: 'remix-c1',
          label: `${sourceLabel} — Minimal`,
          description: 'Stripped-down version with reduced padding, no shadow, subtle border.',
          preview: { ...sourceProps, padding: '8px 12px', shadow: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' },
          confidence: 92,
          tags: ['minimal', 'clean'],
        },
        {
          id: 'remix-c2',
          label: `${sourceLabel} — Bold`,
          description: 'High-contrast variant with stronger colors and larger font weight.',
          preview: { ...sourceProps, fontWeight: '700', background: '#6366F1', color: '#fff', shadow: '0 4px 16px rgba(99,102,241,0.3)' },
          confidence: 88,
          tags: ['bold', 'high-contrast'],
        },
        {
          id: 'remix-c3',
          label: `${sourceLabel} — Glassmorphism`,
          description: 'Frosted glass effect with backdrop blur and transparent background.',
          preview: { ...sourceProps, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' },
          confidence: 85,
          tags: ['glass', 'modern'],
        },
        {
          id: 'remix-c4',
          label: `${sourceLabel} — Outlined`,
          description: 'Transparent background with prominent border and icon emphasis.',
          preview: { ...sourceProps, background: 'transparent', border: '2px solid #6366F1', color: '#6366F1' },
          confidence: 90,
          tags: ['outline', 'lightweight'],
        },
      ]

    case 'color':
      return [
        {
          id: 'remix-cl1',
          label: 'Cooler Palette',
          description: 'Shift hues 20deg cooler for a more professional feel.',
          preview: { primary: '#4F46E5', secondary: '#3B82F6', accent: '#06B6D4', surface: 'rgba(255,255,255,0.03)' },
          confidence: 91,
          tags: ['cool', 'professional'],
        },
        {
          id: 'remix-cl2',
          label: 'Warmer Palette',
          description: 'Add warm undertones for approachability.',
          preview: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B', surface: 'rgba(255,255,255,0.04)' },
          confidence: 86,
          tags: ['warm', 'friendly'],
        },
        {
          id: 'remix-cl3',
          label: 'Monochrome',
          description: 'Single-hue palette with varying saturation and lightness.',
          preview: { primary: '#6366F1', secondary: '#818CF8', accent: '#A5B4FC', surface: 'rgba(99,102,241,0.05)' },
          confidence: 94,
          tags: ['mono', 'cohesive'],
        },
      ]

    case 'typography':
      return [
        {
          id: 'remix-t1',
          label: 'Compact',
          description: 'Tighter line-height and smaller headings for dense layouts.',
          preview: { h1: '1.75rem', h2: '1.375rem', body: '0.8125rem', lineHeight: '1.4' },
          confidence: 89,
          tags: ['compact', 'dense'],
        },
        {
          id: 'remix-t2',
          label: 'Spacious',
          description: 'Generous line-height and larger sizes for readability.',
          preview: { h1: '2.5rem', h2: '1.875rem', body: '1rem', lineHeight: '1.75' },
          confidence: 87,
          tags: ['spacious', 'readable'],
        },
        {
          id: 'remix-t3',
          label: 'Editorial',
          description: 'Serif headings with sans-serif body for editorial feel.',
          preview: { headingFont: 'Georgia, serif', bodyFont: 'Inter, sans-serif', h1: '2.25rem', lineHeight: '1.6' },
          confidence: 82,
          tags: ['editorial', 'serif'],
        },
      ]

    case 'layout':
      return [
        {
          id: 'remix-l1',
          label: 'Two-Column Split',
          description: 'Hero left, content right. Clean visual hierarchy.',
          preview: { layout: 'grid', columns: '2', gap: '2rem', heroPosition: 'left' },
          confidence: 93,
          tags: ['split', 'grid'],
        },
        {
          id: 'remix-l2',
          label: 'Centered Stack',
          description: 'Single-column centered layout with max-width constraint.',
          preview: { layout: 'flex', direction: 'column', maxWidth: '720px', align: 'center' },
          confidence: 90,
          tags: ['centered', 'focused'],
        },
        {
          id: 'remix-l3',
          label: 'Bento Grid',
          description: 'Asymmetric grid with varying cell sizes for visual interest.',
          preview: { layout: 'grid', columns: '3', rows: 'auto', template: '2fr 1fr 1fr' },
          confidence: 88,
          tags: ['bento', 'modern'],
        },
      ]

    case 'content':
    case 'page':
      return [
        {
          id: 'remix-ct1',
          label: 'Concise',
          description: 'Shortened copy focusing on key value props. Fewer words, more impact.',
          preview: { tone: 'concise', wordCount: '~50% less', style: 'punchy' },
          confidence: 91,
          tags: ['concise', 'punchy'],
        },
        {
          id: 'remix-ct2',
          label: 'Story-driven',
          description: 'Narrative structure with problem → solution → outcome flow.',
          preview: { tone: 'narrative', structure: 'problem-solution-outcome', style: 'storytelling' },
          confidence: 85,
          tags: ['narrative', 'engaging'],
        },
        {
          id: 'remix-ct3',
          label: 'Data-led',
          description: 'Lead with metrics and social proof. Quantitative emphasis.',
          preview: { tone: 'analytical', leadWith: 'metrics', style: 'evidence-based' },
          confidence: 88,
          tags: ['data', 'metrics'],
        },
      ]

    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIRemixEngine({ open, onClose, request, onApplyVariation }: AIRemixEngineProps) {
  const [generating, setGenerating] = useState(false)
  const [variations, setVariations] = useState<RemixVariation[]>([])
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleGenerate = useCallback(() => {
    if (!request) return
    setGenerating(true)
    setVariations([])
    setAppliedId(null)
    setSelectedId(null)
    // Simulate AI generation delay
    setTimeout(() => {
      const results = generateRemixVariations(request)
      setVariations(results)
      setGenerating(false)
      if (results.length > 0) setSelectedId(results[0].id)
    }, 1200)
  }, [request])

  const handleApply = useCallback((v: RemixVariation) => {
    setAppliedId(v.id)
    onApplyVariation?.(v)
  }, [onApplyVariation])

  const selectedVariation = useMemo(
    () => variations.find((v) => v.id === selectedId) ?? null,
    [variations, selectedId]
  )

  // Auto-generate when opened with a new request
  const prevRequestRef = useState<RemixRequest | null>(null)
  if (open && request && request !== prevRequestRef[0]) {
    prevRequestRef[1](request)
    // Defer to avoid state update during render
    setTimeout(() => handleGenerate(), 100)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-[740px] max-h-[80vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center">
                <Wand2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">AI Remix Engine</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  Generate smart variations of your {request?.target ?? 'selection'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating || !request}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-[#818CF8] text-xs font-medium hover:bg-[#6366F1]/20 transition-colors disabled:opacity-40"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Regenerate
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Source context */}
          {request && (
            <div className="px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span className="text-[#6366F1]">{targetIcons[request.target]}</span>
                <span className="font-medium">{request.sourceLabel}</span>
                <ChevronRight className="w-3 h-3 text-[#475569]" />
                <span className="text-[#64748B]">
                  {Object.keys(request.sourceProps).length} properties
                </span>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-auto p-6">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                  <Sparkles className="w-4 h-4 text-[#EC4899] absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#94A3B8]">Generating variations...</p>
                  <p className="text-[0.6875rem] text-[#475569] mt-1">
                    Analyzing patterns and creating smart alternatives
                  </p>
                </div>
              </div>
            ) : variations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Wand2 className="w-8 h-8 text-[#475569]" />
                <p className="text-sm text-[#64748B]">
                  Select an element and click Remix to generate variations
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {variations.map((v) => (
                  <motion.button
                    key={v.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedId(v.id)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      selectedId === v.id
                        ? 'border-[#6366F1]/50 bg-[#6366F1]/5'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xs font-semibold text-[#F1F5F9]">{v.label}</h3>
                      <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full bg-[#6366F1]/10 text-[#818CF8]">
                        {v.confidence}% match
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-[#64748B] leading-relaxed mb-3">
                      {v.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {v.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#475569]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Property preview */}
                    <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1">
                      {Object.entries(v.preview).slice(0, 4).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-[0.625rem]">
                          <span className="text-[#475569] font-mono">{key}</span>
                          <span className="text-[#94A3B8] font-mono truncate ml-2 max-w-[140px]">
                            {val}
                          </span>
                        </div>
                      ))}
                      {Object.keys(v.preview).length > 4 && (
                        <p className="text-[0.5625rem] text-[#475569]">
                          +{Object.keys(v.preview).length - 4} more
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer with apply */}
          {selectedVariation && (
            <div className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between bg-white/[0.01]">
              <div className="text-xs text-[#94A3B8]">
                Selected: <span className="text-[#F1F5F9] font-medium">{selectedVariation.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedVariation.preview, null, 2))
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#94A3B8] text-xs hover:bg-white/[0.04] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy Props
                </button>
                <button
                  onClick={() => handleApply(selectedVariation)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#6366F1] text-white text-xs font-medium hover:bg-[#5558E6] transition-colors"
                >
                  {appliedId === selectedVariation.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Applied
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Apply Variation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/** Compact trigger button for studios to open the remix engine */
export function RemixTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#EC4899]/10 border border-[#6366F1]/20 text-[#818CF8] text-xs font-medium hover:from-[#6366F1]/20 hover:to-[#EC4899]/20 transition-all"
    >
      <Wand2 className="w-3.5 h-3.5" />
      AI Remix
    </button>
  )
}
