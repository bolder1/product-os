'use client'

import { motion } from 'framer-motion'
import {
  AlertCircle,
  Target,
  Users,
  Layers,
  Database,
  LayoutGrid,
  CheckCircle2,
  Check,
} from 'lucide-react'

export interface StepInfo {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: StepInfo[] = [
  { number: 1, title: 'Problem', description: 'What problem are you solving?', icon: <AlertCircle className="w-4 h-4" /> },
  { number: 2, title: 'Goals', description: 'What are your goals?', icon: <Target className="w-4 h-4" /> },
  { number: 3, title: 'Audience', description: 'Who are your users?', icon: <Users className="w-4 h-4" /> },
  { number: 4, title: 'Features', description: 'What features do you need?', icon: <Layers className="w-4 h-4" /> },
  { number: 5, title: 'Entities', description: 'What data entities exist?', icon: <Database className="w-4 h-4" /> },
  { number: 6, title: 'Studios', description: 'Which studios to activate?', icon: <LayoutGrid className="w-4 h-4" /> },
  { number: 7, title: 'Review', description: 'Review & launch', icon: <CheckCircle2 className="w-4 h-4" /> },
]

interface StepProgressProps {
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (step: number) => void
}

export default function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  return (
    <div className="w-full px-4 py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-[2.5rem] right-[2.5rem] h-px bg-white/[0.08]" />
        <div
          className="absolute top-5 left-[2.5rem] h-px bg-[#8B5CF6]/40 transition-all duration-500"
          style={{ width: `${((Math.min(currentStep, 7) - 1) / 6) * (100 - (5 / 6) * 100 / 7)}%` }}
        />

        {steps.map((step) => {
          const isActive = step.number === currentStep
          const isCompleted = completedSteps.has(step.number)
          const isPast = step.number < currentStep

          return (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className="flex flex-col items-center gap-1.5 relative z-10 group cursor-pointer"
            >
              {/* Circle */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-colors duration-300 border
                  ${isActive
                    ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                    : isCompleted || isPast
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'bg-white/[0.03] border-white/[0.08] text-[#64748B]'
                  }
                `}
                animate={isActive ? { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' } : { boxShadow: '0 0 0px transparent' }}
              >
                {isCompleted || isPast ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{step.number}</span>
                )}
              </motion.div>

              {/* Title */}
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-[#F1F5F9]' : isPast || isCompleted ? 'text-[#94A3B8]' : 'text-[#64748B]'
              }`}>
                {step.title}
              </span>

              {/* Description tooltip on hover */}
              <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#181E3A] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#94A3B8] whitespace-nowrap shadow-lg">
                  {step.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { steps }
