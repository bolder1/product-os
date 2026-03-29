'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  Zap,
} from 'lucide-react'

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
    { id: 's2', title: 'Conversion funnel drop-off', description: 'Step 3 of signup has a 45% drop-off. The form has 8 fields — consider progressive disclosure.', confidence: 0.93, category: 'conversion' },
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
  { skill: 'scaffold', label: 'Scaffold', icon: Wand2, color: '#8B5CF6' },
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

  const handleSend = () => {
    if (!input.trim() || isThinking) return

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    // Simulate AI response
    setTimeout(() => {
      const suggestions = getSuggestions()
      const assistantMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `Based on your ${studio} studio context, here are my recommendations:`,
        suggestions: suggestions.slice(0, 3),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsThinking(false)
    }, 1200 + Math.random() * 800)
  }

  const handleQuickAction = (skill: AISkillType) => {
    const prompts: Record<AISkillType, string> = {
      suggest: `Suggest improvements for my ${studio} studio`,
      scaffold: `Scaffold the next steps for ${studio}`,
      analyze: `Analyze the current state of ${studio}`,
    }

    setInput(prompts[skill])
    setTimeout(() => {
      const userMsg: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: prompts[skill],
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsThinking(true)

      setTimeout(() => {
        const suggestions = getSuggestions()
        const assistantMsg: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: skill === 'analyze'
            ? `Here's my analysis of your ${studio} studio:`
            : skill === 'scaffold'
            ? `I can scaffold the following for your ${studio} studio:`
            : `Here are my suggestions for your ${studio} studio:`,
          suggestions,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        setIsThinking(false)
      }, 1500 + Math.random() * 1000)

      setInput('')
    }, 100)
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg transition-colors group ${className}`}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={18} />
            </motion.div>
            <span className="text-sm font-medium">AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-screen w-[380px] flex flex-col bg-[#0a0f1e]/95 backdrop-blur-xl border-r border-white/[0.08] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#F1F5F9]">AI Assistant</h2>
                    <p className="text-[10px] text-[#64748B] capitalize">{studio} Studio</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
                {skillQuickActions.map(({ skill, label, icon: Icon, color }) => (
                  <button
                    key={skill}
                    onClick={() => handleQuickAction(skill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium transition-colors hover:bg-white/[0.06]"
                    style={{ color, backgroundColor: `${color}10` }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Context hints */}
              {contextHints.length > 0 && (
                <div className="px-5 py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap size={10} className="text-[#F59E0B]" />
                    <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium">Context</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contextHints.map((hint, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[#94A3B8]">
                        {hint}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #8B5CF610, #6366F110)' }}>
                      <Sparkles size={24} className="text-[#8B5CF6]" />
                    </div>
                    <p className="text-sm text-[#94A3B8] mb-1">AI-powered assistant</p>
                    <p className="text-xs text-[#64748B] max-w-[240px]">
                      Ask questions, get suggestions, scaffold content, or analyze your {studio} studio.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#6366F1]/20 border-[#6366F1]/20' : 'bg-white/[0.03] border-white/[0.06]'} rounded-xl px-4 py-3 border`}>
                      <p className="text-[0.8125rem] text-[#E2E8F0] leading-relaxed">{msg.content}</p>

                      {msg.suggestions && (
                        <div className="mt-3 space-y-2">
                          {msg.suggestions.map((s) => (
                            <div
                              key={s.id}
                              className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/[0.05] hover:border-[#8B5CF6]/20 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#F1F5F9]">{s.title}</p>
                                  <p className="text-[0.6875rem] text-[#94A3B8] mt-1 leading-relaxed">{s.description}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-medium shrink-0">
                                  {Math.round(s.confidence * 100)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {s.category && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-[#64748B]">
                                    {s.category}
                                  </span>
                                )}
                                <button
                                  onClick={() => onApplySuggestion?.(s)}
                                  className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] transition-colors ml-auto"
                                >
                                  Apply
                                </button>
                                <button
                                  onClick={() => copyText(s.description, s.id)}
                                  className="text-[#64748B] hover:text-[#94A3B8] transition-colors"
                                >
                                  {copiedId === s.id ? <Check size={10} className="text-[#10B981]" /> : <Copy size={10} />}
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
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-2">
                      <Loader2 size={14} className="text-[#8B5CF6] animate-spin" />
                      <span className="text-xs text-[#94A3B8]">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.08]">
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-[#8B5CF6]/30 transition-colors">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Ask about ${studio}...`}
                    className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="p-1.5 rounded-lg text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
