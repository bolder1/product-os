'use client'

import * as React from 'react'
import { Sparkles, Coins, ArrowLeft, Zap, X } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * PromptGate — pre-flight surface for every prompt submission.
 *
 * Renders three views:
 *   • raw      — the user's prompt with three options (Enhance / Estimate / Send)
 *   • enhanced — side-by-side diff + editable variables
 *   • estimate — slot for a TokenEstimate component
 *
 * Headless by design — all state is owned by the caller via props. The
 * prompt-gate-store in the web app wires this to the enhancer + estimator.
 */

export interface PromptGateVariable {
  name: string
  value: string
  choices?: string[]
}

export interface PromptGateDiffSegment {
  op: 'equal' | 'insert' | 'delete'
  text: string
}

export interface PromptGateProps {
  open: boolean
  view: 'raw' | 'enhanced' | 'estimate'
  raw: string
  enhanced?: string
  diff?: PromptGateDiffSegment[]
  variables?: PromptGateVariable[]
  strategiesApplied?: string[]
  /** Slot for the TokenEstimate component. */
  estimateSlot?: React.ReactNode
  /** Working on enhancement/estimate (shows spinner). */
  busy?: boolean

  onEnhance: () => void
  onEstimate: () => void
  onSendRaw: () => void
  onBack: () => void
  onRunEnhanced: (finalPrompt: string, variables: Record<string, string>) => void
  onCancel: () => void
}

