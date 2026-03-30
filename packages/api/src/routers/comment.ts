import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { comments } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const commentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        nodeId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(comments)
        .where(eq(comments.nodeId, input.nodeId))
        .orderBy(comments.createdAt)
        .limit(input.limit)
        .offset(input.offset)
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        nodeId: z.string().uuid(),
        body: z.string().min(1),
        parentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.db
        .insert(comments)
        .values({
          productId: input.productId,
          nodeId: input.nodeId,
          authorId: ctx.session.userId,
          body: input.body,
          parentId: input.parentId,
        })
        .returning()
      return comment
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.db
        .update(comments)
        .set({ resolved: true, updatedAt: new Date() })
        .where(eq(comments.id, input.id))
        .returning()
      if (!comment) {
        throw new Error('Comment not found')
      }
      return comment
    }),
})
