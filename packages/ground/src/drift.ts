import type { Entry } from './schema'

export type EntryState = 'grounded' | 'drifted'

const DAY = 86_400_000

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / DAY)
}

/**
 * Drift, for the MVP, is age since last confirmation.
 *
 * This is deliberately the simplest mechanism that is honestly useful: it is
 * real, it is checkable, and it is already more than a markdown file offers.
 * Contradiction detection and codebase divergence come later.
 */
export function stateOf(entry: Pick<Entry, 'lastConfirmedAt'>, staleAfterDays: number): EntryState {
  return daysSince(new Date(entry.lastConfirmedAt)) >= staleAfterDays ? 'drifted' : 'grounded'
}

export function ageLabel(entry: Pick<Entry, 'lastConfirmedAt'>, staleAfterDays: number): string {
  const days = daysSince(new Date(entry.lastConfirmedAt))
  if (stateOf(entry, staleAfterDays) === 'drifted') return `stale · ${days}d`
  if (days === 0) return 'confirmed today'
  if (days === 1) return 'confirmed 1d ago'
  return `confirmed ${days}d ago`
}
