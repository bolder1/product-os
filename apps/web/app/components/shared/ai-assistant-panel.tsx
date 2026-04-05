'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  Send,
  Lightbulb,
  Wand2,
  BarChart3,
  Loader2,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
import { trpcMutate } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AISuggestion {
  id: string
  title: string
  description: string
  confidence: number
  category?: string
  action?: { label: string; onClick: () => void }
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: AISuggestion[]
  timestamp: string
}

export type AISkillType = 'suggest' | 'scaffold' | 'analyze'

interface AIAssistantPanelProps {
  studio: string
  productId?: string
  contextHints?: string[]
  onApplySuggestion?: (suggestion: AISuggestion) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Mock AI responses per studio
// ---------------------------------------------------------------------------

const studioResponses: Record<string, AISuggestion[]> = {
  brand: [
    { id: 's1', title: 'Add secondary color scale', description: 'Your brand only has primary colors. Consider adding a complementary secondary palette for accents and CTAs.', confidence: 0.92, category: 'color' },
    { id: 's2', title: 'Define dark mode tokens', description: 'Create semantic tokens for dark mode to ensure consistent theming across all components.', confidence: 0.88, category: 'tokens' },
    { id: 's3', title: 'Typography scale gap', description: 'There\'s a large jump between your h3 (24px) and body (16px). Consider adding a subtitle size at 20px.', confidence: 0.85, category: 'typography' },
  ],
  components: [
    { id: 's1', title: 'Extract shared Button variants', description: 'You have 3 similar button patterns. Consider extracting a single Button component with primary, secondary, and ghost variants.', confidence: 0.94, category: 'refactor' },
    { id: 's2', title: 'Add loading states', description: 'Your form components lack loading indicators. Add skeleton and spinner states for better UX.', confidence: 0.87, category: 'ux' },
    { id: 's3', title: 'Accessibility: add aria labels', description: 'Several interactive components are missing aria-label attributes for screen readers.', confidence: 0.91, category: 'a11y' },
  ],
  design: [
    { id: 's1', title: 'Inconsistent spacing', description: 'Screens use mixed spacing (12px and 16px padding). Standardize to your 4px grid system.', confidence: 0.89, category: 'layout' },
    { id: 's2', title: 'Missing error states', description: '3 of 5 forms have no error state designs. Add validation error patterns.', confidence: 0.93, category: 'states' },
    { id: 's3', title: 'Mobile breakpoint needed', description: 'Your dashboard screen has no mobile variant. Consider a responsive layout for <768px.', confidence: 0.86, category: 'responsive' },
  ],
  workflows: [
    { id: 's1', title: 'Add retry logic to payment flow', description: 'The payment workflow transitions to "failed" with no recovery path. Add a retry transition.', confidence: 0.95, category: 'logic' },
    { id: 's2', title: 'Missing notification trigger', description: 'The "approved" state has no notification trigger. Users won\'t know when their request is approved.', confidence: 0.91, category: 'automation' },
    { id: 's3', title: 'Circular dependency detected', description: 'The "review" and "revision" states create a cycle without a maximum iteration limit.', confidence: 0.88, category: 'validation' },
  ],
  analytics: [
    { id: 's1', title: 'High bounce rate on /pricing', description: 'The pricing page has a 68% bounce rate. Consider A/B testing with a simplified layout.', confidence: 0.90, category: 'insight' },
    { id: 's2', title: 'Conversion funnel drop-off', description: 'Step 3 of signup has a 45% drop-off. The form has 8 fields -- consider progressive disclosure.', confidence: 0.93, category: 'conversion' },
    { id: 's3', title: 'Track feature adoption', description: 'New features shipped last sprint have no analytics events. Add tracking for usage metrics.', confidence: 0.87, category: 'tracking' },
  ],
  default: [
    { id: 's1', title: 'Review product graph completeness', description: 'Your product has features defined but no linked components or pages. Consider scaffolding the build phase.', confidence: 0.85, category: 'general' },
    { id: 's2', title: 'Add task assignments', description: 'Several generated tasks have no assignee. Distribute tasks across team roles for better tracking.', confidence: 0.82, category: 'tasks' },
    { id: 's3', title: 'Schedule a release checkpoint', description: 'You have 12 completed tasks but no release planned. Consider creating a v0.1 milestone.', confidence: 0.80, category: 'planning' },
  ],
}

const skillQuickActions: Array<{ skill: AISkillType; label: string; icon: typeof Sparkles; color: string }> = [
  { skill: 'suggest', label: 'Suggest', icon: Lightbulb, color: '#F59E0B' },
  { skill: 'scaffold', label: 'Scaffold', icon: Wand2, color: 'var(--accent-text)' },
  { skill: 'analyze', label: 'Analyze', icon: BarChart3, color: '#06B6D4' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIAssistantPanel({
  studio,
  productId,
  contextHints = [],
  onApplySuggestion,
  className = '',
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getSuggestions = (): AISuggestion[] => {
    return studioResponses[studio] || studioResponses.default
  }

  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    const prompt = input.trim()
    setInput('')
    setIsThinking(true)

    try {
      if (productId) {
        const result = await trpcMutate<{ success: boolean; data?: { suggestions?: AISuggestion[] }; error?: string }>(
          'ai.suggest',
          { productId, prompt, context: { studioOrigin: studio } },
        )
        const suggestions = (result?.data?.suggestions ?? []).map((s: AISuggestion, i: number) => ({
          ...s,
          id: `s-${Date.now()}-${i}`,
        }))
        const assistantMsg: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: suggestions.length > 0
            ? `Based on your ${studio} studio context, here are my recommendations:`
            : result?.error ?? 'Here are some thoughts on that:',
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        // Fallback to mock
        const suggestions = getSuggestions()
        const assistantMsg: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: `Based on your ${studio} studio context, here are my recommendations:`,
          suggestions: suggestions.slice(0, 3),
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      }
    } catch {
      // Fallback to mock on error
      const suggestions = getSuggestions()
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `Based on your ${studio} studio context, here are my recommendations:`,
        suggestions: suggestions.slice(0, 3),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    }
    setIsThinking(false)
  }

  const handleQuickAction = async (skill: AISkillType) => {
    const prompts: Record<AISkillType, string> = {
      suggest: `Suggest improvements for my ${studio} studio`,
      scaffold: `Scaffold the next steps for ${studio}`,
      analyze: `Analyze the current state of ${studio}`,
    }

    const prompt = prompts[skill]
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    try {
      if (productId) {
        const procedure = skill === 'analyze' ? 'ai.analyze' : skill === 'scaffold' ? 'ai.scaffold' : 'ai.suggest'
        const inputPayload = skill === 'analyze'
          ? { productId, analysisType: 'gaps', context: { studioOrigin: studio } }
          : { productId, prompt, context: { studioOrigin: studio } }

        const result = await trpcMutate<{ success: boolean; data?: unknown }>(procedure, inputPayload)
        const data = result?.data as Record<string, unknown> | undefined

        let content = ''
        let suggestions: AISuggestion[] = []

        if (skill === 'suggest' && data?.suggestions) {
          content = `Here are my suggestions for your ${studio} studio:`
          suggestions = (data.suggestions as AISuggestion[]).map((s, i) => ({ ...s, id: `s-${Date.now()}-${i}` }))
        } else if (skill === 'scaffold' && data?.nodes) {
          content = (data.summary as string) ?? `Scaffolded ${(data.nodes as unknown[]).length} nodes for ${studio}`
          const nodes = data.nodes as Array<{ label: string; kind: string }>
          suggestions = nodes.map((n, i) => ({
            id: `s-${Date.now()}-${i}`,
            title: n.label,
            description: `${n.kind} node`,
            confidence: 0.9,
            category: n.kind,
          }))
        } else if (skill === 'analyze' && data?.findings) {
          content = (data.summary as string) ?? `Analysis of ${studio} studio:`
          const findings = data.findings as Array<{ title: string; description: string; severity: string; category: string }>
          suggestions = findings.map((f, i) => ({
            id: `s-${Date.now()}-${i}`,
            title: f.title,
            description: f.description,
            confidence: f.severity === 'critical' ? 0.95 : f.severity === 'warning' ? 0.85 : 0.7,
            category: f.category,
          }))
        } else {
          content = `Here's what I found for your ${studio} studio:`
        }

        setMessages((prev) => [...prev, {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          timestamp: new Date().toISOString(),
        }])
      } else {
        throw new Error('No product ID')
      }
    } catch {
      // Fallback to mock
      const suggestions = getSuggestions()
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: skill === 'analyze'
          ? `Here's my analysis of your ${studio} studio:`
          : skill === 'scaffold'
          ? `I can scaffold the following for your ${studio} studio:`
          : `Here are my suggestions for your ${studio} studio:`,
        suggestions,
        timestamp: new Date().toISOString(),
      }])
    }
    setIsThinking(false)
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 left-6 z-50 tool-btn-primary flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium ${className}`}
        >
          <Sparkles size={14} />
          AI Assistant
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <aside
            className="fixed top-0 left-0 z-50 h-screen w-[380px] flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-default)]"
          >
            {/* Header */}
            <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[var(--accent-text)]" />
                <h2 className="text-[13px] font-medium text-[var(--text-primary)]">AI Assistant</h2>
                <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{studio}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="tool-btn p-1"
              >
                <X size={13} className="text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-default)]">
              {skillQuickActions.map(({ skill, label, icon: Icon, color }) => (
                <button
                  key={skill}
                  onClick={() => handleQuickAction(skill)}
                  className="tool-btn flex items-center gap-1 px-2 py-1 text-[10px] font-medium"
                  style={{ color }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>

            {/* Context hints */}
            {contextHints.length > 0 && (
              <div className="px-3 py-2 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Zap size={10} className="text-[#F59E0B]" />
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Context</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {contextHints.map((hint, i) => (
                    <span key={i} className="tool-badge text-[10px]">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles size={20} className="text-[var(--text-tertiary)] mb-3" />
                  <p className="text-[12px] text-[var(--text-secondary)] mb-1">AI-powered assistant</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] max-w-[240px]">
                    Ask questions, get suggestions, scaffold content, or analyze your {studio} studio.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[var(--accent)]/15 border-[var(--accent)]/20' : 'bg-white/[0.03] border-white/[0.06]'} rounded-[var(--radius-md)] px-3 py-2.5 border`}>
                    <p className="text-[12px] text-[var(--text-primary)] leading-relaxed">{msg.content}</p>

