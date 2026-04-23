import { z } from 'zod'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { graphNodes, graphEdges, tasks } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

// ── Studio → node kinds that signal its readiness ──────────────────────────
const STUDIO_KINDS: Record<string, string[]> = {
  plan:        ['plan', 'feature', 'journey'],
  brand:       ['token', 'asset'],
  components:  ['component', 'variant'],
  design:      ['screen', 'page'],
  workflows:   ['entity', 'workflow', 'field'],
  pages:       ['page', 'route'],
  code:        ['component'],      // component.codeReady flag
  testing:     ['task'],           // task.type === 'test'
  analytics:   ['insight'],
}

// ── Per-studio readiness scorer (mirrors client-side validation-engine) ────
function scoreStudio(
  studio: string,
  nodes: Array<{ kind: string; data: Record<string, unknown> | null }>,
  edges: Array<{ kind: string }>,
): number {
  const count = (kind: string) => nodes.filter((n) => n.kind === kind).length
  const has   = (kind: string) => nodes.some((n) => n.kind === kind)

  switch (studio) {
    case 'plan':
      return Math.min(100,
        (has('plan') ? 30 : 0) +
        (count('feature') >= 3 ? 30 : count('feature') * 10) +
        (count('journey') >= 1 ? 20 : 0) +
        (nodes.some((n) => n.kind === 'plan' && n.data?.problem) ? 20 : 0),
      )
    case 'brand':
      return Math.min(100,
        (count('token') >= 5 ? 40 : count('token') * 8) +
        (count('asset') >= 1 ? 30 : 0) +
        (has('token') ? 30 : 0),
      )
    case 'components':
      return Math.min(100,
        (count('component') >= 5 ? 50 : count('component') * 10) +
        (count('variant') >= 3 ? 30 : count('variant') * 10) +
        (count('component') >= 1 ? 20 : 0),
      )
    case 'design':
      return Math.min(100,
        (count('screen') >= 3 ? 50 : count('screen') * 16) +
        (count('page') >= 1 ? 30 : 0) +
        (has('screen') ? 20 : 0),
      )
    case 'workflows':
      return Math.min(100,
        (count('entity') >= 2 ? 40 : count('entity') * 20) +
        (count('workflow') >= 1 ? 40 : 0) +
        (count('field') >= 3 ? 20 : count('field') * 6),
      )
    case 'pages':
      return Math.min(100,
        (count('page') >= 3 ? 50 : count('page') * 16) +
        (count('route') >= 1 ? 30 : 0) +
        (edges.filter((e) => e.kind === 'routes_to').length >= 1 ? 20 : 0),
      )
    case 'code':
      return Math.min(100,
        (nodes.some((n) => n.kind === 'component' && n.data?.codeReady) ? 50 : 0) +
        (count('component') >= 1 ? 30 : 0) +
        (has('release') ? 20 : 0),
      )
    case 'testing':
      return Math.min(100,
        (count('task') >= 1 ? 30 : 0) +
        (nodes.some((n) => n.kind === 'task' && n.data?.type === 'test') ? 40 : 0) +
        (has('approval') ? 30 : 0),
      )
    case 'analytics':
      return Math.min(100,
        (count('insight') >= 1 ? 50 : 0) +
        (has('insight') ? 30 : 0) +
        (count('page') >= 1 ? 20 : 0),
      )
    default:
      return 0
  }
}

const STUDIO_LABELS: Record<string, string> = {
  plan:       'Product Plan',
  brand:      'Brand',
  components: 'Components',
  design:     'Design',
  workflows:  'Workflows',
  pages:      'Pages',
  code:       'Code',
  testing:    'Testing',
  analytics:  'Analytics',
}

const STUDIO_ROUTES: Record<string, string> = {
  plan:       'planner',
  brand:      'brand',
  components: 'components',
  design:     'design',
  workflows:  'workflows',
  pages:      'pages',
  code:       'code',
  testing:    'testing',
  analytics:  'analytics',
}

