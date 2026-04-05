import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { activityLog } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const activityRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(activityLog)
        .where(eq(activityLog.productId, input.productId))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset)
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        action: z.string(),
        entityType: z.string(),
        entityId: z.string().uuid().optional(),
        diff: z.record(z.unknown()).optional(),
        studioOrigin: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(activityLog)
        .values({
          productId: input.productId,
          actorId: ctx.session.userId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          diff: input.diff,
          studioOrigin: input.studioOrigin,
        })
        .returning()
      return entry
    }),
})
