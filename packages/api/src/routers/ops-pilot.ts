import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { graphNodes, graphEdges, tasks, aiSkillHistory } from '@product-os/db'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

type IntentKind =
  | 'answer_question'
  | 'create_task'
  | 'navigate_to'
  | 'scaffold_nodes'
  | 'run_analysis'
  | 'show_stats'
  | 'unknown'

interface ParsedIntent {
  kind: IntentKind
  confidence: number
  params: Record<string, unknown>
}

interface ActionResult {
  type: 'task_created' | 'navigate' | 'nodes_created' | 'stats' | 'none'
  data: Record<string, unknown>
}

// Deterministic keyword-based intent classification (fast, no AI call needed)
function classifyIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase()

  // Task creation
  if (/\b(create|add|make|new)\b.*\b(task|ticket|issue|todo)\b/.test(lower)) {
    const titleMatch = text.match(/task[:\s]+["']?(.+?)["']?$/i) ??
                       text.match(/called\s+["']?(.+?)["']?$/i) ??
                       text.match(/["'](.+?)["']/i)
    return {
      kind: 'create_task',
      confidence: 0.9,
      params: { title: titleMatch?.[1]?.trim() ?? text.replace(/create\s+(a\s+)?task\s*/i, '').trim() },
    }
  }

  // Navigation
  const studioNames = ['features', 'pages', 'components', 'brand', 'design', 'workflows',
    'analytics', 'testing', 'releases', 'code', 'canvas', 'graph-explorer',
    'handoff', 'planner', 'control-tower', 'templates']
  for (const s of studioNames) {
    if (lower.includes(s) && /\b(go|open|show|take me|navigate|visit)\b/.test(lower)) {
      return { kind: 'navigate_to', confidence: 0.88, params: { studio: s } }
    }
  }

  // Stats / health
  if (/\b(health|score|stat|metric|overview|summary|progress|status)\b/.test(lower)) {
    return { kind: 'show_stats', confidence: 0.85, params: {} }
  }

  // Scaffold / generate
  if (/\b(scaffold|generate|build|create|add)\b.*\b(feature|component|page|entity|workflow|module)\b/.test(lower)) {
    return { kind: 'scaffold_nodes', confidence: 0.82, params: { prompt: text } }
  }

  // Analysis
  if (/\b(analyse|analyze|review|audit|check|diagnose|why|what.*(missing|wrong|broken|lacking))\b/.test(lower)) {
    return { kind: 'run_analysis', confidence: 0.8, params: {} }
  }

  return { kind: 'answer_question', confidence: 0.7, params: {} }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const opsPilotRouter = router({
  /**
   * Main chat endpoint — multi-turn conversation with the product graph.
   * Returns a reply message + optional structured actions.
   */
  chat: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        currentStudio: z.string().default('planner'),
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          }),
        ).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')
      const { productId, messages, currentStudio } = input
      const lastMessage = messages[messages.length - 1]!
      const userText = lastMessage.content

      // 1. Classify intent locally first (fast)
      const intent = classifyIntent(userText)

      // 2. Fetch product graph context for all paths
      const [nodes, edges] = await Promise.all([
        ctx.db.select({ id: graphNodes.id, kind: graphNodes.kind, label: graphNodes.label })
              .from(graphNodes)
              .where(eq(graphNodes.productId, productId)),
        ctx.db.select({ sourceId: graphEdges.sourceId, targetId: graphEdges.targetId, kind: graphEdges.kind })
              .from(graphEdges)
              .where(eq(graphEdges.productId, productId)),
      ])

      const nodeCount = nodes.length
      const edgeCount = edges.length
      const isEmpty   = nodeCount === 0

      // Count by kind
      const kindCounts: Record<string, number> = {}
      for (const n of nodes) {
        kindCounts[n.kind] = (kindCounts[n.kind] ?? 0) + 1
      }

      const graphSummary = isEmpty
        ? 'No product graph nodes yet.'
        : `Graph has ${nodeCount} nodes and ${edgeCount} edges. ` +
          Object.entries(kindCounts).map(([k, v]) => `${v} ${k}`).join(', ') + '.'

      // 3. Execute intent
      let actionResult: ActionResult = { type: 'none', data: {} }
      let reply = ''

      // ----- CREATE TASK -----
      if (intent.kind === 'create_task') {
        const rawTitle = (intent.params.title as string | undefined) ?? userText
        const title = rawTitle.slice(0, 200)

        // Use AI to enrich the task (description, priority)
        let description = ''
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'

        try {
          const aiResult = await invokeSkill({
            skill: 'suggest',
            productId,
            prompt: `Generate a concise task description (1-2 sentences) and priority (low/medium/high/urgent) for this task: "${title}". Context: ${graphSummary}. Respond as JSON: {"description":"...","priority":"..."}`,
            context: { graphSummary },
            userId: ctx.session.userId,
          })
          const raw = JSON.stringify(aiResult)
          const m = raw.match(/\{[^}]*"description"[^}]*\}/)
          if (m) {
            const parsed = JSON.parse(m[0])
            description = parsed.description ?? ''
            priority    = (['low','medium','high','urgent'].includes(parsed.priority) ? parsed.priority : 'medium') as typeof priority
          }
        } catch { /* use defaults */ }

        const [newTask] = await ctx.db
          .insert(tasks)
          .values({
            productId,
            title,
            description,
            status: 'todo',
            priority,
            createdBy: ctx.session.userId,
          })
          .returning()

        actionResult = {
          type: 'task_created',
          data: { id: newTask!.id, title, description, priority, status: 'todo' },
        }
        reply = `Task created: **${title}**${description ? `\n\n${description}` : ''}\n\nPriority set to **${priority}**.`
      }

      // ----- NAVIGATE -----
      else if (intent.kind === 'navigate_to') {
        const studio = intent.params.studio as string
        actionResult = { type: 'navigate', data: { studio } }
        reply = `Opening the **${studio}** studio for you.`
      }

      // ----- SHOW STATS -----
      else if (intent.kind === 'show_stats') {
        actionResult = {
          type: 'stats',
          data: { nodeCount, edgeCount, kindCounts, isEmpty },
        }
        if (isEmpty) {
          reply = `Your product graph is empty. Start by applying a template or scaffolding nodes in the Planner.`
        } else {
          const topKinds = Object.entries(kindCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k, v]) => `**${v}** ${k}`)
          reply = `**Product Graph Summary**\n\n${topKinds.join(' · ')}\n\n${edgeCount} edges connecting them. Currently in the **${currentStudio}** studio.`
        }
      }

      // ----- SCAFFOLD -----
      else if (intent.kind === 'scaffold_nodes') {
        try {
          const aiResult = await invokeSkill({
            skill: 'scaffold',
            productId,
            prompt: userText,
            context: { graphSummary, studioOrigin: currentStudio, targetStructure: 'feature_breakdown' },
            userId: ctx.session.userId,
          })

          type ScaffoldData = {
            nodes: Array<{ tempId: string; kind: string; label: string; data: Record<string, unknown> }>
            edges: Array<{ sourceTempId: string; targetTempId: string; kind: string }>
            summary: string
          }

          const data = aiResult.data as ScaffoldData | undefined
          if (aiResult.success && data) {
            const nodeIdMap = new Map<string, string>()
            let nodesCreated = 0

            for (const node of data.nodes) {
              const [row] = await ctx.db
                .insert(graphNodes)
                .values({
                  productId,
                  kind: node.kind as typeof graphNodes.$inferInsert.kind,
                  label: node.label,
                  data: node.data,
                  createdBy: ctx.session.userId,
                })
                .returning({ id: graphNodes.id })
              if (row) { nodeIdMap.set(node.tempId, row.id); nodesCreated++ }
            }

            let edgesCreated = 0
            for (const edge of data.edges) {
              const sourceId = nodeIdMap.get(edge.sourceTempId)
              const targetId = nodeIdMap.get(edge.targetTempId)
              if (!sourceId || !targetId) continue
              await ctx.db.insert(graphEdges).values({
                productId, sourceId, targetId,
                kind: edge.kind as typeof graphEdges.$inferInsert.kind,
              })
              edgesCreated++
            }

            actionResult = {
              type: 'nodes_created',
              data: { nodesCreated, edgesCreated, summary: data.summary },
            }
            reply = `Scaffolded **${nodesCreated} nodes** and **${edgesCreated} edges**.\n\n${data.summary}`
          } else {
            reply = `I tried to scaffold that but the AI didn't return a valid structure. Try rephrasing with more detail.`
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          reply = `Scaffold failed: ${msg}`
        }
      }

      // ----- RUN ANALYSIS / ANSWER QUESTION -----
      else {
        // Call AI with full graph context
        const historyStr = messages
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'User' : 'OpsPilot'}: ${m.content}`)
          .join('\n')

        try {
          const aiResult = await invokeSkill({
            skill: 'analyze',
            productId,
            analysisType: 'copilot_chat',
            prompt: `You are OpsPilot, an AI product copilot embedded in Product OS.
You have access to the user's product graph.

Product graph: ${graphSummary}
Current studio: ${currentStudio}

Conversation so far:
${historyStr}

The user's latest message: "${userText}"

Reply helpfully and concisely. If you see gaps in their product graph, mention them. You can suggest actions the user should take. Format your reply in markdown.`,
            context: { graphSummary, currentStudio, conversationLength: messages.length },
            userId: ctx.session.userId,
          })

          reply = (aiResult.data as { text?: string } | undefined)?.text
            ?? (typeof aiResult.data === 'string' ? aiResult.data : null)
            ?? aiResult.rawText
            ?? `I'm not sure about that, but here's what I know: ${graphSummary}`
        } catch {
          // Fallback answer from graph data
          if (isEmpty) {
            reply = `Your product graph is empty. I can help you scaffold nodes, apply a template, or create tasks — just ask!`
          } else {
            reply = `Your product currently has **${nodeCount} nodes** across ${Object.keys(kindCounts).length} types: ${Object.entries(kindCounts).map(([k,v]) => `${v} ${k}`).join(', ')}. What would you like to do with it?`
          }
        }
      }

      // 4. Log to ai_skill_history
      await ctx.db.insert(aiSkillHistory).values({
        productId,
        skill: `ops_pilot:${intent.kind}`,
        inputContext: {
          userText,
          currentStudio,
          intent: intent.kind,
          messageCount: messages.length,
        },
        output: { reply, actionResult } as Record<string, unknown>,
        model: null,
        tokensUsed: null,
        actorId: ctx.session.userId,
      })

      return {
        reply,
        intent: intent.kind,
        intentConfidence: intent.confidence,
        action: actionResult,
        graphSummary,
      }
    }),

  /**
   * Fetch quick-launch suggestions based on the current studio + graph state.
   * Used to populate the suggested prompts when the panel first opens.
   */
  getSuggestions: protectedProcedure
    .input(z.object({
      productId: z.string().uuid(),
      currentStudio: z.string().default('planner'),
    }))
    .query(async ({ ctx, input }) => {
      const nodes = await ctx.db
        .select({ kind: graphNodes.kind })
        .from(graphNodes)
        .where(eq(graphNodes.productId, input.productId))

      const kindCounts: Record<string, number> = {}
      for (const n of nodes) { kindCounts[n.kind] = (kindCounts[n.kind] ?? 0) + 1 }
      const isEmpty = nodes.length === 0

      const studioSuggestions: Record<string, string[]> = {
        'planner':       ['What modules are planned?', 'Create a task for the next sprint', 'What's missing in my product plan?'],
        'features':      ['List all features in progress', 'Create a task for a new feature', 'What features are blocking launch?'],
        'components':    ['How many components exist?', 'Scaffold a button component', 'What components are missing?'],
        'brand':         ['What brand tokens are defined?', 'Analyse my brand completeness', 'Create a task to define typography'],
        'design':        ['Show me my design system health', 'What pages need design work?', 'Navigate to components'],
        'workflows':     ['How many workflows exist?', 'Scaffold a checkout workflow', 'What entities are missing?'],
        'pages':         ['List all pages', 'Create a task for the homepage', 'Navigate to design'],
        'analytics':     ['Show me product stats', 'What metrics are being tracked?', 'Navigate to testing'],
        'control-tower': ['What's the overall health score?', 'Show me critical blockers', 'Run an AI health analysis'],
        'testing':       ['What's the test coverage?', 'Create a task for QA', 'Navigate to releases'],
        'code':          ['Show product graph stats', 'Create a bug task', 'Navigate to handoff'],
      }

      const base = studioSuggestions[input.currentStudio] ?? [
        'What's the current health score?',
        'Show me product stats',
        'Create a task',
      ]

      const extra: string[] = []
      if (isEmpty) {
        extra.push('Scaffold a product from scratch', 'Apply a template to get started')
      } else {
        if (!kindCounts['feature'])   extra.push('Scaffold features for my product')
        if (!kindCounts['component']) extra.push('Generate core UI components')
        if (!kindCounts['page'])      extra.push('Create my main pages')
      }

      return { suggestions: [...base, ...extra].slice(0, 6), isEmpty, kindCounts }
    }),
})
