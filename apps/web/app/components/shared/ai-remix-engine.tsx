'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Wand2,
  Shuffle,
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
  preview: Record<string, string>
  confidence: number
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
  component: <Box className="w-3.5 h-3.5" />,
  color: <Palette className="w-3.5 h-3.5" />,
  typography: <Type className="w-3.5 h-3.5" />,
  layout: <Layout className="w-3.5 h-3.5" />,
  content: <FileText className="w-3.5 h-3.5" />,
  page: <Layout className="w-3.5 h-3.5" />,
}

/**
 * Mock LLM remix output. The hex literals in the `preview` payloads are the
 * user-facing *content* of each variation — distinct color swatches the user
 * is selecting between, not chrome applied to Product OS surfaces. They
 * represent what a real LLM would return and must stay literal. Wrapping
 * chrome (surrounding panel, buttons, labels) uses tokens everywhere else.
 */
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
          // eslint-disable-next-line no-hardcoded-hex -- mock LLM variation payload
          preview: { ...sourceProps, fontWeight: '700', background: '#4c8dff', color: '#ffffff', shadow: '0 4px 16px rgba(76,141,255,0.3)' },
          confidence: 88,
          tags: ['bold', 'high-contrast'],
        },
        {
          id: 'remix-c3',
          label: `${sourceLabel} — Muted`,
          description: 'Low-key surface with subtle background and quiet border.',
          preview: { ...sourceProps, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' },
          confidence: 85,
          tags: ['muted', 'subtle'],
        },
        {
          id: 'remix-c4',
          label: `${sourceLabel} — Outlined`,
          description: 'Transparent background with prominent border and icon emphasis.',
          // eslint-disable-next-line no-hardcoded-hex -- mock LLM variation payload
          preview: { ...sourceProps, background: 'transparent', border: '2px solid #4c8dff', color: '#4c8dff' },
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
          // eslint-disable-next-line no-hardcoded-hex -- mock LLM palette payload
          preview: { primary: '#4F46E5', secondary: '#3B82F6', accent: '#06B6D4', surface: 'rgba(255,255,255,0.03)' },
          confidence: 91,
          tags: ['cool', 'professional'],
        },
        {
          id: 'remix-cl2',
          label: 'Warmer Palette',
          description: 'Add warm undertones for approachability.',
          // eslint-disable-next-line no-hardcoded-hex -- mock LLM palette payload
          preview: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B', surface: 'rgba(255,255,255,0.04)' },
          confidence: 86,
          tags: ['warm', 'friendly'],
        },
        {
          id: 'remix-cl3',
          label: 'Monochrome',
          description: 'Single-hue palette with varying saturation and lightness.',
          // eslint-disable-next-line no-hardcoded-hex -- mock LLM palette payload
          preview: { primary: '#4c8dff', secondary: '#6da3ff', accent: '#a0c4ff', surface: 'rgba(76,141,255,0.05)' },
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
          description: 'Narrative structure with problem > solution > outcome flow.',
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
    setTimeout(() => handleGenerate(), 100)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[720px] max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">AI Remix Engine</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {request?.target ?? 'selection'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleGenerate}
              disabled={generating || !request}
              className="tool-btn text-[11px] disabled:opacity-40"
            >
              <Shuffle className="w-3 h-3" />
              Regenerate
            </button>
            <button onClick={onClose} className="tool-btn p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Source context */}
        {request && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-default)] text-[11px]">
            <span className="text-[var(--accent-text)]">{targetIcons[request.target]}</span>
            <span className="text-[var(--text-primary)] font-medium">{request.sourceLabel}</span>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[var(--text-secondary)]">
              {Object.keys(request.sourceProps).length} properties
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto p-3">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-5 h-5 text-[var(--accent-text)] animate-spin" />
              <div className="text-center">
                <p className="text-[12px] text-[var(--text-secondary)]">Generating variations...</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Analyzing patterns and creating smart alternatives
                </p>
              </div>
            </div>
          ) : variations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Wand2 className="w-5 h-5 text-[var(--text-tertiary)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">
                Select an element and click Remix to generate variations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {variations.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`text-left rounded-[var(--radius-md)] border p-3 transition-colors ${
                    selectedId === v.id
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5'
                      : 'border-[var(--border-default)] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-[12px] font-medium text-[var(--text-primary)]">{v.label}</h3>
                    <span className="tool-badge text-[var(--accent-text)]">
                      {v.confidence}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-2">
                    {v.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {v.tags.map((tag) => (
                      <span key={tag} className="tool-badge">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Property preview */}
                  <div className="mt-2 pt-2 border-t border-[var(--border-default)] space-y-0.5">
                    {Object.entries(v.preview).slice(0, 4).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--text-tertiary)] font-mono">{key}</span>
                        <span className="text-[var(--text-secondary)] font-mono truncate ml-2 max-w-[140px]">
                          {val}
                        </span>
                      </div>
                    ))}
                    {Object.keys(v.preview).length > 4 && (
                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        +{Object.keys(v.preview).length - 4} more
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with apply */}
        {selectedVariation && (
          <div className="border-t border-[var(--border-default)] px-3 h-[var(--topbar-h)] flex items-center justify-between shrink-0">
            <div className="text-[11px] text-[var(--text-secondary)]">
              Selected: <span className="text-[var(--text-primary)] font-medium">{selectedVariation.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedVariation.preview, null, 2))
                }}
                className="tool-btn text-[11px]"
              >
                <Copy className="w-3 h-3" />
                Copy Props
              </button>
              <button
                onClick={() => handleApply(selectedVariation)}
                className="tool-btn tool-btn-primary text-[11px]"
              >
                {appliedId === selectedVariation.id ? (
                  <>
                    <Check className="w-3 h-3" />
                    Applied
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Apply Variation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Compact trigger button for studios to open the remix engine */
export function RemixTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="tool-btn text-[11px]">
      <Wand2 className="w-3 h-3" />
      AI Remix
    </button>
  )
}