export function PromptGate(props: PromptGateProps) {
  const {
    open,
    view,
    raw,
    enhanced,
    diff,
    variables,
    strategiesApplied,
    estimateSlot,
    busy,
    onEnhance,
    onEstimate,
    onSendRaw,
    onBack,
    onRunEnhanced,
    onCancel,
  } = props

  const [varValues, setVarValues] = React.useState<Record<string, string>>({})

  // Seed variable defaults whenever the variables set changes.
  React.useEffect(() => {
    if (!variables) return
    const seed: Record<string, string> = {}
    for (const v of variables) seed[v.name] = v.value
    setVarValues(seed)
  }, [variables])

  // Keyboard: Esc to cancel, ⌘↵ to send as-is, ↵ to confirm when enhanced.
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        onSendRaw()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel, onSendRaw])

  const finalPrompt = React.useMemo(() => {
    if (!enhanced) return ''
    return enhanced.replace(/\{\{(\w+)\}\}/g, (_m, name: string) => varValues[name] ?? `{{${name}}}`)
  }, [enhanced, varValues])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Prompt gate"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[560px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)]">
          {view !== 'raw' && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">
            {view === 'raw' && 'Your prompt'}
            {view === 'enhanced' && 'Enhanced prompt'}
            {view === 'estimate' && 'Cost estimate'}
          </span>
          <span className="ml-auto flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
            <kbd className="px-1 py-0.5 rounded border border-[var(--border-subtle)]">⌘↵</kbd>
            <span>Send as-is</span>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-[var(--radius-xs)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </span>
        </div>

        {/* Body */}
        <div className="p-4">
          {view === 'raw' && (
            <RawView raw={raw} busy={busy} onEnhance={onEnhance} onEstimate={onEstimate} onSendRaw={onSendRaw} />
          )}
          {view === 'enhanced' && (
            <EnhancedView
              raw={raw}
              enhanced={enhanced ?? ''}
              diff={diff ?? []}
              variables={variables ?? []}
              varValues={varValues}
              setVarValues={setVarValues}
              strategiesApplied={strategiesApplied ?? []}
              finalPrompt={finalPrompt}
              onRunEnhanced={() => onRunEnhanced(finalPrompt, varValues)}
              onUseOriginal={onSendRaw}
              onEstimate={onEstimate}
            />
          )}
          {view === 'estimate' && estimateSlot}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function RawView({
  raw,
  busy,
  onEnhance,
  onEstimate,
  onSendRaw,
}: {
  raw: string
  busy?: boolean
  onEnhance: () => void
  onEstimate: () => void
  onSendRaw: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2.5">
        <p className="text-[12px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
          {raw}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <GateButton
          icon={<Sparkles size={12} />}
          label="Enhance"
          sub="Rewrite clearer"
          tone="accent"
          onClick={onEnhance}
          disabled={busy}
        />
        <GateButton
          icon={<Coins size={12} />}
          label="Estimate"
          sub="Tokens & cost"
          onClick={onEstimate}
          disabled={busy}
        />
        <GateButton
          icon={<Zap size={12} />}
          label="Send as-is"
          sub="⌘↵"
          onClick={onSendRaw}
          disabled={busy}
        />
      </div>
    </div>
  )
}

function GateButton({
  icon,
  label,
  sub,
  tone = 'neutral',
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  tone?: 'neutral' | 'accent'
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-1 p-3 rounded-[var(--radius-sm)] border transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] text-left disabled:opacity-50',
        tone === 'accent'
          ? 'border-[var(--accent)] bg-[var(--accent-subtle)] hover:bg-[var(--accent)]/20 text-[var(--accent-text)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)]',
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium">
        {icon}
        {label}
      </span>
      <span className="text-[10px] text-[var(--text-tertiary)]">{sub}</span>
    </button>
  )
}

function EnhancedView({
  raw,
  enhanced,
  diff,
  variables,
  varValues,
  setVarValues,
  strategiesApplied,
  finalPrompt,
  onRunEnhanced,
  onUseOriginal,
  onEstimate,
}: {
  raw: string
  enhanced: string
  diff: PromptGateDiffSegment[]
  variables: PromptGateVariable[]
  varValues: Record<string, string>
  setVarValues: React.Dispatch<React.SetStateAction<Record<string, string>>>
  strategiesApplied: string[]
  finalPrompt: string
  onRunEnhanced: () => void
  onUseOriginal: () => void
  onEstimate: () => void
}) {
  const noChange = enhanced.trim() === raw.trim()
  return (
    <div className="flex flex-col gap-3">
      {noChange ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2.5">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            No enhancement opportunities found — your prompt is already specific.
          </p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-1.5">
              Rewritten
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-3 py-2.5 max-h-[140px] overflow-auto">
              <p className="text-[12px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words">
                {diff.length > 0 ? (
                  diff.map((seg, i) => (
                    <span
                      key={i}
                      className={cn(
                        seg.op === 'insert' && 'bg-[var(--color-success)]/15 text-[var(--color-success)] rounded-sm px-0.5',
                        seg.op === 'delete' && 'bg-[var(--color-error)]/15 text-[var(--color-error)] line-through rounded-sm px-0.5',
                      )}
                    >
                      {seg.text}
                    </span>
                  ))
                ) : (
                  enhanced
                )}
              </p>
            </div>
          </div>

          {variables.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-1.5">
                Variables
              </div>
              <div className="flex flex-col gap-1.5">
                {variables.map((v) => (
                  <div key={v.name} className="flex items-center gap-2">
                    <code className="text-[10px] text-[var(--text-tertiary)] shrink-0 w-[120px] truncate">
                      {`{{${v.name}}}`}
                    </code>
                    {v.choices && v.choices.length > 0 ? (
                      <select
                        value={varValues[v.name] ?? v.value}
                        onChange={(e) => setVarValues((s) => ({ ...s, [v.name]: e.target.value }))}
                        className="flex-1 h-[26px] px-2 rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)]"
                      >
                        {v.choices.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={varValues[v.name] ?? v.value}
                        onChange={(e) => setVarValues((s) => ({ ...s, [v.name]: e.target.value }))}
                        className="flex-1 h-[26px] px-2 rounded-[var(--radius-xs)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategiesApplied.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {strategiesApplied.map((s) => (
                <span
                  key={s}
                  className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onUseOriginal}
          className="h-[28px] px-3 rounded-[var(--radius-sm)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Use original
        </button>
        <button
          type="button"
          onClick={onEstimate}
          className="h-[28px] px-3 rounded-[var(--radius-sm)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-1.5"
        >
          <Coins size={11} />
          Estimate
        </button>
        <button
          type="button"
          onClick={onRunEnhanced}
          disabled={noChange}
          className="h-[28px] px-3 rounded-[var(--radius-sm)] text-[11px] font-medium bg-[var(--accent)] text-white hover:opacity-90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={11} />
          Run enhanced
        </button>
      </div>

      {/* Final prompt preview (only if variables present) */}
      {variables.length > 0 && finalPrompt !== enhanced && (
        <div className="rounded-[var(--radius-xs)] border border-dashed border-[var(--border-subtle)] px-2 py-1.5">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-1">Will send</div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words">
            {finalPrompt}
          </p>
        </div>
      )}
    </div>
  )
}
