'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Sparkles, CheckSquare, Square, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { type HandoffItem } from '../_data/mock-handoffs'

interface SpecDetailProps {
  item: HandoffItem | null
  onClose: () => void
}

const typeConfig: Record<string, { label: string; color: string }> = {
  component: { label: 'Component', color: '#3B82F6' },
  page: { label: 'Page', color: '#8B5CF6' },
  token: { label: 'Token', color: '#F59E0B' },
}

export function SpecDetail({ item, onClose }: SpecDetailProps) {
  const [copied, setCopied] = useState(false)

  if (!item) return null

  const typeInfo = typeConfig[item.type]

  const handleCopySpec = () => {
    const specText = [
      `# ${item.name} (${typeInfo.label})`,
      '',
      '## Specifications',
      ...item.specs.map((s) => `- ${s.property}: ${s.value} (${s.description})`),
      '',
      '## Design Tokens',
      ...item.tokens.map((t) => `- ${t.name}: ${t.value}`),
      '',
      '## Acceptance Criteria',
      ...item.criteria.map((c) => `- [${c.done ? 'x' : ' '}] ${c.text}`),
    ].join('\n')

    navigator.clipboard.writeText(specText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[85vh] overflow-auto bg-[#0a0f1e] rounded-2xl border border-white/[0.08] shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/[0.08] bg-[#0a0f1e]/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#64748B]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#F1F5F9]">{item.name}</h2>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: typeInfo.color,
                      backgroundColor: `${typeInfo.color}15`,
                    }}
                  >
                    {typeInfo.label}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{item.completeness}% complete</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySpec}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Spec'}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                AI: Generate criteria
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Visual preview */}
            <div>
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
                Preview
              </h3>
              <div
                className="h-32 rounded-xl flex items-center justify-center border border-white/[0.08]"
                style={{ backgroundColor: `${item.previewColor}08` }}
              >
                <div
                  className="px-8 py-4 rounded-xl border-2 border-dashed"
                  style={{
                    borderColor: `${item.previewColor}30`,
                    backgroundColor: `${item.previewColor}10`,
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: item.previewColor }}>
                    {item.name} Preview
                  </span>
                </div>
              </div>
            </div>

            {/* Specs table */}
            <div>
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
                Specifications
              </h3>
              <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Property</th>
                      <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Type</th>
                      <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Value</th>
                      <th className="text-left px-4 py-2.5 text-[#64748B] font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.specs.map((spec, i) => (
                      <motion.tr
                        key={spec.property}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={i % 2 === 0 ? 'bg-white/[0.01]' : 'bg-white/[0.03]'}
                      >
                        <td className="px-4 py-2.5 text-[#F1F5F9] font-mono">{spec.property}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B]">
                            {spec.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#06B6D4] font-mono">{spec.value}</td>
                        <td className="px-4 py-2.5 text-[#94A3B8]">{spec.description}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CSS Tokens */}
            <div>
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
                Design Tokens
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {item.tokens.map((token, i) => (
                  <motion.div
                    key={token.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    {token.type === 'color' ? (
                      <div
                        className="w-6 h-6 rounded-lg border border-white/[0.1] flex-shrink-0"
                        style={{ backgroundColor: token.value }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-[#64748B]">{token.type[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-[#F1F5F9] truncate">{token.name}</p>
                      <p className="text-[10px] text-[#64748B] font-mono">{token.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Spacing annotations */}
            <div>
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
                Spacing Annotations
              </h3>
              <div className="flex items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="relative">
                  {/* Margin area */}
                  <div className="border-2 border-dashed border-[#F59E0B]/20 rounded-xl p-4">
                    <span className="absolute -top-2.5 left-3 text-[9px] text-[#F59E0B] bg-[#0a0f1e] px-1">
                      margin
                    </span>
                    {/* Padding area */}
                    <div className="border-2 border-dashed border-[#06B6D4]/20 rounded-lg p-4">
                      <span className="absolute top-5 left-7 text-[9px] text-[#06B6D4] bg-[#0a0f1e] px-1">
                        padding
                      </span>
                      {/* Content */}
                      <div
                        className="w-32 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.previewColor}15` }}
                      >
                        <span className="text-[10px] text-[#94A3B8]">Content</span>
                      </div>
                    </div>
                  </div>
                  {/* Spacing values */}
                  <div className="flex justify-between mt-2 text-[9px] text-[#64748B] font-mono">
                    {item.specs
                      .filter((s) => s.type === 'spacing')
                      .slice(0, 3)
                      .map((s) => (
                        <span key={s.property}>
                          {s.property}: {s.value}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Acceptance criteria */}
            <div>
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
                Acceptance Criteria
              </h3>
              <div className="space-y-2">
                {item.criteria.map((criterion, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    {criterion.done ? (
                      <CheckSquare className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-[#64748B] flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        criterion.done ? 'text-[#94A3B8]' : 'text-[#F1F5F9]'
                      }`}
                    >
                      {criterion.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
