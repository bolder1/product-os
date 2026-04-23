'use client'

import * as React from 'react'
import { Cpu, Coins, Zap, TrendingDown, Info } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * TokenEstimate — read-only presentation of a token estimate.
 *
 * Keeps the shape decoupled from `@product-os/ai` to avoid a package cycle.
 * The Cortex page transforms its estimate into this shape before rendering.
 */

export interface TokenEstimateStep {
  stepId: string
  label: string
  modelDisplay: string
  tokensP50: number
  costP50: number
}

export interface TokenEstimateAlternative {
  label: string
  description: string
  savingsPct: number
  qualityDeltaPct: number
  costP50: number
}

export interface TokenEstimateBudget {
  usedToday: number
  capToday: number
  projectedAfter: number
}

export interface TokenEstimateProps {
  title?: string
  steps: TokenEstimateStep[]
  totalTokensP50: number
  totalCostP50: number
  budget: TokenEstimateBudget
  alternatives: TokenEstimateAlternative[]
  confidence: number
  onApplyAlternative?: (alt: TokenEstimateAlternative) => void
  onRun?: () => void
  onBack?: () => void
  className?: string
}

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(n < 1 ? 3 : 2)}`
}

function fmtTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export function TokenEstimate({
  title = 'Estimate',
  steps,
  totalTokensP50,
  totalCostP50,
  budget,
  alternatives,
  confidence,
  onApplyAlternative,
  onRun,
  onBack,
  className,
}: TokenEstimateProps) {
  const pctUsed = Math.min(100, Math.round((budget.usedToday / budget.capToday) * 100))
  const pctAfter = Math.min(100, Math.round((budget.projectedAfter / budget.capToday) * 100))
  const overBudget = budget.projectedAfter > budget.capToday

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-[var(--text-tertiary)]" />
          <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">{title}</span>
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] flex items-center gap-1"
          title={`Confidence: ${Math.round(confidence * 100)}%`}
        >
          <Info size={10} />
          {confidence >= 0.7 ? 'high confidence' : confidence >= 0.4 ? 'medium confidence' : 'rough estimate'}
        </div>
      </div>

      {/* Routing table */}
      <div className="px-4 pt-3 pb-1">
        <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2">Routing</div>
        <div className="space-y-1.5">
          {steps.map((s) => (
            <div
              key={s.stepId}
              className="flex items-center gap-2 text-[var(--font-size-label)]"
            >
              <Cpu size={11} className="text-[var(--text-tertiary)] shrink-0" />
              <span className="flex-1 truncate text-[var(--text-secondary)]">{s.label}</span>
              <span className="text-[var(--text-tertiary)] text-[11px] shrink-0 w-20 text-right">
                {s.modelDisplay}
              </span>
              <span className="text-[var(--text-tertiary)] text-[11px] shrink-0 w-14 text-right tabular-nums">
                {fmtTokens(s.tokensP50)}
              </span>
              <span className="text-[var(--text-primary)] text-[11px] shrink-0 w-14 text-right tabular-nums font-medium">
                {fmtUsd(s.costP50)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-2.5 mt-1 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-inset)]">
        <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">Total</span>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">{fmtTokens(totalTokensP50)} tok</span>
          <span className="text-[var(--font-size-label)] font-semibold text-[var(--text-primary)] tabular-nums">
            {fmtUsd(totalCostP50)}
          </span>
        </div>
      </div>

      {/* Budget */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1.5">
          <span>
            Budget today: <span className="text-[var(--text-primary)] font-medium">{fmtUsd(budget.usedToday)}</span>
            {' '}of {fmtUsd(budget.capToday)} ({pctUsed}%)
          </span>
          <span className={cn(overBudget ? 'text-[var(--color-error)]' : 'text-[var(--text-tertiary)]')}>
            After: {pctAfter}%
          </span>
        </div>
        <div className="h-[6px] rounded-full bg-[var(--bg-inset)] overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)] opacity-70 transition-[width] duration-[var(--duration-base)] ease-[var(--ease-out)]"
            style={{ width: `${pctUsed}%` }}
          />
          <div
            className={cn(
              'absolute inset-y-0 bg-[var(--accent)] transition-[width,background-color] duration-[var(--duration-base)] ease-[var(--ease-out)]',
              overBudget ? 'bg-[var(--color-error)]' : '',
            )}
            style={{ left: `${pctUsed}%`, width: `${Math.max(0, pctAfter - pctUsed)}%` }}
          />
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2">
            Cheaper alternatives
          </div>
          <div className="space-y-1.5">
            {alternatives.map((alt) => (
              <button
                key={alt.label}
                type="button"
                onClick={() => onApplyAlternative?.(alt)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-left hover:bg-[var(--surface-hover)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]"
              >
                <TrendingDown size={11} className="text-[var(--color-success)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-[var(--text-primary)] font-medium truncate">
                    {alt.label}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {alt.description}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-[var(--color-success)] tabular-nums">-{alt.savingsPct}%</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] tabular-nums">{fmtUsd(alt.costP50)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {(onBack || onRun) && (
        <div className="px-4 py-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-[28px] px-3 rounded-[var(--radius-sm)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              Back
            </button>
          )}
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              className={cn(
                'h-[28px] px-3 rounded-[var(--radius-sm)] text-[11px] font-medium transition-colors flex items-center gap-1.5',
                overBudget
                  ? 'bg-[var(--color-error)] text-white hover:opacity-90'
                  : 'bg-[var(--accent)] text-white hover:opacity-90',
              )}
            >
              <Zap size={11} />
              {overBudget ? 'Run (over budget)' : 'Run'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
