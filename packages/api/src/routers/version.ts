import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { versions, branches } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const versionRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(versions)
        .where(eq(versions.productId, input.productId))
        .orderBy(desc(versions.createdAt))
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        label: z.string().min(1),
        parentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [version] = await ctx.db
        .insert(versions)
        .values({
          productId: input.productId,
          label: input.label,
          parentId: input.parentId,
          createdBy: ctx.session.userId,
        })
        .returning()
      return version
    }),

  listBranches: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(branches)
        .where(eq(branches.productId, input.productId))
    }),

  createBranch: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        baseVersionId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [branch] = await ctx.db
        .insert(branches)
        .values({
          productId: input.productId,
          name: input.name,
          baseVersionId: input.baseVersionId,
        })
        .returning()
      return branch
    }),

  updateBranch: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['active', 'merged', 'archived']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [branch] = await ctx.db
        .update(branches)
        .set({ status: input.status })
        .where(eq(branches.id, input.id))
        .returning()
      return branch
    }),
})
