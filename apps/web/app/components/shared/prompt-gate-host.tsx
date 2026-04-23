'use client'

/**
 * PromptGateHost — binds the prompt-gate store to the shared <PromptGate />
 * component plus an inline <TokenEstimate />. Mount once, anywhere in the
 * dashboard shell; entry points trigger it via `submitPromptThroughGate()`.
 */

import { useMemo } from 'react'
import { PromptGate, TokenEstimate } from '@product-os/ui'
import { enhance, estimate, getPricing, type ExecutionPlan } from '@product-os/ai'
import { usePromptGateStore } from '../../lib/prompt-gate-store'
import { useBudgetStore } from '../../lib/budget-store'

const DEFAULT_PLAN: ExecutionPlan = {
  skillId: 'cortex.prompt',
  steps: [
    { id: 'plan',   label: 'Planner',   role: 'planner',   model: 'claude-opus-4-7',    approxInputChars: 2400, toolCount: 3 },
    { id: 'gen',    label: 'Generator', role: 'generator', model: 'claude-sonnet-4-6',  approxInputChars: 8000, toolCount: 5 },
    { id: 'critic', label: 'Critic',    role: 'critic',    model: 'claude-haiku-4-5',   approxInputChars: 3600, toolCount: 1 },
  ],
}

export function PromptGateHost() {
  const open = usePromptGateStore((s) => s.open)
  const view = usePromptGateStore((s) => s.view)
  const raw = usePromptGateStore((s) => s.raw)
  const context = usePromptGateStore((s) => s.context)
  const enhancement = usePromptGateStore((s) => s.enhancement)
  const setEnhancement = usePromptGateStore((s) => s.setEnhancement)
  const setView = usePromptGateStore((s) => s.setView)
  const acceptRaw = usePromptGateStore((s) => s.acceptRaw)
  const acceptEnhanced = usePromptGateStore((s) => s.acceptEnhanced)
  const cancel = usePromptGateStore((s) => s.cancel)

  const capToday = useBudgetStore((s) => s.capToday)
  const capThisMonth = useBudgetStore((s) => s.capThisMonth)
  const runs = useBudgetStore((s) => s.runs)

  const budgetSnapshot = useMemo(() => {
    const dayCutoff = Date.now() - 24 * 60 * 60 * 1000
    const now = new Date()
    const usedToday = runs
      .filter((r) => new Date(r.at).getTime() >= dayCutoff)
      .reduce((a, r) => a + r.cost, 0)
    const usedThisMonth = runs
      .filter((r) => {
        const d = new Date(r.at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((a, r) => a + r.cost, 0)
    return { usedToday, capToday, usedThisMonth, capThisMonth }
  }, [runs, capToday, capThisMonth])

  const plan = useMemo<ExecutionPlan>(() => {
    const chars = Math.max(raw.length, 80)
    return {
      ...DEFAULT_PLAN,
      steps: DEFAULT_PLAN.steps.map((s) => ({ ...s, approxInputChars: s.approxInputChars + chars })),
    }
  }, [raw])

  const estimateResult = useMemo(() => estimate(plan, { budget: budgetSnapshot }), [plan, budgetSnapshot])

  const estimateSlot = (
    <TokenEstimate
      title="Cost estimate"
      steps={estimateResult.steps.map((s) => ({
        stepId: s.stepId,
        label: s.label,
        modelDisplay: getPricing(s.model).displayName,
        tokensP50: s.inputTokens.p50 + s.outputTokens.p50,
        costP50: s.cost.p50,
      }))}
      totalTokensP50={estimateResult.total.tokens.p50}
      totalCostP50={estimateResult.total.cost.p50}
      budget={{
        usedToday: estimateResult.budget.usedToday,
        capToday: estimateResult.budget.capToday,
        projectedAfter: estimateResult.budget.projectedAfter,
      }}
      alternatives={estimateResult.alternatives.map((a) => ({
        label: a.label,
        description: a.description,
        savingsPct: a.savingsPct,
        qualityDeltaPct: a.qualityDeltaPct,
        costP50: a.cost.p50,
      }))}
      confidence={estimateResult.confidence}
      onRun={() => acceptEnhanced(enhancement?.enhanced ?? raw)}
      onBack={() => setView(enhancement ? 'enhanced' : 'raw')}
    />
  )

  return (
    <PromptGate
      open={open}
      view={view}
      raw={raw}
      enhanced={enhancement?.enhanced}
      diff={enhancement?.diff}
      variables={enhancement?.variables}
      strategiesApplied={enhancement?.strategiesApplied}
      estimateSlot={estimateSlot}
      onEnhance={() => {
        if (!context) return
        const e = enhance(raw, context)
        setEnhancement(e)
      }}
      onEstimate={() => setView('estimate')}
      onSendRaw={acceptRaw}
      onBack={() => setView('raw')}
      onRunEnhanced={(finalPrompt) => acceptEnhanced(finalPrompt)}
      onCancel={cancel}
    />
  )
}
