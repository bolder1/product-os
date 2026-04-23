import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { products } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

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
      // Validate orgId is a proper UUID before hitting the DB
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!UUID_RE.test(ctx.session.orgId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Your organization is not fully set up. Please complete onboarding or refresh the page and try again.',
        })
      }

      try {
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
      } catch (err: any) {
        if (err?.code === '23503') {
          // Foreign key violation — org doesn't exist in DB
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Your organization record was not found. Please log out, log back in, and complete the setup steps.',
          })
        }
        if (err?.code === '23505') {
          // Unique constraint — slug already taken within this org
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A product with this URL slug already exists in your organization. Please choose a different name.',
          })
        }
        throw err
      }
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
