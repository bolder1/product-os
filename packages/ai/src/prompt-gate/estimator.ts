/**
 * Token estimator.
 *
 * Consumes an `ExecutionPlan` and returns a `TokenEstimate` — per-step token
 * ranges, cost, budget projection, and cheaper alternatives.
 *
 * Estimation strategy:
 *   • Input tokens = tokenizer(prompt + retrieved + tool definitions)
 *   • Output tokens = usage-history median for (skillId, stepId, model), else
 *                     `inputTokens * pricing.outputPriorRatio`
 *   • p10/p90 = p50 × variance factor (widens for low-sample or cold starts)
 *   • Cost    = per-step pricing × token range
 *
 * Token counts from `approxChars` use a 4-chars-per-token approximation, which
 * is within ~10% of Claude's tokenizer for English prose and code. Swap for
 * `@anthropic-ai/tokenizer` in a later phase if we need tighter bounds.
 */

import type {
  Alternative,
  BudgetSnapshot,
  CostRange,
  ExecutionPlan,
  ExecutionStep,
  StepEstimate,
  TokenEstimate,
  TokenRange,
} from './types'
import { costOf, getPricing } from './pricing'
import { usageHistory, type UsageHistory } from './usage-history'

const CHARS_PER_TOKEN = 4
const TOOL_DEF_TOKENS = 180 // empirical per-tool overhead

export interface EstimatorOptions {
  /** Daily + monthly budget caps for the active user/product. */
  budget: {
    usedToday: number
    capToday: number
    usedThisMonth: number
    capThisMonth: number
  }
  /** Override the shared usage history (for tests). */
  history?: UsageHistory
  /** Multiplier on variance for cold-start steps. Default 0.6. */
  coldStartVariance?: number
  /** Multiplier on variance for warm steps. Default 0.2. */
  warmVariance?: number
}

export function estimate(plan: ExecutionPlan, opts: EstimatorOptions): TokenEstimate {
  const history = opts.history ?? usageHistory
  const cold = opts.coldStartVariance ?? 0.6
  const warm = opts.warmVariance ?? 0.2

  const stepEstimates: StepEstimate[] = plan.steps.map((step) =>
    estimateStep(plan.skillId, step, history, { cold, warm }),
  )

  const total = sumEstimates(stepEstimates)
  const projectedAfter = opts.budget.usedToday + total.cost.p50

  const budget: BudgetSnapshot = {
    usedToday: opts.budget.usedToday,
    capToday: opts.budget.capToday,
    projectedAfter,
    usedThisMonth: opts.budget.usedThisMonth,
    capThisMonth: opts.budget.capThisMonth,
  }

  const alternatives = buildAlternatives(plan, stepEstimates)
  const confidence = averageConfidence(plan, history)

  return {
    planId: `${plan.skillId}-${Date.now()}`,
    steps: stepEstimates,
    total,
    budget,
    alternatives,
    confidence,
    generatedAt: new Date().toISOString(),
  }
}

function estimateStep(
  skillId: string,
  step: ExecutionStep,
  history: UsageHistory,
  variance: { cold: number; warm: number },
): StepEstimate {
  const pricing = getPricing(step.model)
  const toolOverhead = step.toolCount * TOOL_DEF_TOKENS
  const inputP50 = Math.ceil(step.approxInputChars / CHARS_PER_TOKEN) + toolOverhead

  const stats = history.stats(skillId, step.id, step.model)
  const outputP50 = stats ? stats.outputMedian : inputP50 * pricing.outputPriorRatio
  const v = stats && stats.samples >= 5 ? variance.warm : variance.cold

  const inputTokens: TokenRange = {
    p10: Math.max(0, Math.round(inputP50 * (1 - v * 0.5))),
    p50: Math.round(inputP50),
    p90: Math.round(inputP50 * (1 + v * 0.5)),
  }
  const outputTokens: TokenRange = {
    p10: Math.max(0, Math.round(outputP50 * (1 - v))),
    p50: Math.round(outputP50),
    p90: Math.round(outputP50 * (1 + v)),
  }

  const cost: CostRange = {
    p10: costOf(step.model, inputTokens.p10, outputTokens.p10),
    p50: costOf(step.model, inputTokens.p50, outputTokens.p50),
    p90: costOf(step.model, inputTokens.p90, outputTokens.p90),
    currency: 'USD',
  }

  return {
    stepId: step.id,
    label: step.label,
    model: step.model,
    inputTokens,
    outputTokens,
    cost,
  }
}

