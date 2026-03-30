import { z } from 'zod'
import { eq, and, or, ilike } from 'drizzle-orm'
import { templateBundles } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const templateRouter = router({
  listBuiltIn: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(templateBundles)
      .where(eq(templateBundles.isBuiltIn, true))
  }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        or(
          eq(templateBundles.isBuiltIn, true),
          eq(templateBundles.isPublic, true),
          eq(templateBundles.orgId, ctx.session.orgId),
        ),
        or(
          ilike(templateBundles.name, `%${input.query}%`),
          ilike(templateBundles.description, `%${input.query}%`),
        ),
      ]
      if (input.category) {
        conditions.push(eq(templateBundles.category, input.category))
      }
      return ctx.db
        .select()
        .from(templateBundles)
        .where(and(...conditions))
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templateBundles)
        .where(eq(templateBundles.id, input.id))
        .limit(1)
      if (!template) {
        throw new Error('Template not found')
      }
      return template
    }),

  applyTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        productId: z.string().uuid(),
        options: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the template bundle
      const [template] = await ctx.db
        .select()
        .from(templateBundles)
        .where(eq(templateBundles.id, input.templateId))
        .limit(1)

      if (!template) {
        throw new Error('Template not found')
      }

      // Delegate to the templates package applier
      const { applyTemplate } = await import('@product-os/templates')
      const result = await applyTemplate({
        db: ctx.db,
        bundle: template.bundle,
        productId: input.productId,
        userId: ctx.session.userId,
        options: input.options,
      })

      return result
    }),
})
