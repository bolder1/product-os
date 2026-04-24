import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { decisions } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

const decisionStatusValues = ['proposed', 'decided', 'revisited', 'superseded'] as const

const relatedEntitySchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
})

const alternativeSchema = z.object({
  option: z.string(),
  proscons: z.string(),
})

export const decisionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        status: z.enum(decisionStatusValues).optional(),
        studio: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(decisions.productId, input.productId)]
      if (input.status) conditions.push(eq(decisions.status, input.status))
      if (input.studio) conditions.push(eq(decisions.studio, input.studio))
      return ctx.db
        .select()
        .from(decisions)
        .where(and(...conditions))
        .orderBy(desc(decisions.createdAt))
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        title: z.string().min(1).max(500),
        rationale: z.string().default(''),
        alternatives: z.array(alternativeSchema).default([]),
        status: z.enum(decisionStatusValues).default('proposed'),
        decidedBy: z.string().optional(),
        studio: z.string().default('operate'),
        tags: z.array(z.string()).default([]),
        relatedEntities: z.array(relatedEntitySchema).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [decision] = await ctx.db
        .insert(decisions)
        .values({
          productId: input.productId,
          title: input.title,
          rationale: input.rationale,
          alternatives: input.alternatives,
          status: input.status,
          decidedBy: input.decidedBy,
          studio: input.studio,
          tags: input.tags,
          relatedEntities: input.relatedEntities,
          createdBy: ctx.session.userId,
        })
        .returning()

      ctx.eventBus.emit('decision.created', {
        productId: input.productId,
        actorId: ctx.session.userId,
        payload: { decisionId: decision.id, title: input.title, status: input.status },
      }).catch(() => {})

      return decision
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        rationale: z.string().optional(),
        alternatives: z.array(alternativeSchema).optional(),
        status: z.enum(decisionStatusValues).optional(),
        decidedBy: z.string().optional(),
        studio: z.string().optional(),
        tags: z.array(z.string()).optional(),
        relatedEntities: z.array(relatedEntitySchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const setClause: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.title !== undefined) setClause.title = updates.title
      if (updates.rationale !== undefined) setClause.rationale = updates.rationale
      if (updates.alternatives !== undefined) setClause.alternatives = updates.alternatives
      if (updates.status !== undefined) setClause.status = updates.status
      if (updates.decidedBy !== undefined) setClause.decidedBy = updates.decidedBy
      if (updates.studio !== undefined) setClause.studio = updates.studio
      if (updates.tags !== undefined) setClause.tags = updates.tags
      if (updates.relatedEntities !== undefined) setClause.relatedEntities = updates.relatedEntities

      const [decision] = await ctx.db
        .update(decisions)
        .set(setClause)
        .where(eq(decisions.id, id))
        .returning()

      if (!decision) throw new Error('Decision not found')

      ctx.eventBus.emit('decision.updated', {
        productId: decision.productId,
        actorId: ctx.session.userId,
        payload: { decisionId: id },
      }).catch(() => {})

      return decision
    }),

  decide: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        decidedBy: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [decision] = await ctx.db
        .update(decisions)
        .set({
          status: 'decided',
          decidedBy: input.decidedBy,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(decisions.id, input.id))
        .returning()

      if (!decision) throw new Error('Decision not found')
      return decision
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [decision] = await ctx.db
        .delete(decisions)
        .where(eq(decisions.id, input.id))
        .returning()
      if (!decision) throw new Error('Decision not found')
      return decision
    }),
})
