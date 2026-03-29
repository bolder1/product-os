'use client'

import { useMemo } from 'react'
import { useGraphStore, type GraphNode, type NodeKind, type EdgeKind } from './graph-store'
import { useTaskStore } from './task-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationSeverity = 'error' | 'warning' | 'info'
export type ValidationCategory =
  | 'completeness'
  | 'consistency'
  | 'readiness'
  | 'compliance'
  | 'orphan'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  category: ValidationCategory
  title: string
  description: string
  studio: string
  nodeId?: string
  nodeKind?: NodeKind
  suggestion?: string
  autoFixable?: boolean
}

export interface ReadinessScore {
  overall: number // 0-100
  plan: number
  brand: number
  components: number
  design: number
  workflows: number
  pages: number
  code: number
  testing: number
  analytics: number
}

// ---------------------------------------------------------------------------
// Validation Rules
// ---------------------------------------------------------------------------

interface ValidationRule {
  id: string
  title: string
  category: ValidationCategory
  severity: ValidationSeverity
  studio: string
  check: (nodes: GraphNode[], edges: ReturnType<typeof useGraphStore.getState>['edges']) => ValidationIssue | null
}

const validationRules: ValidationRule[] = [
  // ── Completeness ──
  {
    id: 'no-features',
    title: 'No features defined',
    category: 'completeness',
    severity: 'error',
    studio: 'planner',
    check: (nodes) => {
      const features = nodes.filter((n) => n.kind === 'feature')
      if (features.length === 0) {
        return {
          id: 'no-features',
          severity: 'error',
          category: 'completeness',
          title: 'No features defined',
          description: 'Your product has no features. Use the Planner to define core features.',
          studio: 'planner',
          suggestion: 'Open the Planner and add at least one feature in Step 2.',
        }
      }
      return null
    },
  },
  {
    id: 'feature-without-page',
    title: 'Features without pages',
    category: 'completeness',
    severity: 'warning',
    studio: 'pages',
    check: (nodes, edges) => {
      const features = nodes.filter((n) => n.kind === 'feature')
      const pages = nodes.filter((n) => n.kind === 'page')
      if (features.length > 0 && pages.length === 0) {
        return {
          id: 'feature-without-page',
          severity: 'warning',
          category: 'completeness',
          title: `${features.length} features have no associated pages`,
          description: 'Features need pages to be displayed to users. Create pages in the Page Builder.',
          studio: 'pages',
          suggestion: 'Open Pages studio and create at least one page per feature.',
        }
      }
      return null
    },
  },
  {
    id: 'no-brand-tokens',
    title: 'No brand tokens defined',
    category: 'completeness',
    severity: 'warning',
    studio: 'brand',
    check: (nodes) => {
      const tokens = nodes.filter((n) => n.kind === 'token')
      if (nodes.length > 3 && tokens.length === 0) {
        return {
          id: 'no-brand-tokens',
          severity: 'warning',
          category: 'completeness',
          title: 'No brand tokens defined',
          description: 'Brand tokens ensure visual consistency. Define colors, typography, and spacing in Brand studio.',
          studio: 'brand',
          suggestion: 'Open Brand studio and define your color palette and typography.',
        }
      }
      return null
    },
  },
  {
    id: 'no-components',
    title: 'No reusable components',
    category: 'completeness',
    severity: 'warning',
    studio: 'components',
    check: (nodes) => {
      const components = nodes.filter((n) => n.kind === 'component')
      const pages = nodes.filter((n) => n.kind === 'page')
      if (pages.length > 0 && components.length === 0) {
        return {
          id: 'no-components',
          severity: 'warning',
          category: 'completeness',
          title: 'Pages exist but no reusable components',
          description: 'Components promote consistency and reuse. Create shared components in the Component Builder.',
          studio: 'components',
          suggestion: 'Create Button, Card, and Form components to use across pages.',
        }
      }
      return null
    },
  },

  // ── Consistency ──
  {
    id: 'entity-without-workflow',
    title: 'Entities without workflows',
    category: 'consistency',
    severity: 'warning',
    studio: 'workflows',
    check: (nodes, edges) => {
      const entities = nodes.filter((n) => n.kind === 'entity')
      const workflows = nodes.filter((n) => n.kind === 'workflow')
      const orphanEntities = entities.filter((e) => {
        return !edges.some(
          (edge) =>
            (edge.sourceId === e.id || edge.targetId === e.id) &&
            workflows.some((w) => w.id === edge.sourceId || w.id === edge.targetId)
        )
      })
      if (orphanEntities.length > 0) {
        return {
          id: 'entity-without-workflow',
          severity: 'warning',
          category: 'consistency',
          title: `${orphanEntities.length} entities have no workflow`,
          description: 'Entities without workflows have no state management. Define state machines in Workflow Builder.',
          studio: 'workflows',
          nodeId: orphanEntities[0].id,
          nodeKind: 'entity',
          suggestion: 'Link each entity to a workflow that defines its lifecycle states.',
        }
      }
      return null
    },
  },

  // ── Readiness ──
  {
    id: 'no-tasks',
    title: 'No tasks created',
    category: 'readiness',
    severity: 'info',
    studio: 'tasks',
    check: (nodes) => {
      const tasks = nodes.filter((n) => n.kind === 'task')
      if (nodes.length > 5 && tasks.length === 0) {
        return {
          id: 'no-tasks',
          severity: 'info',
          category: 'readiness',
          title: 'No tasks created from plan',
          description: 'Launch your plan to auto-generate tasks for your team.',
          studio: 'tasks',
          suggestion: 'Use the Planner "Review & Launch" step to generate tasks.',
        }
      }
      return null
    },
  },
  {
    id: 'no-release',
    title: 'No release planned',
    category: 'readiness',
    severity: 'info',
    studio: 'releases',
    check: (nodes) => {
      const releases = nodes.filter((n) => n.kind === 'release')
      const features = nodes.filter((n) => n.kind === 'feature')
      if (features.length >= 3 && releases.length === 0) {
        return {
          id: 'no-release',
          severity: 'info',
          category: 'readiness',
          title: 'Multiple features but no release planned',
          description: 'Consider creating a release milestone to track delivery.',
          studio: 'releases',
          suggestion: 'Open Releases studio and create a v0.1 milestone.',
        }
      }
      return null
    },
  },

  // ── Orphan detection ──
  {
    id: 'orphan-nodes',
    title: 'Disconnected graph nodes',
    category: 'orphan',
    severity: 'warning',
    studio: 'graph-explorer',
    check: (nodes, edges) => {
      if (nodes.length <= 2) return null
      const connectedIds = new Set<string>()
      edges.forEach((e) => {
        connectedIds.add(e.sourceId)
        connectedIds.add(e.targetId)
      })
      const orphans = nodes.filter(
        (n) => n.kind !== 'product' && n.kind !== 'plan' && !connectedIds.has(n.id)
      )
      if (orphans.length > 2) {
        return {
          id: 'orphan-nodes',
          severity: 'warning',
          category: 'orphan',
          title: `${orphans.length} disconnected nodes in product graph`,
          description: 'These nodes are not linked to any other objects. Connect them or remove them.',
          studio: 'graph-explorer',
          suggestion: 'Open Graph Explorer to review and connect orphaned nodes.',
        }
      }
      return null
    },
  },

  // ── Compliance ──
  {
    id: 'no-analytics',
    title: 'No analytics tracking defined',
    category: 'compliance',
    severity: 'info',
    studio: 'analytics',
    check: (nodes) => {
      const pages = nodes.filter((n) => n.kind === 'page')
      const insights = nodes.filter((n) => n.kind === 'insight')
      if (pages.length > 2 && insights.length === 0) {
        return {
          id: 'no-analytics',
          severity: 'info',
          category: 'compliance',
          title: 'Pages exist but no analytics defined',
          description: 'Without analytics, you can\'t measure success. Define KPIs in Analytics studio.',
          studio: 'analytics',
          suggestion: 'Set up conversion funnels and page view tracking.',
        }
      }
      return null
    },
  },
]

