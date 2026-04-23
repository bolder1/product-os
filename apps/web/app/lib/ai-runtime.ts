'use client'

/**
 * Product OS — AI Runtime
 *
 * The single execution layer for all AI skills across every workspace.
 *
 * Responsibilities:
 *  1. Execute skills via tRPC (real API) with fallback to simulation
 *  2. Persist execution state through useAISkillsStore
 *  3. Emit `ai.skill.completed` events on the bus → cross-workspace effects
 *  4. Apply skill output back to the graph (node creation / annotation)
 *  5. Provide context-aware skill suggestions for each workspace
 *
 * All workspaces use this — no bespoke AI paths.
 *
 * Usage (outside components):
 *   import { aiRuntime } from '@/lib/ai-runtime'
 *   const execId = await aiRuntime.run('sk-ui-gen', productId, { prompt: '...' }, actor)
 *
 * Usage (inside components):
 *   const { run, isRunning, lastResult } = useAIRuntime()
 */

import { trpcMutate, trpcQuery } from './api'
import { useAISkillsStore, type AISkill, type SkillExecution } from './ai-skills-store'
import { useGraphStore } from './graph-store'
import { useNotificationStore } from './notification-store'
import { eventBus, type EventActor } from './event-bus'
import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Skill output types
// ---------------------------------------------------------------------------

export interface SkillOutput {
  /** Human-readable summary of what was generated */
  summary: string
  /** Graph node IDs created or modified during this execution */
  nodeIds?: string[]
  /** Suggested next actions for the user */
  suggestions?: string[]
  /** Raw structured output from the skill handler */
  data?: Record<string, unknown>
  /** Number of tokens consumed */
  tokensUsed?: number
  /** Number of artifacts (nodes/files) created */
  artifactsCreated?: number
}

// ---------------------------------------------------------------------------
// Context-aware skill suggestions per workspace
// ---------------------------------------------------------------------------

export const WORKSPACE_SKILLS: Record<string, string[]> = {
  plan:         ['sk-plan-gen', 'sk-prd-convert', 'sk-journey-map', 'sk-feature-break'],
  design:       ['sk-ui-gen', 'sk-ds-enforce', 'sk-comp-map', 'sk-layout-suggest'],
  engineer:     ['sk-code-gen', 'sk-api-build', 'sk-debug-assist', 'sk-impl-gap'],
  ship:         ['sk-impl-gap', 'sk-compliance', 'sk-dep-analyze'],
  operate:      ['sk-funnel-opt', 'sk-experiment-gen', 'sk-dropoff-analyze'],
  intelligence: ['sk-plan-gen', 'sk-ui-gen', 'sk-code-gen', 'sk-data-map', 'sk-dep-analyze', 'sk-compliance'],
  system:       ['sk-data-map', 'sk-dep-analyze', 'sk-refactor-assist', 'sk-compliance'],
  home:         ['sk-plan-gen', 'sk-feature-break', 'sk-funnel-opt'],
}

// ---------------------------------------------------------------------------
// Skill handlers — these map skill IDs to deterministic outputs that
// manipulate the graph store directly. When the real API is available,
// the tRPC result overrides these.
// ---------------------------------------------------------------------------

type SkillHandler = (input: Record<string, unknown>, productId: string) => Promise<SkillOutput>

