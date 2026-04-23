import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { planSessions, planAnswers, planDerivedArtifacts } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

const stepSchema = z.enum(['memory', 'brief', 'summary', 'template', 'team', 'tasks', 'done'])

export const planModeRouter = router({
  start: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Re-use an active session if one exists
      const [existing] = await ctx.db
        .select()
        .from(planSessions)
        .where(eq(planSessions.productId, input.productId))
        .orderBy(desc(planSessions.createdAt))
        .limit(1)
      if (existing && existing.status === 'in_progress') return existing
      const [row] = await ctx.db
        .insert(planSessions)
        .values({ productId: input.productId, createdBy: ctx.session.userId })
        .returning()
      return row
    }),

  getCurrent: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(planSessions)
        .where(eq(planSessions.productId, input.productId))
        .orderBy(desc(planSessions.createdAt))
        .limit(1)
      if (!row) return null
      const answers = await ctx.db
        .select()
        .from(planAnswers)
        .where(eq(planAnswers.sessionId, row.id))
      const artifacts = await ctx.db
        .select()
        .from(planDerivedArtifacts)
        .where(eq(planDerivedArtifacts.sessionId, row.id))
      return { session: row, answers, artifacts }
    }),

  answer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        questionKey: z.string().min(1),
        answer: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(planAnswers)
        .values({
          sessionId: input.sessionId,
          questionKey: input.questionKey,
          answer: input.answer as any,
        })
        .returning()
      await ctx.db
        .update(planSessions)
        .set({ updatedAt: new Date() })
        .where(eq(planSessions.id, input.sessionId))
      return row
    }),

  setStep: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid(), step: stepSchema }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(planSessions)
        .set({ currentStep: input.step, updatedAt: new Date() })
        .where(eq(planSessions.id, input.sessionId))
        .returning()
      return row
    }),

  saveArtifact: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        kind: z.string(),
        payload: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(planDerivedArtifacts)
        .values({
          sessionId: input.sessionId,
          kind: input.kind,
          payload: input.payload,
        })
        .returning()
      return row
    }),

  finalize: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(planSessions)
        .set({ status: 'finalized', currentStep: 'done', updatedAt: new Date() })
        .where(eq(planSessions.id, input.sessionId))
        .returning()
      return row
    }),
})