// ---------------------------------------------------------------------------
// Validation Engine
// ---------------------------------------------------------------------------

export function runValidation(productId: string): ValidationIssue[] {
  const { nodes, edges } = useGraphStore.getState()
  const productNodes = nodes.filter((n) => n.productId === productId)
  const productEdges = edges.filter((e) => e.productId === productId)

  const issues: ValidationIssue[] = []

  for (const rule of validationRules) {
    const issue = rule.check(productNodes, productEdges)
    if (issue) issues.push(issue)
  }

  // Sort: errors first, then warnings, then info
  const severityOrder: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 }
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return issues
}

export function calculateReadinessScore(productId: string): ReadinessScore {
  const { nodes, edges } = useGraphStore.getState()
  const pn = nodes.filter((n) => n.productId === productId)

  const has = (kind: NodeKind) => pn.some((n) => n.kind === kind)
  const count = (kind: NodeKind) => pn.filter((n) => n.kind === kind).length

  // Score each area 0-100
  const plan = Math.min(100,
    (has('plan') ? 30 : 0) +
    (count('feature') >= 1 ? 30 : count('feature') > 0 ? 15 : 0) +
    (count('journey') >= 1 ? 20 : 0) +
    (pn.some((n) => n.kind === 'plan' && n.data?.problem) ? 20 : 0)
  )

  const brand = Math.min(100,
    (count('token') >= 5 ? 40 : count('token') * 8) +
    (count('asset') >= 1 ? 30 : 0) +
    (has('token') ? 30 : 0)
  )

  const components = Math.min(100,
    (count('component') >= 5 ? 50 : count('component') * 10) +
    (count('variant') >= 3 ? 30 : count('variant') * 10) +
    (count('component') >= 1 ? 20 : 0)
  )

  const design = Math.min(100,
    (count('screen') >= 3 ? 50 : count('screen') * 16) +
    (count('page') >= 1 ? 30 : 0) +
    (has('screen') ? 20 : 0)
  )

  const workflows = Math.min(100,
    (count('entity') >= 2 ? 40 : count('entity') * 20) +
    (count('workflow') >= 1 ? 40 : 0) +
    (count('field') >= 3 ? 20 : count('field') * 6)
  )

  const pages = Math.min(100,
    (count('page') >= 3 ? 50 : count('page') * 16) +
    (count('route') >= 1 ? 30 : 0) +
    (edges.filter((e) => e.kind === 'routes_to').length >= 1 ? 20 : 0)
  )

  const code = Math.min(100,
    (pn.some((n) => n.kind === 'component' && n.data?.codeReady) ? 50 : 0) +
    (count('component') >= 1 ? 30 : 0) +
    (has('release') ? 20 : 0)
  )

  const testing = Math.min(100,
    (count('task') >= 1 ? 30 : 0) +
    (pn.some((n) => n.kind === 'task' && n.data?.type === 'test') ? 40 : 0) +
    (has('approval') ? 30 : 0)
  )

  const analytics = Math.min(100,
    (count('insight') >= 1 ? 50 : 0) +
    (has('insight') ? 30 : 0) +
    (count('page') >= 1 ? 20 : 0)
  )

  const scores = [plan, brand, components, design, workflows, pages, code, testing, analytics]
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  return { overall, plan, brand, components, design, workflows, pages, code, testing, analytics }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useValidation(productId: string) {
  // Subscribe to the raw state so we recompute when the graph or tasks change
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const tasks = useTaskStore((s) => s.tasks)

  return useMemo(() => {
    const issues = runValidation(productId)
    const readiness = calculateReadinessScore(productId)

    return {
      issues,
      readiness,
      errorCount: issues.filter((i) => i.severity === 'error').length,
      warningCount: issues.filter((i) => i.severity === 'warning').length,
      infoCount: issues.filter((i) => i.severity === 'info').length,
    }
  }, [productId, nodes, edges, tasks])
}
