/**
 * Usage history — rolling record of (skillId, model) token usage.
 *
 * The estimator reads the rolling median from the last N runs of a skill and
 * uses it as the output-token predictor. Cold-start skills fall back to the
 * `outputPriorRatio` from the model pricing registry.
 *
 * Phase A: in-memory only. Phase E swaps in a persistent store (db-backed).
 */

import type { ModelId } from './types'

export interface UsageRecord {
  skillId: string
  stepId: string
  model: ModelId
  inputTokens: number
  outputTokens: number
  /** ISO timestamp. */
  at: string
}

export interface UsageStats {
  samples: number
  inputMedian: number
  outputMedian: number
  /** Rolling output-to-input ratio. Preferred over raw medians for cross-size generalization. */
  outputRatio: number
}

const MAX_RECORDS_PER_KEY = 50

export class UsageHistory {
  private records = new Map<string, UsageRecord[]>()

  private keyFor(skillId: string, stepId: string, model: ModelId): string {
    return `${skillId}::${stepId}::${model}`
  }

  record(r: UsageRecord): void {
    const key = this.keyFor(r.skillId, r.stepId, r.model)
    const list = this.records.get(key) ?? []
    list.unshift(r)
    if (list.length > MAX_RECORDS_PER_KEY) list.length = MAX_RECORDS_PER_KEY
    this.records.set(key, list)
  }

  stats(skillId: string, stepId: string, model: ModelId, window = 20): UsageStats | null {
    const key = this.keyFor(skillId, stepId, model)
    const list = this.records.get(key)
    if (!list || list.length === 0) return null
    const sample = list.slice(0, window)
    const inputs = sample.map((r) => r.inputTokens).sort((a, b) => a - b)
    const outputs = sample.map((r) => r.outputTokens).sort((a, b) => a - b)
    const ratios = sample
      .map((r) => (r.inputTokens > 0 ? r.outputTokens / r.inputTokens : 0))
      .sort((a, b) => a - b)
    return {
      samples: sample.length,
      inputMedian: median(inputs),
      outputMedian: median(outputs),
      outputRatio: median(ratios),
    }
  }

  clear(): void {
    this.records.clear()
  }
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
  }
  return sorted[mid] ?? 0
}

/** Singleton used across the ai package. Swappable for persistent impl later. */
export const usageHistory = new UsageHistory()
