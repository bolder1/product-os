/**
 * Model pricing registry.
 *
 * Single source of truth for per-model $/token rates. All estimator code reads
 * through `getPricing(modelId)` — never hard-code rates elsewhere.
 *
 * Rates are USD per 1M tokens. Update when provider pricing changes.
 */

import type { ModelId } from './types'

export interface ModelPricing {
  modelId: ModelId
  displayName: string
  provider: 'anthropic' | 'openai' | 'voyage'
  /** USD per 1,000,000 input tokens. */
  inputPerMillion: number
  /** USD per 1,000,000 output tokens. */
  outputPerMillion: number
  /** Suggested role mapping for routing hints. */
  defaultRoles: Array<'planner' | 'generator' | 'critic' | 'embedding' | 'tool-call'>
  /** Prior on output-to-input token ratio, used for cold-start estimates. */
  outputPriorRatio: number
}

const registry: Record<ModelId, ModelPricing> = {
  'claude-opus-4-7': {
    modelId: 'claude-opus-4-7',
    displayName: 'Opus 4.7',
    provider: 'anthropic',
    inputPerMillion: 15,
    outputPerMillion: 75,
    defaultRoles: ['planner', 'generator'],
    outputPriorRatio: 0.6,
  },
  'claude-sonnet-4-6': {
    modelId: 'claude-sonnet-4-6',
    displayName: 'Sonnet 4.6',
    provider: 'anthropic',
    inputPerMillion: 3,
    outputPerMillion: 15,
    defaultRoles: ['generator', 'critic'],
    outputPriorRatio: 0.55,
  },
  'claude-haiku-4-5': {
    modelId: 'claude-haiku-4-5',
    displayName: 'Haiku 4.5',
    provider: 'anthropic',
    inputPerMillion: 1,
    outputPerMillion: 5,
    defaultRoles: ['critic', 'tool-call'],
    outputPriorRatio: 0.4,
  },
  'voyage-3': {
    modelId: 'voyage-3',
    displayName: 'Voyage 3',
    provider: 'voyage',
    inputPerMillion: 0.12,
    outputPerMillion: 0,
    defaultRoles: ['embedding'],
    outputPriorRatio: 0,
  },
  'text-embedding-3-small': {
    modelId: 'text-embedding-3-small',
    displayName: 'OpenAI Embedding S',
    provider: 'openai',
    inputPerMillion: 0.02,
    outputPerMillion: 0,
    defaultRoles: ['embedding'],
    outputPriorRatio: 0,
  },
}

export function getPricing(modelId: ModelId): ModelPricing {
  const p = registry[modelId]
  if (!p) throw new Error(`No pricing registered for model: ${modelId}`)
  return p
}

export function listPricing(): ModelPricing[] {
  return Object.values(registry)
}

/** Compute USD cost for a given token count. */
export function costOf(modelId: ModelId, inputTokens: number, outputTokens: number): number {
  const p = getPricing(modelId)
  return (
    (inputTokens / 1_000_000) * p.inputPerMillion +
    (outputTokens / 1_000_000) * p.outputPerMillion
  )
}
