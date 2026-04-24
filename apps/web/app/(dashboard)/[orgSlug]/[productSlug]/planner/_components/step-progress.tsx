'use client'

import { motion } from 'framer-motion'
import { Lightbulb, Users, GitBranch, Rocket, Check } from 'lucide-react'

export interface StepInfo {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: StepInfo[] = [
  { number: 1, title: 'Vision', description: 'Define your product vision', icon: <Lightbulb className="w-4 h-4" /> },
  { number: 2, title: 'Users & Features', description: 'Who and what', icon: <Users className="w-4 h-4" /> },
  { number: 3, title: 'Architecture', description: 'Data & studio setup', icon: <GitBranch className="w-4 h-4" /> },
  { number: 4, title: 'Review & Launch', description: 'Review and launch', icon: <Rocket className="w-4 h-4" /> },
]

interface StepProgressProps {
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (step: number) => void
}

export default function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  return (
    <div className="w-full px-4 py-4">
      <div className="flex items-center justify-between relative max-w-xl mx-auto">
        {/* Connecting line (background) */}
        <div className="absolute top-5 left-[2.5rem] right-[2.5rem] h-px bg-white/[0.08]" />
        {/* Connecting line (progress) */}
        <div
          className="absolute top-5 left-[2.5rem] h-px bg-[var(--accent)]/40 transition-all duration-500"
          style={{ width: `${((Math.min(currentStep, 4) - 1) / 3) * 100}%` }}
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
                  ${
                    isActive
                      ? 'bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]'
                      : isCompleted || isPast
                        ? 'bg-[var(--color-success)]/20 border-[var(--color-success)] text-[var(--color-success)]'
                        : 'bg-white/[0.03] border-white/[0.08] text-[var(--text-tertiary)]'
                  }
                `}
                animate={
                  isActive
                    ? { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }
                    : { boxShadow: '0 0 0px transparent' }
                }
              >
                {isCompleted || isPast ? <Check className="w-4 h-4" /> : step.icon}
              </motion.div>

              {/* Title */}
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-[var(--text-primary)]' : isPast || isCompleted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {step.title}
              </span>

              {/* Description tooltip on hover */}
              <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#181E3A] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] whitespace-nowrap shadow-lg">
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
