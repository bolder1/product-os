'use client'

/**
 * AIActionBar — contextual AI skill launcher for any workspace toolbar.
 *
 * Usage:
 *   <AIActionBar workspace="design" productId={productId} compact />
 *   <AIActionBar workspace="plan"   productId={productId} />
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, ChevronDown, CheckCircle2, AlertCircle, Zap, X } from 'lucide-react'
import { useAIRuntime, WORKSPACE_SKILLS } from '../../lib/ai-runtime'
import { useAuthStore } from '../../lib/auth-store'
import { makeActor } from '../../lib/event-bus'
import type { AISkill } from '../../lib/ai-skills-store'

const FAMILY_COLORS: Record<string, string> = {
  product:     '#6398ff',
  design:      '#ec4899',
  engineering: '#10b981',
  growth:      '#f59e0b',
  system:      '#8b5cf6',
}

interface AIActionBarProps {
  workspace: string
  productId: string
  /** Compact = icon-only button; full = button + label */
  compact?: boolean
  /** Extra context passed to the skill as part of input */
  context?: Record<string, unknown>
  /** Called when a skill completes */
  onComplete?: (skillId: string, summary: string) => void
}

export function AIActionBar({ workspace, productId, compact, context, onComplete }: AIActionBarProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const userName = useAuthStore((s) => s.user?.name ?? 'Unknown')
  const { run, workspaceSkills, isRunning, lastExecution } = useAIRuntime(workspace)

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Auto-focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Show toast on completion
  useEffect(() => {
    if (lastExecution?.status === 'completed' && lastExecution.output) {
      const summary = (lastExecution.output as any).summary as string | undefined
      if (summary) {
        setToastMsg(summary)
        onComplete?.(lastExecution.skillId, summary)
        const t = setTimeout(() => setToastMsg(null), 4000)
        return () => clearTimeout(t)
      }
    }
  }, [lastExecution?.status, lastExecution?.id])

  const handleRun = useCallback(async () => {
    const skillId = selectedSkillId ?? workspaceSkills[0]?.id
    if (!skillId) return

    setOpen(false)
    await run(skillId, productId, { prompt, ...context }, makeActor(userId, userName))
    setPrompt('')
    setSelectedSkillId(null)
  }, [selectedSkillId, workspaceSkills, run, productId, prompt, context, userId, userName])

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isRunning}
        className={`
          flex items-center gap-1.5 rounded-md transition-all
          ${compact
            ? 'h-[26px] w-[26px] justify-center text-[var(--accent-text)] hover:bg-[var(--accent)]/10'
            : 'h-[26px] px-2 text-[11px] text-[var(--accent-text)] hover:bg-[var(--accent)]/10'
          }
          ${isRunning ? 'opacity-60 cursor-wait' : ''}
        `}
        title="AI Actions"
        aria-label="Open AI actions"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {isRunning
          ? <Loader2 size={13} className="animate-spin" />
          : <Sparkles size={13} />
        }
        {!compact && <span>AI</span>}
        {!compact && !isRunning && <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-[300px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-panel)] z-50 overflow-hidden"
          style={{ animation: 'fadeIn 120ms ease' }}
          role="dialog"
          aria-label="AI actions panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-[var(--accent-text)]" />
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">AI Skills</span>
              <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded-full capitalize">{workspace}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <X size={12} />
            </button>
          </div>

          {/* Prompt input */}
          <div className="px-3 pt-2.5 pb-2">
            <div className="flex items-center gap-2 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 focus-within:border-[var(--accent)] transition-colors">
              <Zap size={11} className="text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                placeholder="Describe what to generate…"
                className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* Skill selector */}
          {workspaceSkills.length > 0 && (
            <div className="px-3 pb-2">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Pick a skill</p>
              <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto">
                {workspaceSkills.map((skill) => {
                  const isSelected = selectedSkillId === skill.id
                  const color = FAMILY_COLORS[skill.family] ?? '#6398ff'
                  return (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkillId(isSelected ? null : skill.id)}
                      className={`flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${isSelected ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--surface-hover)]'}`}
                    >
                      <span className="w-[6px] h-[6px] rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11px] text-[var(--text-primary)] font-medium leading-tight">{skill.name}</span>
                        <span className="block text-[10px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">{skill.description}</span>
                      </span>
                      {skill.creditCost > 0 && (
                        <span className="shrink-0 text-[9px] text-[var(--text-tertiary)] mt-0.5">{skill.creditCost}cr</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Run button */}
          <div className="px-3 pb-3">
            <button
              onClick={handleRun}
              disabled={workspaceSkills.length === 0}
              className="w-full h-[30px] flex items-center justify-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-medium rounded-lg transition-colors disabled:opacity-40"
            >
              <Sparkles size={12} />
              Run{selectedSkillId ? ` "${workspaceSkills.find((s) => s.id === selectedSkillId)?.name}"` : ' AI Skill'}
            </button>
          </div>
        </div>
      )}

      {/* Completion toast */}
      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-start gap-2.5 max-w-[320px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 shadow-[var(--shadow-panel)]"
          style={{ animation: 'slideInRight 200ms cubic-bezier(0.16,1,0.3,1)' }}
          role="status"
        >
          <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-primary)]">AI Skill Complete</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{toastMsg}</p>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