function sumEstimates(steps: StepEstimate[]): TokenEstimate['total'] {
  const tokens: TokenRange = {
    p10: sum(steps.map((s) => s.inputTokens.p10 + s.outputTokens.p10)),
    p50: sum(steps.map((s) => s.inputTokens.p50 + s.outputTokens.p50)),
    p90: sum(steps.map((s) => s.inputTokens.p90 + s.outputTokens.p90)),
  }
  const cost: CostRange = {
    p10: sum(steps.map((s) => s.cost.p10)),
    p50: sum(steps.map((s) => s.cost.p50)),
    p90: sum(steps.map((s) => s.cost.p90)),
    currency: 'USD',
  }
  return { tokens, cost }
}

function buildAlternatives(plan: ExecutionPlan, base: StepEstimate[]): Alternative[] {
  const baseCost = sum(base.map((s) => s.cost.p50))
  const alts: Alternative[] = []

  // Alternative 1 — downgrade every non-embedding step to Haiku.
  const haikuSteps = plan.steps.map((s): ExecutionStep => (
    s.model === 'voyage-3' || s.model === 'text-embedding-3-small'
      ? s
      : { ...s, model: 'claude-haiku-4-5' }
  ))
  const haikuEstimate = haikuSteps.map((s) => estimateStep(plan.skillId, s, usageHistory, { cold: 0.6, warm: 0.2 }))
  const haikuCost = sum(haikuEstimate.map((s) => s.cost.p50))
  if (haikuCost < baseCost * 0.95) {
    alts.push({
      label: 'Haiku-only',
      description: 'Route every step through Haiku 4.5 instead of larger models.',
      savingsPct: pct(baseCost, haikuCost),
      qualityDeltaPct: -10,
      cost: {
        p10: sum(haikuEstimate.map((s) => s.cost.p10)),
        p50: haikuCost,
        p90: sum(haikuEstimate.map((s) => s.cost.p90)),
        currency: 'USD',
      },
    })
  }

  // Alternative 2 — skip critic steps.
  const criticStepIds = plan.steps.filter((s) => s.role === 'critic').map((s) => s.id)
  if (criticStepIds.length > 0) {
    const withoutCritic = base.filter((s) => !criticStepIds.includes(s.stepId))
    const wcCost = sum(withoutCritic.map((s) => s.cost.p50))
    alts.push({
      label: 'Skip critic',
      description: 'Run without the critic review step.',
      savingsPct: pct(baseCost, wcCost),
      qualityDeltaPct: -15,
      cost: {
        p10: sum(withoutCritic.map((s) => s.cost.p10)),
        p50: wcCost,
        p90: sum(withoutCritic.map((s) => s.cost.p90)),
        currency: 'USD',
      },
    })
  }

  // Alternative 3 — cached run (assume 40% input reuse).
  const cachedCost = baseCost * 0.6
  alts.push({
    label: 'Use cache',
    description: 'Reuse recent prompt cache (assumes 40% hit rate).',
    savingsPct: 40,
    qualityDeltaPct: 0,
    cost: {
      p10: sum(base.map((s) => s.cost.p10)) * 0.6,
      p50: cachedCost,
      p90: sum(base.map((s) => s.cost.p90)) * 0.6,
      currency: 'USD',
    },
  })

  return alts
}

function averageConfidence(plan: ExecutionPlan, history: UsageHistory): number {
  if (plan.steps.length === 0) return 0
  let total = 0
  for (const s of plan.steps) {
    const stats = history.stats(plan.skillId, s.id, s.model)
    total += stats ? Math.min(1, stats.samples / 20) : 0.25
  }
  return total / plan.steps.length
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0)
}

function pct(base: number, alt: number): number {
  if (base <= 0) return 0
  return Math.round(((base - alt) / base) * 100)
}