                    {msg.suggestions && (
                      <div className="mt-2.5 space-y-1.5">
                        {msg.suggestions.map((s) => (
                          <div
                            key={s.id}
                            className="bg-white/[0.03] rounded-[var(--radius-md)] px-3 py-2 border border-white/[0.05] hover:border-[var(--accent)]/20 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-[var(--text-primary)]">{s.title}</p>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">{s.description}</p>
                              </div>
                              <span className="tool-badge text-[10px] bg-[var(--accent)]/10 text-[var(--accent-text)] border-[var(--accent)]/20 shrink-0">
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {s.category && (
                                <span className="tool-badge text-[10px]">
                                  {s.category}
                                </span>
                              )}
                              <button
                                onClick={() => onApplySuggestion?.(s)}
                                className="text-[10px] text-[var(--accent-text)] hover:text-[#6ba3ff] transition-colors ml-auto"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => copyText(s.description, s.id)}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                              >
                                {copiedId === s.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-[var(--radius-md)] px-3 py-2.5 flex items-center gap-2">
                    <Loader2 size={13} className="text-[var(--accent-text)] animate-spin" />
                    <span className="text-[11px] text-[var(--text-secondary)]">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Ask about ${studio}...`}
                  className="tool-input flex-1 py-1.5 text-[12px]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="tool-btn-primary p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
