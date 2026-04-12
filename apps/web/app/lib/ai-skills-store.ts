'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AISkillFamily = 'product' | 'design' | 'engineering' | 'growth' | 'system'
export type AIActionClass = 'suggest' | 'scaffold' | 'transform' | 'analyze' | 'operate'
export type SkillStatus = 'idle' | 'running' | 'completed' | 'failed'
export type ComputerMode = 'suggest' | 'assist' | 'autopilot'

export interface AISkill {
  id: string
  name: string
  description: string
  family: AISkillFamily
  actionClass: AIActionClass
  targetStudio?: string
  creditCost: number // 0 = free
  enabled: boolean
}

export interface SkillExecution {
  id: string
  skillId: string
  productId: string
  status: SkillStatus
  mode: ComputerMode
  input: Record<string, unknown>
  output?: Record<string, unknown>
  artifactsCreated: number
  tokensUsed: number
  startedAt: string
  completedAt?: string
  error?: string
}

export interface ComputerModeState {
  activeMode: ComputerMode
  executionPolicy: {
    requireApprovalForMutations: boolean
    maxAutoActions: number
    allowedStudios: string[]
  }
  actionLog: ComputerAction[]
}

export interface ComputerAction {
  id: string
  productId: string
  skillId: string
  mode: ComputerMode
  action: string // human-readable
  type: 'analyze' | 'suggest' | 'draft' | 'execute' | 'revert'
  status: 'proposed' | 'approved' | 'executed' | 'reverted' | 'rejected'
  nodeId?: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Built-in skill registry
// ---------------------------------------------------------------------------

export const builtinSkills: AISkill[] = [
  // Product skills
  { id: 'sk-plan-gen', name: 'Plan Generator', description: 'Generate a complete product plan from a brief description.', family: 'product', actionClass: 'scaffold', creditCost: 2, enabled: true },
  { id: 'sk-prd-convert', name: 'PRD Converter', description: 'Convert a PRD document into structured graph objects.', family: 'product', actionClass: 'transform', creditCost: 3, enabled: true },
  { id: 'sk-journey-map', name: 'Journey Mapper', description: 'Map user journeys from feature descriptions.', family: 'product', actionClass: 'scaffold', creditCost: 1, enabled: true },
  { id: 'sk-feature-break', name: 'Feature Breakdown', description: 'Break features into implementable subtasks.', family: 'product', actionClass: 'suggest', creditCost: 1, enabled: true },

  // Design skills
  { id: 'sk-ui-gen', name: 'UI Generator', description: 'Generate screen layouts from wireframe descriptions.', family: 'design', actionClass: 'scaffold', targetStudio: 'design', creditCost: 2, enabled: true },
  { id: 'sk-ds-enforce', name: 'Design System Enforcer', description: 'Check screens against brand tokens and component library.', family: 'design', actionClass: 'analyze', targetStudio: 'brand', creditCost: 0, enabled: true },
  { id: 'sk-comp-map', name: 'Component Mapper', description: 'Identify reusable components from screen designs.', family: 'design', actionClass: 'analyze', targetStudio: 'components', creditCost: 1, enabled: true },
  { id: 'sk-layout-suggest', name: 'Layout Suggester', description: 'Suggest optimal page layouts based on content.', family: 'design', actionClass: 'suggest', targetStudio: 'pages', creditCost: 0, enabled: true },

  // Engineering skills
  { id: 'sk-code-gen', name: 'Code Generator', description: 'Generate component code from design specs.', family: 'engineering', actionClass: 'scaffold', targetStudio: 'code', creditCost: 3, enabled: true },
  { id: 'sk-api-build', name: 'API Builder', description: 'Generate API endpoints from entity and workflow definitions.', family: 'engineering', actionClass: 'scaffold', creditCost: 2, enabled: true },
  { id: 'sk-debug-assist', name: 'Debug Assistant', description: 'Analyze errors and suggest fixes.', family: 'engineering', actionClass: 'suggest', creditCost: 0, enabled: true },
  { id: 'sk-impl-gap', name: 'Implementation Gap Detector', description: 'Find missing implementations vs specs.', family: 'engineering', actionClass: 'analyze', creditCost: 1, enabled: true },

  // Growth skills
  { id: 'sk-funnel-opt', name: 'Funnel Optimizer', description: 'Analyze conversion funnels and suggest improvements.', family: 'growth', actionClass: 'analyze', targetStudio: 'analytics', creditCost: 1, enabled: true },
  { id: 'sk-experiment-gen', name: 'Experiment Generator', description: 'Generate A/B test hypotheses from analytics data.', family: 'growth', actionClass: 'suggest', targetStudio: 'analytics', creditCost: 1, enabled: true },
  { id: 'sk-dropoff-analyze', name: 'Drop-off Analyzer', description: 'Identify and explain user drop-off points.', family: 'growth', actionClass: 'analyze', creditCost: 1, enabled: true },

  // System skills
  { id: 'sk-data-map', name: 'Data Mapper', description: 'Map data flows between entities and workflows.', family: 'system', actionClass: 'analyze', creditCost: 0, enabled: true },
  { id: 'sk-dep-analyze', name: 'Dependency Analyzer', description: 'Analyze and visualize dependency chains.', family: 'system', actionClass: 'analyze', creditCost: 0, enabled: true },
  { id: 'sk-refactor-assist', name: 'Refactor Assistant', description: 'Suggest graph restructuring for better organization.', family: 'system', actionClass: 'suggest', creditCost: 1, enabled: true },
  { id: 'sk-compliance', name: 'Compliance Checker', description: 'Check product against policy and compliance rules.', family: 'system', actionClass: 'analyze', creditCost: 0, enabled: true },
]

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface AISkillsState {
  skills: AISkill[]
  executions: SkillExecution[]
  computerMode: ComputerModeState

  // Skill management
  toggleSkill: (id: string) => void
  getSkillsByFamily: (family: AISkillFamily) => AISkill[]

  // Execution
  executeSkill: (skillId: string, productId: string, input: Record<string, unknown>) => string
  completeExecution: (executionId: string, output: Record<string, unknown>, artifactsCreated: number) => void
  failExecution: (executionId: string, error: string) => void

  // Computer Mode
  setComputerMode: (mode: ComputerMode) => void
  addAction: (action: Omit<ComputerAction, 'id' | 'timestamp'>) => void
  approveAction: (actionId: string) => void
  rejectAction: (actionId: string) => void

  // Credits
  totalCreditsUsed: () => number
}

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export const useAISkillsStore = create<AISkillsState>()(
  persist(
    (set, get) => ({
      skills: builtinSkills,
      executions: [],
      computerMode: {
        activeMode: 'suggest',
        executionPolicy: {
          requireApprovalForMutations: true,
          maxAutoActions: 5,
          allowedStudios: ['planner', 'brand', 'components', 'design', 'workflows', 'pages', 'analytics'],
        },
        actionLog: [],
      },

      toggleSkill: (id) =>
        set((s) => ({
          skills: s.skills.map((sk) => (sk.id === id ? { ...sk, enabled: !sk.enabled } : sk)),
        })),

      getSkillsByFamily: (family) => get().skills.filter((sk) => sk.family === family),

      executeSkill: (skillId, productId, input) => {
        const execId = uid('exec')
        const skill = get().skills.find((sk) => sk.id === skillId)
        if (!skill) return execId

        const execution: SkillExecution = {
          id: execId,
          skillId,
          productId,
          status: 'running',
          mode: get().computerMode.activeMode,
          input,
          artifactsCreated: 0,
          tokensUsed: 0,
          startedAt: new Date().toISOString(),
        }
        set((s) => ({ executions: [execution, ...s.executions].slice(0, 50) }))

        // Simulate completion
        setTimeout(() => {
          const tokens = Math.floor(Math.random() * 2000) + 500
          const artifacts = Math.floor(Math.random() * 5) + 1
          get().completeExecution(execId, { result: 'Generated successfully', tokens }, artifacts)
        }, 2000 + Math.random() * 1500)

        return execId
      },

      completeExecution: (execId, output, artifactsCreated) =>
        set((s) => ({
          executions: s.executions.map((e) =>
            e.id === execId
              ? { ...e, status: 'completed' as const, output, artifactsCreated, tokensUsed: (output.tokens as number) ?? 0, completedAt: new Date().toISOString() }
              : e
          ),
        })),

      failExecution: (execId, error) =>
        set((s) => ({
          executions: s.executions.map((e) =>
            e.id === execId
              ? { ...e, status: 'failed' as const, error, completedAt: new Date().toISOString() }
              : e
          ),
        })),

      setComputerMode: (mode) =>
        set((s) => ({
          computerMode: { ...s.computerMode, activeMode: mode },
        })),

      addAction: (action) =>
        set((s) => ({
          computerMode: {
            ...s.computerMode,
            actionLog: [
              { ...action, id: uid('act'), timestamp: new Date().toISOString() },
              ...s.computerMode.actionLog,
            ].slice(0, 100),
          },
        })),

      approveAction: (actionId) =>
        set((s) => ({
          computerMode: {
            ...s.computerMode,
            actionLog: s.computerMode.actionLog.map((a) =>
              a.id === actionId ? { ...a, status: 'executed' as const } : a
            ),
          },
        })),

      rejectAction: (actionId) =>
        set((s) => ({
          computerMode: {
            ...s.computerMode,
            actionLog: s.computerMode.actionLog.map((a) =>
              a.id === actionId ? { ...a, status: 'rejected' as const } : a
            ),
          },
        })),

      totalCreditsUsed: () => {
        const completedExecs = get().executions.filter((e) => e.status === 'completed')
        return completedExecs.reduce((sum, e) => {
          const skill = get().skills.find((s) => s.id === e.skillId)
          return sum + (skill?.creditCost ?? 0)
        }, 0)
      },
    }),
    { name: 'product-os-ai-skills' }
  )
)
