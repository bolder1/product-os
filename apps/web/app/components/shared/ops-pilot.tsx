'use client'

import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Send, Loader2, Bot, User, CheckCircle2,
  ExternalLink, ListTodo, GitFork, BarChart3, ChevronDown,
  Maximize2, Minimize2, Trash2,
} from 'lucide-react'
import { trpc } from '../../lib/trpc'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageRole = 'user' | 'assistant' | 'system'

interface ActionCard {
  type: 'task_created' | 'navigate' | 'nodes_created' | 'stats' | 'none'
  data: Record<string, unknown>
}

interface Message {
  id: string
  role: MessageRole
  content: string
  action?: ActionCard
  isStreaming?: boolean
  timestamp: Date
}

interface OpsPilotProps {
  productId: string
  currentStudio: string
  orgSlug: string
  productSlug: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() { return Math.random().toString(36).slice(2, 10) }

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Minimal markdown-ish renderer (bold + line breaks)
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TaskCreatedCard({ data }: { data: Record<string, unknown> }) {
  const priority = data.priority as string
  const PRIORITY_COLOR: Record<string, string> = {
    urgent: '#F43F5E', high: '#F59E0B', medium: '#3B82F6', low: '#64748B',
  }
  return (
    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-[var(--color-success)]/08 border border-[var(--color-success)]/20">
      <CheckCircle2 size={13} className="text-[var(--color-success)] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{data.title as string}</p>
        {data.description ? (
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{data.description as string}</p>
        ) : null}
        <span
          className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${PRIORITY_COLOR[priority] ?? '#64748B'}20`, color: PRIORITY_COLOR[priority] ?? '#64748B' }}
        >
          {priority}
        </span>
      </div>
    </div>
  )
}

function NavigateCard({ data, onNavigate }: { data: Record<string, unknown>; onNavigate: (studio: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(data.studio as string)}
      className="mt-2 w-full flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--accent)]/08 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/15 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <ExternalLink size={11} className="text-[var(--accent)]" />
        <span className="text-[11px] text-[#93C5FD]">Open <strong className="text-[#BFDBFE]">{data.studio as string}</strong> studio</span>
      </div>
      <ChevronDown size={11} className="text-[var(--accent)] rotate-[-90deg]" />
    </button>
  )
}

function StatsCard({ data }: { data: Record<string, unknown> }) {
  const kindCounts = data.kindCounts as Record<string, number> | undefined
  if (!kindCounts || Object.keys(kindCounts).length === 0) return null
  const top = Object.entries(kindCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  return (
    <div className="mt-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 size={11} className="text-[var(--accent)]" />
        <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Graph Stats</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {top.map(([kind, count]) => (
          <div key={kind} className="flex flex-col items-center p-1.5 rounded bg-white/[0.02]">
            <span className="text-[13px] font-bold text-[var(--text-primary)]">{count}</span>
            <span className="text-[9px] text-[var(--text-tertiary)] capitalize">{kind}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NodesCreatedCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-[var(--accent)]/08 border border-[var(--accent)]/20">
      <GitFork size={13} className="text-[var(--accent)] mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">
          {data.nodesCreated as number} nodes · {data.edgesCreated as number} edges added
        </p>
        {data.summary ? (
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{data.summary as string}</p>
        ) : null}
      </div>
    </div>
  )
}

function ActionCardRenderer({
  action,
  onNavigate,
}: {
  action: ActionCard
  onNavigate: (studio: string) => void
}) {
  if (!action || action.type === 'none') return null
  if (action.type === 'task_created') return <TaskCreatedCard data={action.data} />
  if (action.type === 'navigate')     return <NavigateCard data={action.data} onNavigate={onNavigate} />
  if (action.type === 'stats')        return <StatsCard data={action.data} />
  if (action.type === 'nodes_created') return <NodesCreatedCard data={action.data} />
  return null
}

// ---------------------------------------------------------------------------
// Suggested Prompts Chip Row
// ---------------------------------------------------------------------------

function SuggestedPrompts({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (s: string) => void
}) {
  if (!suggestions.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
      {suggestions.slice(0, 4).map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[var(--text-secondary)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  onNavigate,
}: {
  message: Message
  onNavigate: (studio: string) => void
}) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
        isUser ? 'bg-[var(--accent)]/20' : 'bg-[var(--accent)]/20'
      }`}>
        {isUser
          ? <User size={12} className="text-[var(--accent)]" />
          : <Sparkles size={12} className="text-[var(--accent)]" />
        }
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
          isUser
            ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[#BFDBFE] rounded-tr-none'
            : 'bg-white/[0.04] border border-white/[0.06] text-[var(--text-secondary)] rounded-tl-none'
        }`}>
          {message.isStreaming ? (
            <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
              <Loader2 size={11} className="animate-spin" />
              Thinking…
            </span>
          ) : (
            <p className="whitespace-pre-wrap">{renderMarkdown(message.content)}</p>
          )}
        </div>

        {/* Action card */}
        {message.action && !message.isStreaming && (
          <div className="max-w-[85%] w-full">
            <ActionCardRenderer action={message.action} onNavigate={onNavigate} />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[9px] text-[var(--border-default)] mt-0.5">{formatTime(message.timestamp)}</span>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Welcome Screen
// ---------------------------------------------------------------------------

function WelcomeScreen({
  currentStudio,
  suggestions,
  onSelect,
}: {
  currentStudio: string
  suggestions: string[]
  onSelect: (s: string) => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-6">
      {/* Icon */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
          <Sparkles size={24} className="text-[var(--accent)]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-success)]/20 border border-[var(--color-success)]/40 flex items-center justify-center">
          <Bot size={10} className="text-[var(--color-success)]" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Cortex</p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1 max-w-[200px]">
          Your AI copilot across every studio. Ask anything, create tasks, navigate, or scaffold nodes.
        </p>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[260px]">
        {[
          { icon: ListTodo,    label: 'Create tasks',        color: '#10B981' },
          { icon: BarChart3,   label: 'Graph insights',      color: '#8B5CF6' },
          { icon: ExternalLink,label: 'Navigate studios',    color: '#3B82F6' },
          { icon: GitFork,     label: 'Scaffold nodes',      color: '#F59E0B' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <Icon size={11} style={{ color }} />
            <span className="text-[10px] text-[var(--text-tertiary)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full space-y-1.5">
          <p className="text-[10px] text-[var(--text-tertiary)] text-center uppercase tracking-wider">Try asking…</p>
          {suggestions.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              className="w-full text-left text-[11px] text-[var(--text-secondary)] px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OpsPilot({ productId, currentStudio, orgSlug, productSlug }: OpsPilotProps) {
  const router   = useRouter()
  const [open, setOpen]         = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)

  // Suggestions query (cached)
  const suggestionsQuery = trpc.opsPilot.getSuggestions.useQuery(
    { productId, currentStudio },
    { enabled: !!productId && open, staleTime: 60_000 },
  )
  const suggestions = suggestionsQuery.data?.suggestions ?? []

  const chatMutation = trpc.opsPilot.chat.useMutation()

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Keyboard shortcut: Cmd+Shift+O
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNavigate = useCallback((studio: string) => {
    router.push(`/${orgSlug}/${productSlug}/${studio}`)
    setOpen(false)
  }, [router, orgSlug, productSlug])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || chatMutation.isPending) return

    setInput('')

    // Add user message
    const userMsg: Message = {
      id: uid(), role: 'user', content: trimmed, timestamp: new Date(),
    }

    // Add streaming placeholder
    const pendingId = uid()
    const pendingMsg: Message = {
      id: pendingId, role: 'assistant', content: '', isStreaming: true, timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg, pendingMsg])

    // Build history for API
    const history = [...messages, userMsg]
      .filter((m) => (m.role as string) !== 'system' && m.content)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    try {
      const result = await chatMutation.mutateAsync({
        productId,
        currentStudio,
        messages: history,
      })

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, content: result.reply, isStreaming: false, action: result.action as ActionCard | undefined }
            : m,
        ),
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, content: `Sorry, I hit an error: ${msg}`, isStreaming: false }
            : m,
        ),
      )
    }
  }, [messages, chatMutation, productId, currentStudio])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }, [input, sendMessage])

  const clearChat = useCallback(() => setMessages([]), [])

  const panelWidth  = expanded ? 480 : 360
  const panelHeight = expanded ? 640 : 500

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            title="Cortex (⌘⇧O)"
            className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] shadow-xl flex items-center justify-center hover:shadow-[0_0_24px_rgba(139,92,246,0.5)] transition-shadow group"
          >
            <Sparkles size={20} className="text-white group-hover:scale-110 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping bg-[var(--accent)]/20 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 16, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: panelWidth, height: panelHeight }}
            className="fixed bottom-6 right-6 z-[60] flex flex-col rounded-2xl border border-white/[0.1] bg-[#0D1117] shadow-2xl overflow-hidden transition-[width,height] duration-200"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--accent)]/40 to-[var(--accent)]/30 border border-[var(--accent)]/30 flex items-center justify-center">
                  <Sparkles size={13} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-none">Cortex</p>
                  <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{currentStudio} · {productSlug}</p>
                </div>
                <div className="ml-1 w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear conversation"
                    className="p-1 rounded hover:bg-white/[0.05] text-[var(--border-default)] hover:text-[var(--text-tertiary)] transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                <button
                  onClick={() => setExpanded((v) => !v)}
                  title={expanded ? 'Collapse' : 'Expand'}
                  className="p-1 rounded hover:bg-white/[0.05] text-[var(--border-default)] hover:text-[var(--text-tertiary)] transition-colors"
                >
                  {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="p-1 rounded hover:bg-white/[0.05] text-[var(--border-default)] hover:text-[var(--text-tertiary)] transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scroll-smooth">
              {messages.length === 0 ? (
                <WelcomeScreen
                  currentStudio={currentStudio}
                  suggestions={suggestions}
                  onSelect={sendMessage}
                />
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onNavigate={handleNavigate} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Suggestions Row (visible after first message) ── */}
            {messages.length > 0 && suggestions.length > 0 && (
              <SuggestedPrompts suggestions={suggestions} onSelect={sendMessage} />
            )}

            {/* ── Input Bar ── */}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 px-3 py-2.5 border-t border-white/[0.07] bg-white/[0.02] flex-shrink-0"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your product…"
                rows={1}
                disabled={chatMutation.isPending}
                className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder-[var(--border-default)] outline-none focus:border-[var(--accent)]/50 focus:bg-white/[0.06] transition-all disabled:opacity-40 max-h-[100px] leading-relaxed"
                style={{ minHeight: 36 }}
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] flex items-center justify-center disabled:opacity-40 hover:shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all shrink-0"
              >
                {chatMutation.isPending
                  ? <Loader2 size={14} className="text-white animate-spin" />
                  : <Send size={13} className="text-white" />
                }
              </button>
            </form>

            {/* ── Keyboard hint ── */}
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[9px] text-[var(--bg-surface)]">⌘⇧O to toggle</span>
              <span className="text-[9px] text-[var(--bg-surface)]">↵ send · ⇧↵ newline</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