export const controlTowerRouter = router({
  /**
   * Compute full product health from live DB data:
   * - Overall score (0-100)
   * - Per-studio readiness scores
   * - Per-module breakdown (features + readiness per module)
   * - Top blockers derived from missing node kinds
   */
  getHealthSummary: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { productId } = input

      // ── Fetch nodes + edges ───────────────────────────────────────────
      const [allNodes, allEdges] = await Promise.all([
        ctx.db
          .select({ id: graphNodes.id, kind: graphNodes.kind, label: graphNodes.label, data: graphNodes.data })
          .from(graphNodes)
          .where(and(eq(graphNodes.productId, productId), isNull(graphNodes.deletedAt))),
        ctx.db
          .select({ id: graphEdges.id, kind: graphEdges.kind, sourceId: graphEdges.sourceId, targetId: graphEdges.targetId })
          .from(graphEdges)
          .where(eq(graphEdges.productId, productId)),
      ])

      // ── Per-studio scores ─────────────────────────────────────────────
      const studioScores = Object.keys(STUDIO_KINDS).map((studio) => {
        const score = scoreStudio(studio, allNodes, allEdges)
        return {
          studio,
          label: STUDIO_LABELS[studio] ?? studio,
          route: STUDIO_ROUTES[studio] ?? studio,
          score,
          nodeCount: allNodes.filter((n) => (STUDIO_KINDS[studio] ?? []).includes(n.kind)).length,
        }
      })

      const overall = Math.round(
        studioScores.reduce((sum, s) => sum + s.score, 0) / studioScores.length,
      )

      // ── Module breakdown ───────────────────────────────────────────────
      // A "module" node contains feature, page, entity, component nodes via 'contains' edges
      const moduleNodes = allNodes.filter((n) => n.kind === 'module')
      const containsEdges = allEdges.filter((e) => e.kind === 'contains')

      const modules = moduleNodes.map((mod) => {
        const childIds = new Set(containsEdges.filter((e) => e.sourceId === mod.id).map((e) => e.targetId))
        const children = allNodes.filter((n) => childIds.has(n.id))

        const featureCount   = children.filter((n) => n.kind === 'feature').length
        const pageCount      = children.filter((n) => n.kind === 'page').length
        const entityCount    = children.filter((n) => n.kind === 'entity').length
        const componentCount = children.filter((n) => n.kind === 'component').length

        // Readiness: features need tasks, pages need routes, entities need fields
        const featuresWithStatus = children.filter(
          (n) => n.kind === 'feature' && (n.data as Record<string,unknown>)?.status === 'Shipped',
        ).length
        const readiness = featureCount === 0
          ? 0
          : Math.round((featuresWithStatus / featureCount) * 100)

        const blockers: string[] = []
        if (featureCount === 0)   blockers.push('No features')
        if (pageCount === 0)      blockers.push('No pages')
        if (entityCount === 0)    blockers.push('No entities')
        if (componentCount === 0) blockers.push('No components linked')

        return {
          id: mod.id,
          label: mod.label,
          featureCount,
          pageCount,
          entityCount,
          componentCount,
          readiness,
          blockers,
          childCount: children.length,
        }
      })

      // ── Top blockers (missing pieces across entire product) ───────────
      const count = (kind: string) => allNodes.filter((n) => n.kind === kind).length
      const has   = (kind: string) => allNodes.some((n) => n.kind === kind)

      const blockers: Array<{ severity: 'error' | 'warning' | 'info'; title: string; studio: string; route: string }> = []

      if (!has('feature'))        blockers.push({ severity: 'error',   title: 'No features defined',          studio: 'Product Plan', route: 'planner'    })
      if (!has('page'))           blockers.push({ severity: 'error',   title: 'No pages defined',             studio: 'Page Builder', route: 'pages'      })
      if (!has('entity'))         blockers.push({ severity: 'error',   title: 'No data entities',             studio: 'Workflows',    route: 'workflows'  })
      if (!has('component'))      blockers.push({ severity: 'warning', title: 'No components built',          studio: 'Components',   route: 'components' })
      if (!has('token'))          blockers.push({ severity: 'warning', title: 'No brand tokens defined',      studio: 'Brand',        route: 'brand'      })
      if (!has('workflow'))       blockers.push({ severity: 'warning', title: 'No workflows modeled',         studio: 'Workflows',    route: 'workflows'  })
      if (count('feature') > 0 && !has('task'))
                                  blockers.push({ severity: 'warning', title: 'Features have no tasks',       studio: 'Tasks',        route: 'tasks'      })
      if (count('page') > 0 && !allEdges.some((e) => e.kind === 'routes_to'))
                                  blockers.push({ severity: 'info',    title: 'Pages have no route links',    studio: 'Graph',        route: 'graph-explorer' })
      if (count('component') > 0 && !allEdges.some((e) => e.kind === 'uses_component'))
                                  blockers.push({ severity: 'info',    title: 'Components not linked to pages', studio: 'Components', route: 'components' })

      // ── Summary stats ──────────────────────────────────────────────────
      const stats = {
        totalNodes:    allNodes.length,
        totalEdges:    allEdges.length,
        featureCount:  count('feature'),
        pageCount:     count('page'),
        componentCount:count('component'),
        moduleCount:   moduleNodes.length,
        tokenCount:    count('token'),
        workflowCount: count('workflow'),
      }

      return {
        overall,
        studioScores,
        modules,
        blockers: blockers.slice(0, 8),
        stats,
        isEmpty: allNodes.length === 0,
      }
    }),

  /**
   * Request AI health recommendations for the product based on live graph.
   * Returns structured insights: gaps, risks, suggestions, positives.
   */
  getAIHealthRecs: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { productId } = input

      const allNodes = await ctx.db
        .select({ kind: graphNodes.kind, label: graphNodes.label, data: graphNodes.data })
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, productId), isNull(graphNodes.deletedAt)))

      const allEdges = await ctx.db
        .select({ kind: graphEdges.kind })
        .from(graphEdges)
        .where(eq(graphEdges.productId, productId))

      const count = (kind: string) => allNodes.filter((n) => n.kind === kind).length

      const summary = {
        features:   count('feature'),
        pages:      count('page'),
        components: count('component'),
        entities:   count('entity'),
        tokens:     count('token'),
        workflows:  count('workflow'),
        screens:    count('screen'),
        tasks:      count('task'),
        totalEdges: allEdges.length,
        topLabels:  allNodes.slice(0, 20).map((n) => `${n.kind}:${n.label}`),
      }

      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'analyze',
        productId,
        prompt: `Analyze this product graph and return exactly 4-6 health insights in JSON.

Product graph summary:
${JSON.stringify(summary, null, 2)}

Return a JSON array of insight objects. Each object must have:
- "type": one of "gap" | "risk" | "suggestion" | "positive"
- "text": one sentence describing the insight (specific to the numbers above)
- "action": a short action label like "Add features" or "View Graph"
- "studio": the studio route slug (e.g. "features", "workflows", "brand", "components", "pages", "testing", "graph-explorer")

Only return valid JSON. No markdown, no explanation.`,
        context: { skill: 'health_analysis', summary },
        userId: ctx.session.userId,
      })

      // Parse JSON from AI response
      let insights: Array<{ type: string; text: string; action: string; studio: string }> = []
      try {
        const text = typeof result.text === 'string' ? result.text : JSON.stringify(result)
        const match = text.match(/\[[\s\S]*\]/)
        if (match) insights = JSON.parse(match[0])
      } catch { /* fallback below */ }

      // Fallback: derive deterministic insights from counts
      if (insights.length === 0) {
        if (summary.features === 0)   insights.push({ type: 'gap',        text: 'No features defined — the product plan is empty.',          action: 'Open Planner',    studio: 'planner'        })
        if (summary.components === 0) insights.push({ type: 'gap',        text: 'No components built — UI is unstructured.',                 action: 'Add Components',  studio: 'components'     })
        if (summary.tokens === 0)     insights.push({ type: 'risk',       text: 'No brand tokens — design consistency is at risk.',          action: 'Open Brand',      studio: 'brand'          })
        if (summary.features > 0 && summary.tasks === 0)
                                      insights.push({ type: 'risk',       text: `${summary.features} features have no tasks assigned.`,      action: 'Open Tasks',      studio: 'tasks'          })
        if (summary.features >= 3)    insights.push({ type: 'positive',   text: `${summary.features} features defined — solid foundation.`,  action: 'View Features',   studio: 'features'       })
        if (summary.components >= 5)  insights.push({ type: 'positive',   text: `${summary.components} components ready for handoff.`,       action: 'View Handoff',    studio: 'handoff'        })
        if (summary.workflows === 0)  insights.push({ type: 'suggestion', text: 'Model at least one workflow to capture business logic.',    action: 'Open Workflows',  studio: 'workflows'      })
      }

      return { insights: insights.slice(0, 6), generatedAt: new Date().toISOString() }
    }),
})
