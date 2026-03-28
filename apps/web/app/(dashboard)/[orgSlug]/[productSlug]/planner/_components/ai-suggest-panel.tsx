'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, ChevronLeft, Send, Zap } from 'lucide-react'

const mockSuggestions: Record<number, Array<{ text: string; confidence: number }>> = {
  1: [
    { text: 'Consider defining the core job-to-be-done for your users', confidence: 95 },
    { text: 'Add metrics for how you\'ll measure the problem is solved', confidence: 88 },
    { text: 'Think about what happens if this problem isn\'t solved', confidence: 82 },
  ],
  2: [
    { text: 'Add a user retention goal — it\'s often overlooked', confidence: 92 },
    { text: 'Consider adding NPS or satisfaction tracking', confidence: 85 },
    { text: 'Set a measurable timeline for each goal', confidence: 90 },
  ],
  3: [
    { text: 'Consider a power-user persona vs. a casual user', confidence: 88 },
    { text: 'Add decision-maker persona for B2B products', confidence: 84 },
    { text: 'Define what "success" looks like for each persona', confidence: 80 },
  ],
  4: [
    { text: 'Consider authentication and user management first', confidence: 95 },
    { text: 'Add search functionality for better discoverability', confidence: 87 },
    { text: 'Consider offline support for mobile users', confidence: 72 },
  ],
  5: [
    { text: 'Add a "User" entity with roles and permissions', confidence: 93 },
    { text: 'Consider audit trail fields (createdAt, updatedAt)', confidence: 90 },
    { text: 'Add soft-delete support with a "deletedAt" field', confidence: 78 },
  ],
  6: [
    { text: 'Analytics Studio pairs well with your growth goals', confidence: 91 },
    { text: 'Enable Workflow Studio for automation potential', confidence: 86 },
    { text: 'Templates Studio can speed up content creation', confidence: 83 },
  ],
  7: [
    { text: 'Your plan looks solid! Consider adding success metrics', confidence: 90 },
    { text: 'Review entity relationships before launching', confidence: 85 },
    { text: 'Consider starting with a template to save time', confidence: 88 },
  ],
}

interface AISuggestPanelProps {
  currentStep: number
  onApplySuggestion?: (suggestion: string) => void
}

export default function AISuggestPanel({ currentStep, onApplySuggestion }: AISuggestPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const suggestions = mockSuggestions[currentStep] || []

  const confidenceColor = (c: number) => {
    if (c >= 90) return 'text-[#10B981] bg-[#10B981]/10'
    if (c >= 80) return 'text-[#F59E0B] bg-[#F59E0B]/10'
    return 'text-[#94A3B8] bg-white/[0.05]'
  }

  return (
    <div className="relative h-full flex">
      {/* Violet gradient border on the left */}
      <div className="w-px bg-gradient-to-b from-[#8B5CF6]/40 via-[#8B5CF6]/10 to-transparent" />

      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(false)}
            className="flex flex-col items-center gap-2 py-6 px-2 hover:bg-white/[0.03] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <ChevronLeft className="w-3 h-3 text-[#64748B]" />
            <span className="text-[10px] text-[#64748B] writing-mode-vertical [writing-mode:vertical-lr] rotate-180">
              AI Suggestions
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full w-full min-w-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-sm font-medium text-[#F1F5F9]">AI Suggestions</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded-md hover:bg-white/[0.05] transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            {/* Streaming indicator */}
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-[#8B5CF6]">
              <div className="flex gap-0.5">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className="w-1 h-1 rounded-full bg-[#8B5CF6]"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="w-1 h-1 rounded-full bg-[#8B5CF6]"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className="w-1 h-1 rounded-full bg-[#8B5CF6]"
                />
              </div>
              <span>Analyzing your input...</span>
            </div>

            {/* Suggestions list */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={`${currentStep}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 group hover:border-[#8B5CF6]/30 transition-all"
                >
                  <p className="text-sm text-[#94A3B8] leading-relaxed mb-2">
                    {suggestion.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${confidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence}% match
                    </span>
                    <button
                      onClick={() => onApplySuggestion?.(suggestion.text)}
                      className="flex items-center gap-1 text-xs text-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#8B5CF6]/80"
                    >
                      <Zap className="w-3 h-3" />
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Query input */}
            <div className="p-3 border-t border-white/[0.08]">
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 focus-within:border-[#8B5CF6]/50 transition-colors">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI anything about your product..."
                  className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      setQuery('')
                    }
                  }}
                />
                <button
                  className="p-1 rounded-md hover:bg-white/[0.05] transition-colors text-[#64748B] hover:text-[#8B5CF6]"
                  onClick={() => {
                    if (query.trim()) setQuery('')
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
