'use client'

import { useState, useCallback } from 'react'
import WizardShell from './_components/wizard-shell'
import StepProblem from './_components/steps/step-problem'
import StepGoals from './_components/steps/step-goals'
import StepAudience from './_components/steps/step-audience'
import StepFeatures from './_components/steps/step-features'
import StepEntities from './_components/steps/step-entities'
import StepStudios from './_components/steps/step-studios'
import StepReview from './_components/steps/step-review'
import TemplateStartModal from './_components/template-start-modal'

export interface PlanData {
  problem: string
  goals: Array<{ id: string; text: string; category: string }>
  personas: Array<{ id: string; name: string; role: string; painPoints: string[]; needs: string[] }>
  features: Array<{ id: string; name: string; description: string; priority: 'must-have' | 'should-have' | 'nice-to-have' }>
  entities: Array<{ id: string; name: string; description: string; fields: Array<{ name: string; type: string }> }>
  activeStudios: string[]
}

const TOTAL_STEPS = 7

const initialPlanData: PlanData = {
  problem: '',
  goals: [],
  personas: [],
  features: [],
  entities: [],
  activeStudios: ['planner'],
}

export default function ProductPlannerPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [planData, setPlanData] = useState<PlanData>(initialPlanData)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [templateModalOpen, setTemplateModalOpen] = useState(false)

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(step)
      return next
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > TOTAL_STEPS) return
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }, [currentStep])

  const handleNext = useCallback(() => {
    markStepCompleted(currentStep)
    if (currentStep < TOTAL_STEPS) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep, markStepCompleted])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }, [currentStep])

  const handleApplyTemplate = useCallback((data: PlanData) => {
    setPlanData(data)
    // Mark all steps as completed when applying a template
    setCompletedSteps(new Set([1, 2, 3, 4, 5, 6]))
    setDirection(1)
    setCurrentStep(7)
  }, [])

  const handleLaunch = useCallback(() => {
    // Placeholder: In the future this will actually create the product
    alert('Product launched! (This is a placeholder — the product creation flow will be implemented in the next phase.)')
  }, [])

  const updatePlanData = useCallback(<K extends keyof PlanData>(key: K, value: PlanData[K]) => {
    setPlanData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepProblem
            value={planData.problem}
            onChange={(v) => updatePlanData('problem', v)}
          />
        )
      case 2:
        return (
          <StepGoals
            goals={planData.goals}
            onChange={(v) => updatePlanData('goals', v)}
          />
        )
      case 3:
        return (
          <StepAudience
            personas={planData.personas}
            onChange={(v) => updatePlanData('personas', v)}
          />
        )
      case 4:
        return (
          <StepFeatures
            features={planData.features}
            onChange={(v) => updatePlanData('features', v)}
          />
        )
      case 5:
        return (
          <StepEntities
            entities={planData.entities}
            onChange={(v) => updatePlanData('entities', v)}
          />
        )
      case 6:
        return (
          <StepStudios
            activeStudios={planData.activeStudios}
            onChange={(v) => updatePlanData('activeStudios', v)}
          />
        )
      case 7:
        return (
          <StepReview
            planData={planData}
            onEditStep={goToStep}
            onOpenTemplateModal={() => setTemplateModalOpen(true)}
            onLaunch={handleLaunch}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#060918]">
      <WizardShell
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        completedSteps={completedSteps}
        direction={direction}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        onStepClick={goToStep}
      >
        {renderStep()}
      </WizardShell>

      <TemplateStartModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  )
}
