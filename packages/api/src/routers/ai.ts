import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { aiSkillHistory, graphNodes, graphEdges } from '@product-os/db'

export const aiRouter = router({
  suggest: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        nodeId: z.string().uuid().optional(),
        prompt: z.string().min(1),
        context: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'suggest',
        productId: input.productId,
        nodeId: input.nodeId,
        prompt: input.prompt,
        context: input.context,
        userId: ctx.session.userId,
      })

      // Log to ai_skill_history
      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: 'suggest',
        inputContext: { prompt: input.prompt, nodeId: input.nodeId, ...input.context },
        output: result as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return result
    }),

  scaffold: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        prompt: z.string().min(1),
        templateId: z.string().uuid().optional(),
        context: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'scaffold',
        productId: input.productId,
        prompt: input.prompt,
        templateId: input.templateId,
        context: input.context,
        userId: ctx.session.userId,
      })

      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: 'scaffold',
        inputContext: { prompt: input.prompt, templateId: input.templateId, ...input.context },
        output: result as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return result
    }),

  analyze: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        nodeId: z.string().uuid().optional(),
        analysisType: z.string().min(1),
        context: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'analyze',
        productId: input.productId,
        nodeId: input.nodeId,
        analysisType: input.analysisType,
        context: input.context,
        userId: ctx.session.userId,
      })

      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: 'analyze',
        inputContext: { analysisType: input.analysisType, nodeId: input.nodeId, ...input.context },
        output: result as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return result
    }),

  listSkills: protectedProcedure.query(async () => {
    const { listSkills } = await import('@product-os/ai')
    return listSkills()
  }),

  /**
   * Computer Mode — execute a named action step within a running plan.
   * Called by the ComputerModePanel when Auto mode or confirmed Assist steps run.
   */
  executeAction: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        actionKind: z.enum(['suggest', 'scaffold', 'analyze', 'create_task', 'update_node', 'run_plan']),
        label: z.string().min(1),
        mode: z.enum(['suggest', 'assist', 'auto']),
        context: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      // Map Computer Mode action kinds to AI skills
      const skillMap: Record<string, 'suggest' | 'scaffold' | 'analyze'> = {
        suggest:     'suggest',
        scaffold:    'scaffold',
        analyze:     'analyze',
        create_task: 'suggest',
        update_node: 'scaffold',
        run_plan:    'analyze',
      }

      const skill = skillMap[input.actionKind] ?? 'suggest'

      const result = await invokeSkill({
        skill,
        productId: input.productId,
        prompt: input.label,
        context: {
          ...input.context,
          computerMode: input.mode,
          actionKind: input.actionKind,
        },
        userId: ctx.session.userId,
      })

      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: `computer_mode:${input.actionKind}`,
        inputContext: { label: input.label, mode: input.mode, ...input.context },
        output: result as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return {
        actionKind: input.actionKind,
        label: input.label,
        mode: input.mode,
        result,
      }
    }),

  /**
   * Computer Mode — build an execution plan from a natural-language goal.
   * Returns an ordered list of steps the AI will perform.
   */
  buildPlan: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        goal: z.string().min(1),
        mode: z.enum(['suggest', 'assist', 'auto']),
        studioOrigin: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      const result = await invokeSkill({
        skill: 'analyze',
        productId: input.productId,
        analysisType: 'plan',
        prompt: `Build execution plan for goal: "${input.goal}"`,
        context: {
          studioOrigin: input.studioOrigin ?? 'system',
          computerMode: input.mode,
          planningMode: true,
        },
        userId: ctx.session.userId,
      })

      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: 'computer_mode:build_plan',
        inputContext: { goal: input.goal, mode: input.mode },
        output: result as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return { goal: input.goal, mode: input.mode, result }
    }),

  /**
   * Scaffold a product graph from a natural-language description and immediately
   * persist the generated nodes + edges to the DB.
   * Returns { nodesCreated, edgesCreated, summary, nodeIdMap }.
   */
  scaffoldAndApply: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        prompt: z.string().min(1).max(2000),
        targetStructure: z.enum([
          'product_plan',
          'feature_breakdown',
          'entity_schema',
          'workflow',
          'journey_map',
          'page_layout',
          'component_tree',
          'brand_system',
        ]).default('product_plan'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { invokeSkill } = await import('@product-os/ai')

      // 1. Call scaffold skill
      const result = await invokeSkill({
        skill: 'scaffold',
        productId: input.productId,
        prompt: input.prompt,
        context: {
          studioOrigin: 'graph-explorer',
          targetStructure: input.targetStructure,
          prompt: input.prompt,
        },
        userId: ctx.session.userId,
      })

      type ScaffoldData = {
        nodes: Array<{ tempId: string; kind: string; label: string; data: Record<string, unknown> }>
        edges: Array<{ sourceTempId: string; targetTempId: string; kind: string }>
        summary: string
      }

      const data = result.data as ScaffoldData | undefined
      if (!result.success || !data) {
        throw new Error(result.error ?? 'Scaffold skill returned no data')
      }

      // 2. Insert nodes, collect tempId → realId map
      const nodeIdMap = new Map<string, string>()
      let nodesCreated = 0

      for (const node of data.nodes) {
        const [row] = await ctx.db
          .insert(graphNodes)
          .values({
            productId: input.productId,
            kind: node.kind as typeof graphNodes.$inferInsert.kind,
            label: node.label,
            data: node.data,
            createdBy: ctx.session.userId,
          })
          .returning({ id: graphNodes.id })
        if (row) {
          nodeIdMap.set(node.tempId, row.id)
          nodesCreated++
        }
      }

      // 3. Insert edges using resolved IDs
      let edgesCreated = 0
      for (const edge of data.edges) {
        const sourceId = nodeIdMap.get(edge.sourceTempId)
        const targetId = nodeIdMap.get(edge.targetTempId)
        if (!sourceId || !targetId) continue
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId,
          targetId,
          kind: edge.kind as typeof graphEdges.$inferInsert.kind,
        })
        edgesCreated++
      }

      // 4. Log to ai_skill_history
      await ctx.db.insert(aiSkillHistory).values({
        productId: input.productId,
        skill: 'scaffold_and_apply',
        inputContext: { prompt: input.prompt, targetStructure: input.targetStructure },
        output: { nodesCreated, edgesCreated, summary: data.summary } as Record<string, unknown>,
        model: result.model ?? null,
        tokensUsed: result.tokensUsed ?? null,
        actorId: ctx.session.userId,
      })

      return {
        nodesCreated,
        edgesCreated,
        summary: data.summary,
        nodeIdMap: Object.fromEntries(nodeIdMap),
        model: result.model,
      }
    }),
})
