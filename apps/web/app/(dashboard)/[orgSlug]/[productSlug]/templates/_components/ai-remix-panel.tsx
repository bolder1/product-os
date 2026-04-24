'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'
import type { TemplateVariable } from '../page'

interface Props {
  bundleId: string
  productId: string
  variables: TemplateVariable[]
  currentValues: Record<string, unknown>
  onApplySuggestions: (suggestions: Record<string, unknown>) => void
}

const REMIX_PRESETS = [
  'Make this a fintech app for enterprise teams',
  'Scale down to a lean MVP with 3 core features',
  'Adapt for a mobile-first consumer app',
  'Reframe for an internal ops / admin tool',
  'Make it e-commerce focused',
]

export function AIRemixPanel({ bundleId, productId, variables, currentValues, onApplySuggestions }: Props) {
  const [prompt, setPrompt] = useState('')
  const [suggestions, setSuggestions] = useState<Record<string, unknown> | null>(null)
  const [rawResponse, setRawResponse] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [applied, setApplied] = useState(false)

  const remixMutation = trpc.template.remixWithAI.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions)
      setRawResponse(data.rawResponse)
      setApplied(false)
    },
  })

  const handleRemix = () => {
    if (!prompt.trim()) return
    setSuggestions(null)
    setApplied(false)
    remixMutation.mutate({ bundleId, productId, prompt: prompt.trim() })
  }

  const handleApply = () => {
    if (!suggestions) return
    onApplySuggestions(suggestions)
    setApplied(true)
  }

  const changedVars = suggestions
    ? variables.filter(
        (v) =>
          suggestions[v.key] !== undefined &&
          String(suggestions[v.key]) !== String(currentValues[v.key] ?? v.default),
      )
    : []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Sparkles size={12} className="text-[var(--accent)]" />
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">AI Remix</span>
        <span className="text-[9px] text-[var(--text-tertiary)] ml-1">Describe your context — AI adapts the variables</span>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {REMIX_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setPrompt(preset)}
            className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${
              prompt === preset
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-white/[0.08] text-[var(--text-tertiary)] hover:border-white/[0.18] hover:text-[var(--text-secondary)]'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your product context, vertical, or scale..."
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]/40 resize-none"
        />
        <button
          onClick={handleRemix}
          disabled={!prompt.trim() || remixMutation.isPending}
          className="px-3 py-2 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-medium hover:bg-[var(--accent)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0 self-start"
        >
          {remixMutation.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Remix
        </button>
      </div>

      {/* Error */}
      {remixMutation.isError && (
        <p className="text-[10px] text-red-400 px-1">{remixMutation.error.message}</p>
      )}

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3 space-y-2.5"
          >
            {changedVars.length === 0 ? (
              <p className="text-[10px] text-[var(--text-tertiary)] text-center py-1">
                AI found no variable changes for this prompt. Try being more specific.
              </p>
            ) : (
              <>
                <p className="text-[10px] font-medium text-[var(--accent)]">
                  AI suggests {changedVars.length} change{changedVars.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-1.5">
                  {changedVars.map((v) => (
                    <div key={v.key} className="flex items-center gap-2 text-[10px]">
                      <span className="text-[var(--text-tertiary)] w-28 shrink-0 truncate">{v.label}</span>
                      <span className="text-[var(--text-tertiary)] line-through truncate max-w-[80px]">
                        {String(currentValues[v.key] ?? v.default)}
                      </span>
                      <span className="text-[var(--accent)] font-medium truncate max-w-[100px]">
                        {String(suggestions[v.key])}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApply}
                    disabled={applied}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      applied
                        ? 'bg-[var(--color-success)]/20 border border-[var(--color-success)]/30 text-[#6EE7B7]'
                        : 'bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/30'
                    }`}
                  >
                    {applied ? <Check size={11} /> : <Sparkles size={11} />}
                    {applied ? 'Applied!' : 'Apply suggestions'}
                  </button>
                  {applied && (
                    <button
                      onClick={() => { setSuggestions(null); setPrompt('') }}
                      className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <RotateCcw size={10} />
                      Reset
                    </button>
                  )}
                </div>
              </>
            )}

            {rawResponse && (
              <div>
                <button
                  onClick={() => setShowRaw((p) => !p)}
                  className="flex items-center gap-1 text-[9px] text-[var(--text-tertiary)] hover:text-[var(--text-tertiary)] transition-colors"
                >
                  {showRaw ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  {showRaw ? 'Hide' : 'Show'} raw AI response
                </button>
                {showRaw && (
                  <pre className="mt-1.5 text-[9px] text-[var(--text-tertiary)] bg-black/20 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                    {rawResponse}
                  </pre>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
