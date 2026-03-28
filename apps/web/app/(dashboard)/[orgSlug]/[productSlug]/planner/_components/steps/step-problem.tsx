'use client'

import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

const quickPrompts: Array<{ label: string; template: string }> = [
  {
    label: 'SaaS Platform',
    template:
      'We are building a SaaS platform that helps businesses streamline their operations. Current solutions are fragmented and expensive, forcing teams to juggle multiple tools. Our platform will provide a unified experience that reduces tool sprawl and increases team productivity.',
  },
  {
    label: 'Internal Tool',
    template:
      'Our internal team wastes significant time on manual, repetitive processes that could be automated. There is no centralized system for managing workflows, tracking tasks, and generating reports. We need an internal tool that brings everything into one place and reduces operational overhead.',
  },
  {
    label: 'Mobile App',
    template:
      'Users need a mobile-first experience to accomplish key tasks on the go. Existing solutions are desktop-only or have poor mobile experiences. We are building a native-feeling mobile app that makes the core workflow fast, intuitive, and available anywhere.',
  },
  {
    label: 'E-commerce',
    template:
      'Online sellers struggle with managing their storefront, inventory, and customer relationships across multiple channels. We are building an e-commerce platform that unifies product management, order fulfillment, and customer engagement in one system.',
  },
  {
    label: 'Marketplace',
    template:
      'Connecting buyers and sellers in our niche is inefficient — discovery is poor, trust is lacking, and transactions are manual. We are building a marketplace that makes it easy to discover, evaluate, and transact with confidence.',
  },
]

interface StepProblemProps {
  value: string
  onChange: (value: string) => void
}

export default function StepProblem({ value, onChange }: StepProblemProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">What problem are you solving?</h2>
        <p className="text-[#94A3B8] text-sm">
          Describe the core problem your product addresses. Be specific about who experiences it and why existing solutions fall short.
        </p>
      </div>

      {/* Quick prompt chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Quick start — click a template:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <motion.button
              key={prompt.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(prompt.template)}
              className="px-3 py-1.5 text-xs rounded-full bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] hover:border-[#8B5CF6]/30 hover:text-[#F1F5F9] transition-all"
            >
              {prompt.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="Describe the problem your product solves...&#10;&#10;Example: Teams waste hours every week switching between disconnected tools for project management, communication, and reporting. There's no single source of truth, leading to missed deadlines and duplicated effort..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[#F1F5F9] text-sm leading-relaxed placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/20 resize-none transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-[#64748B]">
          {value.length} characters
        </div>
      </div>
    </div>
  )
}
