'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, SkipForward, Check, LayoutTemplate, Network, Layers, GitBranch, CheckSquare } from 'lucide-react'
import StepVision from './_components/steps/step-vision'
import StepUsersFeatures from './_components/steps/step-users-features'
import StepArchitecture from './_components/steps/step-architecture'
import StepReviewLaunch from './_components/steps/step-review-launch'
import TemplateStartModal from './_components/template-start-modal'
import AISuggestPanel from './_components/ai-suggest-panel'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { generateTasksFromPlan, type GeneratedTask } from './_lib/task-generator'
import { useTaskStore } from '../../../../lib/task-store'
import { useGraphStore } from '../../../../lib/graph-store'
import { useActivityStore } from '../../../../lib/activity-store'
import { useNotificationStore } from '../../../../lib/notification-store'
import { useAuthStore } from '../../../../lib/auth-store'
import { eventBus, makeActor } from '../../../../lib/event-bus'
import { useParams, useRouter } from 'next/navigation'
import { useProduct } from '../layout'
import { trpcMutate } from '../../../../lib/api'

export interface PlanData {
  problem: string
  goals: Array<{ id: string; text: string; category: string }>
  personas: Array<{ id: string; name: string; role: string; painPoint: string }>
  features: Array<{ id: string; name: string; description: string; priority: 'must-have' | 'should-have' | 'nice-to-have' }>
  entities: Array<{ id: string; name: string; fields: Array<{ name: string; type: string }> }>
  activeStudios: string[]
}

const TOTAL_STEPS = 4

