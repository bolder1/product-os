'use client'

/**
 * R9 — Persistent Copilot panel.
 *
 * Right-edge conversational panel. The thread persists across Modes,
 * studios, and Role switches. Context-aware header shows the current
 * studio and any selected graph node. Sends messages into a local echo
 * for now — wiring into `aiRuntime` + Computer Mode happens as a
 * follow-up.
 *
 * Deprecates AIActionBar on a per-studio basis by offering a single
 * conversational surface with access to Memory / Graph / Skills.
 */

import { useEffect, useRef, useMemo } from 'react'
import { MessageSquare, X, Send, Sparkles, Trash2, Network, Brain } from 'lucide-react'
import { useCopilotStore, type CopilotMessage } from '../../lib/copilot-store'
import { useInspectorStore } from '../../lib/inspector-store'
import { useGraphStore } from '../../lib/graph-store'

interface CopilotProps {
  productId: string
  orgSlug: string
  productSlug: string
  studio: string
}

export function Copilot({ productId, orgSlug, productSlug, studio }: CopilotProps) {
  const open = useCopilotStore((s) => s.open)
  const width = useCopilotStore((s) => s.width)
  const messages = useCopilotStore((s) => s.messages)
  const input = useCopilotStore((s) => s.input)
  const busy = useCopilotStore((s) => s.busy)
  const setInput = useCopilotStore((s) => s.setInput)
  const setContext = useCopilotStore((s) => s.setContext)
  const addMessage = useCopilotStore((s) => s.addMessage)
  const updateMessage = useCopilotStore((s) => s.updateMessage)
  const clearThread = useCopilotStore((s) => s.clearThread)
  const closePanel = useCopilotStore((s) => s.closePanel)
  const setBusy = useCopilotStore((s) => s.setBusy)

  const selectedNodeId = useInspectorStore((s) => s.selectedNodeId)
  const nodesCount = useGraphStore((s) => s.nodes.length)

  // Keep context fresh
  useEffect(() => {
    setContext({ productId, orgSlug, productSlug, studio, selectedNodeId: selectedNodeId ?? undefined })
  }, [productId, orgSlug, productSlug, studio, selectedNodeId, setContext])

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [open, messages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || busy) return
    addMessage({ role: 'user', content: text, studio })
    setInput('')
    setBusy(true)
    // Simulated reply — real wire-up to aiRuntime in R10/R11
    const placeholderId = addMessage({ role: 'assistant', content: '…thinking', studio })
    await new Promise((r) => setTimeout(r, 650))
    const reply = composeStubReply(text, { studio, nodesCount, selectedNodeId })
    updateMessage(placeholderId, { content: reply })
    setBusy(false)
  }

  const greeting = useMemo(() => {
    if (messages.length > 0) return null
    return `Hi — I'm your product copilot. I can query the graph, pull from Memory, and draft Computer Mode actions. You're in ${studio}. Ask me anything.`
  }, [messages.length, studio])

  if (!open) return null

  return (
    <aside
      className="fixed top-0 right-0 z-30 h-screen bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col shadow-[var(--shadow-lg)]"
      style={{ width }}
      role="complementary"
      aria-label="Copilot"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--accent-text)]" />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Copilot</div>
            <div className="text-[13px] font-medium text-[var(--text-primary)]">Your product pair</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearThread}
            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
            aria-label="Clear thread"
            title="Clear thread"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={closePanel}
            className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
            aria-label="Close copilot"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Context chips */}
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] flex items-center gap-2 flex-wrap">
        <ContextChip icon={Sparkles} label={studio} />
        <ContextChip icon={Network} label={`graph · ${nodesCount}`} />
        {selectedNodeId && <ContextChip icon={Brain} label="selected node" />}
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {greeting && (
          <div className="text-[12px] leading-relaxed text-[var(--text-secondary)] italic">{greeting}</div>
        )}
        {messages.map((m) => (
          <MessageRow key={m.id} m={m} />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask the copilot…"
            rows={2}
            className="flex-1 resize-none text-[13px] leading-relaxed bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-text)]"
          />
          <button
            onClick={handleSend}
            disabled={busy || !input.trim()}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--accent-muted)] text-[var(--accent-text)] hover:opacity-90 disabled:opacity-40 transition"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function ContextChip({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-medium uppercase tracking-wide">
      <Icon size={10} />
      {label}
    </span>
  )
}

function MessageRow({ m }: { m: CopilotMessage }) {
  const isUser = m.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--accent-muted)] text-[var(--accent-text)]'
            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
        }`}
      >
        {m.content}
        {m.refs && m.refs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.refs.map((r) => (
              <span
                key={`${r.kind}:${r.id}`}
                className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-secondary)] font-mono"
              >
                {r.kind}:{r.label ?? r.id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Stub reply composer — replaced by real runtime later.
function composeStubReply(
  text: string,
  ctx: { studio: string; nodesCount: number; selectedNodeId: string | null },
): string {
  const lower = text.toLowerCase()
  if (/graph|show|where/.test(lower)) {
    return `From ${ctx.studio}, your graph currently has ${ctx.nodesCount} nodes. Click any object's "Open in Graph" to scope the inspector.`
  }
  if (/brand|voice|tone/.test(lower)) {
    return `Brand settings live in /brand. The Voice tab covers tone, personality, and do/don't rules.`
  }
  if (/task|approval|work/.test(lower)) {
    return `Try the unified Work surface — kanban, list, and timeline all on one page, with filters by role and status.`
  }
  return `I'd normally route this through aiRuntime and propose a Computer Mode draft. For now, treat this as a stub — the thread persists across Modes.`
}
