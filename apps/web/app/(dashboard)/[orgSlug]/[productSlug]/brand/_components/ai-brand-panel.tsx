'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight, Wand2 } from 'lucide-react'
import type { ColorGroup } from '../_data/default-brand'
import { aiPaletteSuggestions, generateScale } from '../_data/default-brand'
import type { AIPaletteSuggestion } from '../_data/default-brand'

interface AIBrandPanelProps {
  onApplyPalette: (groups: ColorGroup[]) => void
  collapsed: boolean
  onToggle: () => void
}

function buildColorGroups(suggestion: AIPaletteSuggestion): ColorGroup[] {
  const mapping: Record<string, { label: string; semantic: string }> = {
    primary: { label: 'Primary', semantic: 'Main brand color, CTAs, links' },
    secondary: { label: 'Secondary', semantic: 'Supporting actions, secondary buttons' },
    accent: { label: 'Accent', semantic: 'Highlights, decorative elements' },
    neutral: { label: 'Neutral', semantic: 'Backgrounds, borders, muted text' },
    success: { label: 'Success', semantic: 'Confirmations, positive states' },
    warning: { label: 'Warning', semantic: 'Caution states, attention required' },
  }

  return Object.entries(suggestion.colors).map(([key, base]) => ({
    id: key,
    label: mapping[key]?.label ?? key,
    semantic: mapping[key]?.semantic ?? '',
    token: {
      name: key,
      base,
      scale: generateScale(base),
    },
  }))
}

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: AIPaletteSuggestion
  onApply: () => void
}) {
  const colorDots = Object.values(suggestion.colors)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#EC4899]/20 transition-colors cursor-pointer group"
      onClick={onApply}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#F1F5F9]">{suggestion.name}</h4>
        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#EC4899] transition-colors" />
      </div>
      <p className="text-xs text-[#64748B] mb-3">{suggestion.description}</p>
      <div className="flex items-center gap-1.5">
        {colorDots.map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function AIBrandPanel({
  onApplyPalette,
  collapsed,
  onToggle,
}: AIBrandPanelProps) {
  const [prompt, setPrompt] = useState('')

  const handleApply = (suggestion: AIPaletteSuggestion) => {
    const groups = buildColorGroups(suggestion)
    onApplyPalette(groups)
  }

  return (
    <>
      {/* Collapsed Toggle */}
      {collapsed && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onToggle}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-xl bg-[#EC4899]/10 border border-[#EC4899]/20 text-[#EC4899] hover:bg-[#EC4899]/20 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 border-l border-white/[0.08] bg-white/[0.01] overflow-hidden"
          >
            <div className="w-[320px] h-full flex flex-col p-4 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EC4899]" />
                  <h3 className="text-sm font-semibold text-[#F1F5F9]">AI Brand Assistant</h3>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt */}
              <div className="mb-4">
                <label className="text-xs text-[#64748B] mb-1.5 block">
                  Describe your brand
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A modern fintech platform that feels trustworthy and innovative..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#EC4899]/50 resize-none"
                />
                <button className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                  Presets
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                {aiPaletteSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={() => handleApply(suggestion)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
