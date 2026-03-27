import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { graphNodes } from '@product-os/db'
import { router, protectedProcedure } from '../trpc.js'

export const plannerRouter = router({
  getPlan: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [plan] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'plan'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .limit(1)
      if (!plan) {
        throw new Error('Plan node not found for this product')
      }
      return plan
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        data: z.record(z.unknown()),
        label: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const setClause: Record<string, unknown> = {
        data: input.data,
        updatedAt: new Date(),
      }
      if (input.label !== undefined) {
        setClause.label = input.label
      }

      const [plan] = await ctx.db
        .update(graphNodes)
        .set(setClause)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'plan'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .returning()

      if (!plan) {
        throw new Error('Plan node not found for this product')
      }
      return plan
    }),

  finalizePlan: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Mark the plan as finalized by setting a flag in data
      const [existing] = await ctx.db
        .select()
        .from(graphNodes)
        .where(
          and(
            eq(graphNodes.productId, input.productId),
            eq(graphNodes.kind, 'plan'),
            isNull(graphNodes.deletedAt),
          ),
        )
        .limit(1)

      if (!existing) {
        throw new Error('Plan node not found for this product')
      }

      const updatedData = {
        ...(existing.data as Record<string, unknown>),
        finalized: true,
        finalizedAt: new Date().toISOString(),
        finalizedBy: ctx.session.userId,
      }

      const [plan] = await ctx.db
        .update(graphNodes)
        .set({ data: updatedData, updatedAt: new Date() })
        .where(eq(graphNodes.id, existing.id))
        .returning()

      // Trigger graph compilation via the graph engine
      try {
        const { compileGraph } = await import('@product-os/graph')
        await compileGraph({
          db: ctx.db,
          productId: input.productId,
          userId: ctx.session.userId,
        })
      } catch {
        // Graph compilation is best-effort; the plan is still finalized
      }

      return plan
    }),
})
