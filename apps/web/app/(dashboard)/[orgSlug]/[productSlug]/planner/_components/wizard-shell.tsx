'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import StepProgress from './step-progress'
import AISuggestPanel from './ai-suggest-panel'

interface WizardShellProps {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  direction: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onStepClick: (step: number) => void
  onApplySuggestion?: (suggestion: string) => void
  children: React.ReactNode
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

export default function WizardShell({
  currentStep,
  totalSteps,
  completedSteps,
  direction,
  onNext,
  onBack,
  onSkip,
  onStepClick,
  onApplySuggestion,
  children,
}: WizardShellProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  return (
    <div className="flex flex-col h-full">
      {/* Top: Step Progress */}
      <div className="flex-shrink-0 border-b border-white/[0.08] bg-white/[0.01]">
        <StepProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />
      </div>

      {/* Middle: Content + AI Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Step Content (~65%) */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: AI Panel (~35%) */}
        <div className="w-[340px] flex-shrink-0 border-l-0 overflow-hidden">
          <AISuggestPanel
            currentStep={currentStep}
            onApplySuggestion={onApplySuggestion}
          />
        </div>
      </div>

      {/* Bottom: Navigation */}
      <div className="flex-shrink-0 border-t border-white/[0.08] bg-white/[0.01] px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Back */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isFirstStep
                ? 'opacity-30 cursor-not-allowed text-[var(--text-tertiary)]'
                : 'bg-white/[0.05] border border-white/[0.08] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </motion.button>

          {/* Center: Step counter */}
          <span className="text-xs text-[var(--text-tertiary)]">
            Step {currentStep} of {totalSteps}
          </span>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSkip}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip
                <SkipForward className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {!isLastStep && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