const STEP_LABELS = ['Vision', 'Users & Features', 'Architecture', 'Review & Launch']

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

  const params = useParams()
  const router = useRouter()
  const currentProduct = useProduct()
  const bulkAddTasks = useTaskStore((s) => s.bulkAddTasks)
  const scaffoldProduct = useGraphStore((s) => s.scaffoldProduct)
  const bulkAddNodes = useGraphStore((s) => s.bulkAddNodes)
  const addEdge = useGraphStore((s) => s.addEdge)
  const addNode = useGraphStore((s) => s.addNode)
  const addActivity = useActivityStore((s) => s.addActivity)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const userName = useAuthStore((s) => s.user?.name ?? 'Unknown')
  const productId = currentProduct?.id ?? `${params.orgSlug}-${params.productSlug}`

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
    setCompletedSteps(new Set([1, 2, 3]))
    setDirection(1)
    setCurrentStep(4)
  }, [])

  const [isLaunching, setIsLaunching] = useState(false)
  const [launchPhase, setLaunchPhase] = useState<string>('')

  const handleLaunch = useCallback(async () => {
    if (isLaunching) return
    setIsLaunching(true)

    const productName = currentProduct?.name ?? String(params.productSlug).replace(/-/g, ' ')
    const orgSlug = String(params.orgSlug)

    try {
      // ── 1. Write to local stores (optimistic) ──
      scaffoldProduct(productId, productName)

      bulkAddNodes(
        planData.features.map((f) => ({
          kind: 'feature' as const,
          label: f.name,
          productId,
          data: { description: f.description, priority: f.priority },
        }))
      )

      bulkAddNodes(
        planData.entities.map((e) => ({
          kind: 'entity' as const,
          label: e.name,
          productId,
          data: { fields: e.fields },
        }))
      )

      addNode({
        kind: 'plan',
        label: `${productName} Plan`,
        productId,
        data: {
          problem: planData.problem,
          goals: planData.goals,
          personas: planData.personas,
          activeStudios: planData.activeStudios,
        },
      })

      const taskEntries = generatedTasks.map((gt) => ({
        title: gt.title,
        description: gt.description || '',
        status: 'todo' as const,
        priority: gt.priority,
        assignee: {
          id: gt.role.toLowerCase().replace(/\s+/g, '-'),
          name: `Unassigned (${gt.role})`,
          initials: gt.role.split(' ').map((w) => w[0]).join('').slice(0, 2),
          role: gt.role,
        },
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        studio: gt.studio,
        feature: gt.feature,
        productId,
        role: gt.role,
        tags: [gt.effort],
      }))
      bulkAddTasks(taskEntries)

      addActivity({
        type: 'plan_created',
        title: `Product plan launched for "${productName}"`,
        description: `${planData.features.length} features, ${generatedTasks.length} tasks generated across ${planData.activeStudios.length} studios`,
        actor: { id: 'current-user', name: 'You', initials: 'YO' },
        productId,
        studio: 'planner',
      })

      addNotification({
        type: 'plan_ready',
        title: 'Product Plan Launched',
        body: `"${productName}" plan is ready with ${generatedTasks.length} tasks distributed across your team.`,
        priority: 'high',
        productId,
        studio: 'planner',
        actionUrl: `/${orgSlug}/${params.productSlug}/tasks`,
      })

      // ── Emit to event bus → auto-seeds Design frames + tasks for each feature ──
      planData.features.slice(0, 5).forEach((f) => {
        eventBus.emit({
          type: 'plan.spec.approved',
          productId,
          specId: `spec-${f.id}`,
          specTitle: f.name,
          actor: makeActor(userId, userName),
        })
      })

      // ── 2. Write to real backend (DB) ──
      setLaunchPhase('Creating plan node…')
      // Create plan node in DB
      const planNode = await trpcMutate<{ id: string }>('graph.createNode', {
        productId,
        kind: 'plan',
        label: `${productName} Plan`,
        data: {
          problem: planData.problem,
          goals: planData.goals,
          personas: planData.personas,
          activeStudios: planData.activeStudios,
        },
      }).catch(() => null)

      setLaunchPhase(`Writing ${planData.features.length} features…`)
      // Create feature nodes in DB and collect IDs
      const featureNodeIds: string[] = []
      for (const f of planData.features) {
        const node = await trpcMutate<{ id: string }>('graph.createNode', {
          productId,
          kind: 'feature',
          label: f.name,
          data: { description: f.description, priority: f.priority },
        }).catch(() => null)
        if (node) featureNodeIds.push(node.id)
      }

      setLaunchPhase(`Writing ${planData.entities.length} entities…`)
      // Create entity nodes in DB
      const entityNodeIds: string[] = []
      for (const e of planData.entities) {
        const node = await trpcMutate<{ id: string }>('graph.createNode', {
          productId,
          kind: 'entity',
          label: e.name,
          data: { fields: e.fields },
        }).catch(() => null)
        if (node) entityNodeIds.push(node.id)
      }

      // Create edges: plan → features (contains)
      if (planNode) {
        for (const fid of featureNodeIds) {
          await trpcMutate('graph.createEdge', {
            productId,
            sourceId: planNode.id,
            targetId: fid,
            kind: 'contains',
          }).catch(() => null)
        }
      }

      setLaunchPhase(`Generating ${generatedTasks.length} tasks…`)
      // Create tasks in DB for each generated task
      for (const gt of generatedTasks) {
        await trpcMutate('task.create', {
          productId,
          title: gt.title,
          description: gt.description || '',
          status: 'todo',
          priority: gt.priority === 'critical' ? 'urgent' : gt.priority === 'high' ? 'high' : gt.priority === 'medium' ? 'medium' : 'low',
          studioOrigin: gt.studio,
        }).catch(() => null)
      }

      // Log activity in DB
      await trpcMutate('activity.log', {
        productId,
        action: 'plan.launched',
        entityType: 'plan',
        entityId: planNode?.id,
        studioOrigin: 'planner',
      }).catch(() => null)

    } catch {
      // Local stores already updated optimistically — navigate regardless
    } finally {
      setIsLaunching(false)
    }

    router.push(`/${orgSlug}/${params.productSlug}/graph-explorer?from=planner`)
  }, [isLaunching, params, planData, generatedTasks, productId, currentProduct, scaffoldProduct, bulkAddNodes, addNode, bulkAddTasks, addActivity, addNotification, router])

  const updatePlanData = useCallback(<K extends keyof PlanData>(key: K, value: PlanData[K]) => {
    setPlanData((prev) => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (currentStep === 4) {
      const tasks = generateTasksFromPlan(planData)
      setGeneratedTasks(tasks)
    }
  }, [currentStep, planData])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_STEPS

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
            isLaunching={isLaunching}
            generatedTasks={generatedTasks}
            onTasksChange={setGeneratedTasks}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-inset)]">
      {/* ── Top toolbar ── */}
      <div className="tool-toolbar gap-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const step = i + 1
            const isActive = step === currentStep
            const isCompleted = completedSteps.has(step)
            return (
              <button
                key={step}
                onClick={() => goToStep(step)}
                className="flex items-center gap-1.5 group"
              >
                <span
                  className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-medium leading-none transition-colors ${
                    isCompleted
                      ? 'bg-[var(--accent-muted)] text-[var(--accent-text)]'
                      : isActive
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] border border-[var(--border-default)]'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5" /> : step}
                </span>
                <span
                  className={`text-[10px] tracking-wide ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : isCompleted
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {STEP_LABELS[i]}
                </span>
                {i < TOTAL_STEPS - 1 && (
                  <span className="w-4 h-px bg-[var(--border-default)] mx-1" />
                )}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentStep === 1 && (
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="tool-btn flex items-center gap-1.5 px-2.5 h-6 rounded text-[11px] font-medium border border-[var(--accent-muted)] text-[var(--accent-text)] hover:bg-[var(--accent-muted)]/20 transition-colors"
            >
              <LayoutTemplate className="w-3 h-3" />
              Start from Template
            </button>
          )}
          <AIActionBar workspace="plan" productId={productId} compact />
          <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
            Step {currentStep}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* ── Main area: content + AI panel ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-inset)]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            {renderStep()}
          </div>
        </div>

        <div className="w-[320px] flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
          <AISuggestPanel currentStep={currentStep} />
        </div>
      </div>

      {/* ── Bottom navigation bar ── */}
      <div className="flex-shrink-0 h-10 flex items-center border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-3">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`tool-btn flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium rounded border transition-colors ${
              isFirstStep
                ? 'opacity-30 cursor-not-allowed text-[var(--text-tertiary)] border-transparent'
                : 'text-[var(--text-secondary)] border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="tool-btn tool-btn-ghost flex items-center gap-1 px-2.5 h-7 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip
                <SkipForward className="w-3 h-3" />
              </button>
            )}

            {!isLastStep && (
              <button
                onClick={handleNext}
                className="tool-btn tool-btn-primary flex items-center gap-1 px-3 h-7 text-[11px] font-medium rounded transition-colors"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Launching overlay ── */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col items-center gap-6 max-w-sm text-center px-8"
            >
              {/* Animated orbit rings */}
              <div className="relative w-20 h-20">
                <svg className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.15" fill="none" />
                  <path d="M40 5 A35 35 0 0 1 75 40" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <svg className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="26" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.12" fill="none" />
                  <path d="M40 14 A26 26 0 0 0 14 40" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Network size={22} className="text-[var(--accent)]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-base font-semibold text-white">Launching Product</p>
                <p className="text-[13px] text-[var(--text-secondary)] min-h-[20px] transition-all duration-300">
                  {launchPhase || 'Preparing…'}
                </p>
              </div>

              {/* Progress steps */}
              <div className="flex flex-col gap-1.5 w-full text-left">
                {[
                  { icon: Layers, label: 'Graph nodes', done: launchPhase.includes('feature') || launchPhase.includes('entit') || launchPhase.includes('task') },
                  { icon: GitBranch, label: 'Graph edges', done: launchPhase.includes('entit') || launchPhase.includes('task') },
                  { icon: CheckSquare, label: 'Task generation', done: launchPhase.includes('task') },
                ].map(({ icon: Icon, label, done }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${done ? 'bg-[var(--accent)]/30' : 'bg-white/10'}`}>
                      {done
                        ? <Check size={9} className="text-[var(--accent)]" />
                        : <Icon size={9} className="text-white/30" />
                      }
                    </div>
                    <span className={`text-[11px] transition-colors duration-500 ${done ? 'text-[var(--accent)]' : 'text-white/30'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TemplateStartModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  )
}
