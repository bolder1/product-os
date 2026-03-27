import { z } from 'zod'
import { router, protectedProcedure } from '../trpc.js'
import { aiSkillHistory } from '@product-os/db'

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
})