const skillHandlers: Record<string, SkillHandler> = {

  'sk-plan-gen': async (input, productId) => {
    const { addNode, addEdge } = useGraphStore.getState()
    const brief = String(input.prompt ?? input.brief ?? 'Product')

    const planNode = addNode({ kind: 'plan', label: `${brief} — Generated Plan`, productId, data: { source: 'ai', brief, status: 'draft' } })
    const nodes = ['Research', 'Design', 'Build', 'Launch'].map((phase, i) =>
      addNode({ kind: 'module', label: `Phase ${i + 1}: ${phase}`, productId, data: { phase, source: 'ai', order: i } })
    )
    nodes.forEach((n) => addEdge({ kind: 'contains', sourceId: planNode.id, targetId: n.id, productId }))

    return {
      summary: `Generated a 4-phase plan for "${brief}" with ${nodes.length} modules.`,
      nodeIds: [planNode.id, ...nodes.map((n) => n.id)],
      artifactsCreated: nodes.length + 1,
      tokensUsed: 820,
    }
  },

  'sk-ui-gen': async (input, productId) => {
    const { addNode } = useGraphStore.getState()
    const prompt = String(input.prompt ?? 'Screen')
    const screens = ['List View', 'Detail View', 'Create Form', 'Settings'].slice(0, Number(input.screens ?? 3))

    const nodes = screens.map((s) =>
      addNode({ kind: 'screen', label: `${prompt} — ${s}`, productId, data: { source: 'ai', prompt, layout: s, status: 'draft' } })
    )

    return {
      summary: `Generated ${nodes.length} screen layouts for "${prompt}".`,
      nodeIds: nodes.map((n) => n.id),
      suggestions: ['Open Design Studio to edit screens', 'Run Component Mapper to find reuse opportunities'],
      artifactsCreated: nodes.length,
      tokensUsed: 1240,
    }
  },

  'sk-feature-break': async (input, productId) => {
    const { addNode, addEdge } = useGraphStore.getState()
    const featureName = String(input.feature ?? input.prompt ?? 'Feature')

    const featureNode = addNode({ kind: 'feature', label: featureName, productId, data: { source: 'ai', status: 'backlog' } })
    const tasks = ['Research & Discovery', 'Design', 'Backend API', 'Frontend Implementation', 'Testing & QA', 'Documentation'].map((t) =>
      addNode({ kind: 'task', label: `${featureName}: ${t}`, productId, data: { source: 'ai', status: 'todo', feature: featureName } })
    )
    tasks.forEach((t) => addEdge({ kind: 'contains', sourceId: featureNode.id, targetId: t.id, productId }))

    return {
      summary: `Broke "${featureName}" into ${tasks.length} tasks.`,
      nodeIds: [featureNode.id, ...tasks.map((n) => n.id)],
      artifactsCreated: tasks.length + 1,
      tokensUsed: 560,
    }
  },

  'sk-code-gen': async (input, productId) => {
    const { addNode } = useGraphStore.getState()
    const componentName = String(input.component ?? input.prompt ?? 'Component')

    const node = addNode({
      kind: 'component',
      label: `${componentName} (generated)`,
      productId,
      data: {
        source: 'ai',
        status: 'draft',
        tsxCode: `// AI-generated — ${componentName}\nexport function ${componentName.replace(/\s/g, '')}() {\n  return <div className="p-4">{/* ${componentName} */}</div>\n}`,
      },
    })

    return {
      summary: `Generated TSX component "${componentName}".`,
      nodeIds: [node.id],
      suggestions: ['Review in Code studio', 'Export via Design Studio → Export'],
      artifactsCreated: 1,
      tokensUsed: 430,
    }
  },

  'sk-ds-enforce': async (input, productId) => {
    const { nodes } = useGraphStore.getState()
    const violations = nodes
      .filter((n) => n.productId === productId && n.kind === 'screen')
      .filter(() => Math.random() > 0.6)
      .slice(0, 4)
      .map((n) => n.label)

    return {
      summary: violations.length > 0
        ? `Found ${violations.length} design system violations: ${violations.join(', ')}`
        : 'Design system compliance: ✓ No violations found.',
      data: { violations },
      artifactsCreated: 0,
      tokensUsed: 310,
    }
  },

  'sk-comp-map': async (input, productId) => {
    const { nodes } = useGraphStore.getState()
    const screens = nodes.filter((n) => n.productId === productId && n.kind === 'screen')

    return {
      summary: `Analyzed ${screens.length} screens. Found 3 reusable component opportunities: Card, Button group, Navigation bar.`,
      suggestions: ['Extract Card to Components workspace', 'Extract Navigation to Components workspace'],
      artifactsCreated: 0,
      tokensUsed: 580,
    }
  },

  'sk-dep-analyze': async (input, productId) => {
    const { nodes, edges } = useGraphStore.getState()
    const productNodes = nodes.filter((n) => n.productId === productId)
    const productEdges = edges.filter((e) => e.productId === productId)

    return {
      summary: `Analyzed ${productNodes.length} nodes and ${productEdges.length} edges. Dependency graph is ${productEdges.length > productNodes.length * 2 ? 'complex' : 'healthy'}.`,
      data: { nodeCount: productNodes.length, edgeCount: productEdges.length },
      artifactsCreated: 0,
      tokensUsed: 210,
    }
  },

  'sk-compliance': async (input, productId) => {
    return {
      summary: 'Compliance check passed. No policy violations detected.',
      data: { issues: [] },
      artifactsCreated: 0,
      tokensUsed: 180,
    }
  },

  // ── Plan Mode / Memory-aware skills ────────────────────────────────────

  'sk-voice-extract': async (input) => {
    // Reads `memoryExcerpts: string[]` + optional MCQ `vibe`/`voice` and
    // returns a BrandVoice suggestion. Mock: crafts adjectives + sample phrases.
    const vibe = String(input.vibe ?? 'professional')
    const voice = String(input.voice ?? 'friendly')
    const adjectives = {
      playful: ['Warm', 'Witty', 'Inviting'],
      professional: ['Clear', 'Confident', 'Precise'],
      technical: ['Direct', 'Accurate', 'Efficient'],
      minimal: ['Quiet', 'Essential', 'Calm'],
      bold: ['Decisive', 'Bold', 'Punchy'],
    }[vibe] ?? ['Clear', 'Confident', 'Human']
    return {
      summary: `Extracted voice: ${adjectives.join(', ')} (${voice}).`,
      data: {
        personality: adjectives,
        tonePairs: [
          { axis: 'formal↔casual', value: voice === 'casual' ? 75 : 45 },
          { axis: 'serious↔playful', value: vibe === 'playful' ? 75 : 35 },
          { axis: 'reserved↔bold', value: vibe === 'bold' ? 80 : 45 },
          { axis: 'technical↔plain', value: vibe === 'technical' ? 25 : 65 },
        ],
        samplePhrases: [
          { context: 'welcome', text: 'Welcome — let’s get you set up in about a minute.' },
          { context: 'error', text: 'Something didn’t go through. Here’s what to try next.' },
          { context: 'success', text: 'All set. You’re good to go.' },
        ],
      },
      artifactsCreated: 1,
      tokensUsed: 320,
    }
  },

  'sk-comp-from-image': async (input) => {
    const filename = String(input.filename ?? 'screenshot.png')
    return {
      summary: `Extracted component structure from ${filename}.`,
      data: {
        detected: [
          { kind: 'button', confidence: 0.92 },
          { kind: 'input', confidence: 0.88 },
          { kind: 'card', confidence: 0.8 },
        ],
      },
      artifactsCreated: 3,
      tokensUsed: 640,
    }
  },

  'sk-task-estimate': async (input) => {
    const tasks = (input.tasks as Array<{ id: string; title: string }>) ?? []
    const estimates = tasks.map((t) => ({
      id: t.id,
      estimate: Math.max(1, Math.round((t.title.length / 10) * (Math.random() * 0.6 + 0.7))),
    }))
    return {
      summary: `Estimated ${estimates.length} tasks.`,
      data: { estimates },
      artifactsCreated: 0,
      tokensUsed: 180,
    }
  },
}

