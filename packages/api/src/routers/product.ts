import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { products } from '@product-os/db'
import { router, protectedProcedure } from '../trpc.js'

export const productRouter = router({
  list: protectedProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const orgId = input.orgId ?? ctx.session.orgId
      return ctx.db.select().from(products).where(eq(products.orgId, orgId))
    }),

  getBySlug: protectedProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const orgId = input.orgId ?? ctx.session.orgId
      const [product] = await ctx.db
        .select()
        .from(products)
        .where(and(eq(products.orgId, orgId), eq(products.slug, input.slug)))
        .limit(1)
      if (!product) {
        throw new Error('Product not found')
      }
      return product
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        slug: z.string().min(1).max(100),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .insert(products)
        .values({
          orgId: ctx.session.orgId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          icon: input.icon,
          createdBy: ctx.session.userId,
        })
        .returning()
      return product
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const setClause: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.name !== undefined) setClause.name = updates.name
      if (updates.description !== undefined) setClause.description = updates.description
      if (updates.icon !== undefined) setClause.icon = updates.icon

      const [product] = await ctx.db
        .update(products)
        .set(setClause)
        .where(eq(products.id, id))
        .returning()
      if (!product) {
        throw new Error('Product not found')
      }
      return product
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [product] = await ctx.db
        .delete(products)
        .where(eq(products.id, input.id))
        .returning()
      if (!product) {
        throw new Error('Product not found')
      }
      return product
    }),
})
