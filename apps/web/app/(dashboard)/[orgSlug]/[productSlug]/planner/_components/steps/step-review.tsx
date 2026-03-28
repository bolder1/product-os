'use client'

import { motion } from 'framer-motion'
import {
  AlertCircle,
  Target,
  Users,
  Layers,
  Database,
  LayoutGrid,
  FileText,
  Rocket,
  Edit3,
  Check,
} from 'lucide-react'
import type { PlanData } from '../../page'

interface StepReviewProps {
  planData: PlanData
  onEditStep: (step: number) => void
  onOpenTemplateModal: () => void
  onLaunch: () => void
}

export default function StepReview({ planData, onEditStep, onOpenTemplateModal, onLaunch }: StepReviewProps) {
  const sections = [
    {
      step: 1,
      title: 'Problem Statement',
      icon: <AlertCircle className="w-4 h-4" />,
      content: planData.problem || 'Not defined yet',
      isEmpty: !planData.problem,
    },
    {
      step: 2,
      title: 'Goals',
      icon: <Target className="w-4 h-4" />,
      content: `${planData.goals.length} goal${planData.goals.length !== 1 ? 's' : ''} defined`,
      isEmpty: planData.goals.length === 0,
      items: planData.goals.map((g) => g.text),
    },
    {
      step: 3,
      title: 'User Personas',
      icon: <Users className="w-4 h-4" />,
      content: `${planData.personas.length} persona${planData.personas.length !== 1 ? 's' : ''} defined`,
      isEmpty: planData.personas.length === 0,
      items: planData.personas.map((p) => `${p.name} — ${p.role}`),
    },
    {
      step: 4,
      title: 'Features',
      icon: <Layers className="w-4 h-4" />,
      content: `${planData.features.length} feature${planData.features.length !== 1 ? 's' : ''} defined`,
      isEmpty: planData.features.length === 0,
      items: planData.features.map((f) => `${f.name} (${f.priority})`),
    },
    {
      step: 5,
      title: 'Data Entities',
      icon: <Database className="w-4 h-4" />,
      content: `${planData.entities.length} entit${planData.entities.length !== 1 ? 'ies' : 'y'} defined`,
      isEmpty: planData.entities.length === 0,
      items: planData.entities.map((e) => `${e.name} (${e.fields.length} fields)`),
    },
    {
      step: 6,
      title: 'Active Studios',
      icon: <LayoutGrid className="w-4 h-4" />,
      content: `${planData.activeStudios.length} studio${planData.activeStudios.length !== 1 ? 's' : ''} active`,
      isEmpty: planData.activeStudios.length === 0,
      items: planData.activeStudios,
    },
  ]

  const completionCount = sections.filter((s) => !s.isEmpty).length
  const completionPercent = Math.round((completionCount / sections.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Review & Launch</h2>
        <p className="text-[#94A3B8] text-sm">
          Review your product plan before launching. Click any section to edit.
        </p>
      </div>

      {/* Completion bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94A3B8]">Plan completion</span>
          <span className="text-[#8B5CF6] font-semibold">{completionPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onEditStep(section.step)}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 cursor-pointer hover:border-[#8B5CF6]/30 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                section.isEmpty ? 'bg-white/[0.05] text-[#64748B]' : 'bg-[#10B981]/10 text-[#10B981]'
              }`}>
                {section.isEmpty ? section.icon : <Check className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium text-[#F1F5F9]">{section.title}</p>
                  <Edit3 className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {section.step === 1 && !section.isEmpty ? (
                  <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">{planData.problem}</p>
                ) : (
                  <p className={`text-xs ${section.isEmpty ? 'text-[#64748B] italic' : 'text-[#94A3B8]'}`}>
                    {section.content}
                  </p>
                )}

                {section.items && section.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {section.items.slice(0, 5).map((item, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B]">
                        {item}
                      </span>
                    ))}
                    {section.items.length > 5 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B]">
                        +{section.items.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenTemplateModal}
          className="flex items-center gap-2 px-5 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-[#F1F5F9] hover:bg-white/[0.08] transition-colors font-medium"
        >
          <FileText className="w-4 h-4 text-[#8B5CF6]" />
          Start from Template
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLaunch}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm text-white font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#8B5CF6]/90 hover:to-[#7C3AED]/90 transition-all shadow-lg shadow-[#8B5CF6]/20"
        >
          <Rocket className="w-4 h-4" />
          Launch Product
        </motion.button>
      </div>
    </div>
  )
}