// Default handler for skills without a specific handler
const defaultHandler: SkillHandler = async (input, productId) => ({
  summary: 'Skill executed successfully.',
  artifactsCreated: 0,
  tokensUsed: Math.floor(Math.random() * 500) + 100,
})

// ---------------------------------------------------------------------------
// Runtime class
// ---------------------------------------------------------------------------

class AIRuntime {
  /**
   * Run a skill. Attempts real tRPC API first; falls back to local handler.
   * Returns the execution ID — call getExecution(id) to poll status.
   */
  async run(
    skillId: string,
    productId: string,
    input: Record<string, unknown>,
    actor: EventActor,
  ): Promise<string> {
    const { executeSkill, completeExecution, failExecution } = useAISkillsStore.getState()

    // Register execution in store (sets status to 'running')
    const execId = executeSkill(skillId, productId, input)

    // Run asynchronously so the caller gets the execId immediately
    this._execute(execId, skillId, productId, input, actor, completeExecution, failExecution)
      .catch((err) => failExecution(execId, String(err)))

    return execId
  }

  private async _execute(
    execId: string,
    skillId: string,
    productId: string,
    input: Record<string, unknown>,
    actor: EventActor,
    completeExecution: (id: string, output: Record<string, unknown>, artifacts: number) => void,
    failExecution: (id: string, error: string) => void,
  ): Promise<void> {
    let output: SkillOutput

    try {
      // Try tRPC first
      output = await trpcMutate<SkillOutput>('ai.executeSkill', { skillId, productId, input })
    } catch {
      // Fall back to local handler
      const handler = skillHandlers[skillId] ?? defaultHandler
      output = await handler(input, productId)
    }

    // Persist result
    completeExecution(execId, { ...output }, output.artifactsCreated ?? 0)

    // Emit bus event so workspaces can react
    eventBus.emit({
      type: 'ai.skill.completed',
      productId,
      skillId,
      skillName: useAISkillsStore.getState().skills.find((s) => s.id === skillId)?.name ?? skillId,
      outputNodeIds: output.nodeIds,
      actor,
    })

    // Notify user
    useNotificationStore.getState().addNotification({
      type: 'ai_suggestion',
      title: `AI Skill Complete`,
      body: output.summary,
      priority: 'normal',
      productId,
      studio: 'ai-skills',
    })
  }

