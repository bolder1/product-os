'use client'

/**
 * AIActionBar — compatibility shim (post-R15).
 *
 * The product consolidated around a single AI surface (Copilot). Every
 * previously-standalone AI button across studios now delegates to the
 * right-edge Copilot panel instead of popping its own dropdown.
 *
 * This shim preserves the original export shape so existing call sites
 * across ~15 studios keep compiling without per-file edits, while the UX
 * collapses to one multifunctional AI button.
 */

import { Sparkles } from 'lucide-react'
import { useCopilotStore } from '../../lib/copilot-store'

interface AIActionBarProps {
  workspace: string
  productId: string
  /** Compact = icon-only; full = button + label. */
  compact?: boolean
  /** Kept for API compatibility; ignored by the shim. */
  context?: Record<string, unknown>
  /** Kept for API compatibility; ignored by the shim. */
  onComplete?: (skillId: string, summary: string) => void
}

export function AIActionBar({ workspace, compact }: AIActionBarProps) {
  const open = useCopilotStore((s) => s.openPanel)
  const setInput = useCopilotStore((s) => s.setInput)

  function ask() {
    setInput('')
    open()
  }

  return (
    <button
      type="button"
      onClick={ask}
      className={`flex items-center gap-1.5 rounded-md transition-all text-[var(--accent-text)] hover:bg-[var(--accent-muted)]/50 ${
        compact ? 'h-[26px] w-[26px] justify-center' : 'h-[26px] px-2 text-[11px]'
      }`}
      title={`Ask Copilot about ${workspace}`}
      aria-label="Ask Copilot"
    >
      <Sparkles size={13} />
      {!compact && <span>Ask Copilot</span>}
    </button>
  )
}
