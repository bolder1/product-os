'use client'

import { useState, useCallback, useEffect } from 'react'
import WizardShell from './_components/wizard-shell'
import StepVision from './_components/steps/step-vision'
import StepUsersFeatures from './_components/steps/step-users-features'
import StepArchitecture from './_components/steps/step-architecture'
import StepReviewLaunch from './_components/steps/step-review-launch'
import TemplateStartModal from './_components/template-start-modal'
import { generateTasksFromPlan, type GeneratedTask } from './_lib/task-generator'

export interface PlanData {
  problem: string
  goals: Array<{ id: string; text: string; category: string }>
  personas: Array<{ id: string; name: string; role: string; painPoint: string }>
  features: Array<{ id: string; name: string; description: string; priority: 'must-have' | 'should-have' | 'nice-to-have' }>
  entities: Array<{ id: string; name: string; fields: Array<{ name: string; type: string }> }>
  activeStudios: string[]
}

const TOTAL_STEPS = 4

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
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(step)
      return next
    })
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS) return
      setDirection(step > currentStep ? 1 : -1)
      setCurrentStep(step)
    },
    [currentStep],
  )

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
    // Mark steps 1-3 as completed when applying a template
    setCompletedSteps(new Set([1, 2, 3]))
    setDirection(1)
    setCurrentStep(4)
  }, [])

  const handleLaunch = useCallback(() => {
    alert(
      'Product launched! (This is a placeholder — the product creation flow will be implemented in the next phase.)',
    )
  }, [])

  const updatePlanData = useCallback(<K extends keyof PlanData>(key: K, value: PlanData[K]) => {
    setPlanData((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Auto-generate tasks when reaching step 4 or when planData features change while on step 4
  useEffect(() => {
    if (currentStep === 4) {
      const tasks = generateTasksFromPlan(planData)
      setGeneratedTasks(tasks)
    }
  }, [currentStep, planData])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepVision
            problem={planData.problem}
            goals={planData.goals}
            onProblemChange={(v) => updatePlanData('problem', v)}
            onGoalsChange={(v) => updatePlanData('goals', v)}
          />
        )
      case 2:
        return (
          <StepUsersFeatures
            personas={planData.personas}
            features={planData.features}
            onPersonasChange={(v) => updatePlanData('personas', v)}
            onFeaturesChange={(v) => updatePlanData('features', v)}
          />
        )
      case 3:
        return (
          <StepArchitecture
            entities={planData.entities}
            activeStudios={planData.activeStudios}
            onEntitiesChange={(v) => updatePlanData('entities', v)}
            onStudiosChange={(v) => updatePlanData('activeStudios', v)}
          />
        )
      case 4:
        return (
          <StepReviewLaunch
            planData={planData}
            onEditStep={goToStep}
            onLaunch={handleLaunch}
            generatedTasks={generatedTasks}
            onTasksChange={setGeneratedTasks}
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