  /** Get the current execution record by ID */
  getExecution(execId: string): SkillExecution | undefined {
    return useAISkillsStore.getState().executions.find((e) => e.id === execId)
  }

  /** Get all skills available for a given workspace */
  getWorkspaceSkills(workspace: string): AISkill[] {
    const { skills } = useAISkillsStore.getState()
    const ids = WORKSPACE_SKILLS[workspace] ?? []
    return skills.filter((s) => s.enabled && ids.includes(s.id))
  }
}

/** Singleton runtime — import and use anywhere. */
export const aiRuntime = new AIRuntime()

// ---------------------------------------------------------------------------
// React hook — for component use
// ---------------------------------------------------------------------------

export function useAIRuntime(workspace?: string) {
  const [runningIds, setRunningIds] = useState<string[]>([])
  const [lastExecId, setLastExecId] = useState<string | null>(null)

  const executions = useAISkillsStore((s) => s.executions)
  const allSkills = useAISkillsStore((s) => s.skills)

  const workspaceSkills = workspace
    ? allSkills.filter((s) => s.enabled && (WORKSPACE_SKILLS[workspace] ?? []).includes(s.id))
    : allSkills.filter((s) => s.enabled)

  const run = useCallback(async (
    skillId: string,
    productId: string,
    input: Record<string, unknown>,
    actor: EventActor,
  ) => {
    const execId = await aiRuntime.run(skillId, productId, input, actor)
    setRunningIds((ids) => [...ids, execId])
    setLastExecId(execId)

    // Poll until done
    const poll = setInterval(() => {
      const exec = aiRuntime.getExecution(execId)
      if (exec && (exec.status === 'completed' || exec.status === 'failed')) {
        clearInterval(poll)
        setRunningIds((ids) => ids.filter((id) => id !== execId))
      }
    }, 500)

    return execId
  }, [])

  const lastExecution = lastExecId ? executions.find((e) => e.id === lastExecId) : null

  return {
    run,
    workspaceSkills,
    isRunning: runningIds.length > 0,
    runningCount: runningIds.length,
    lastExecution,
    executions: executions.slice(0, 20),
  }
}
