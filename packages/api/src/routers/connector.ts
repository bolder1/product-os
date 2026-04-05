import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { connectorConfigs, connectorBindings } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const connectorRouter = router({
  list: protectedProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(connectorConfigs)
        .where(eq(connectorConfigs.orgId, input.orgId))
    }),

  create: protectedProcedure
    .input(
      z.object({
        orgId: z.string().uuid(),
        type: z.enum(['figma', 'github', 'jira', 'slack', 'google_analytics', 'stripe', 'notion', 'custom']),
        name: z.string().min(1),
        settings: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [config] = await ctx.db
        .insert(connectorConfigs)
        .values({
          orgId: input.orgId,
          type: input.type,
          name: input.name,
          settings: input.settings ?? {},
        })
        .returning()
      return config
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        settings: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.name) updates.name = input.name
      if (input.settings) updates.settings = input.settings
      const [config] = await ctx.db
        .update(connectorConfigs)
        .set(updates)
        .where(eq(connectorConfigs.id, input.id))
        .returning()
      return config
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(connectorConfigs).where(eq(connectorConfigs.id, input.id))
      return { success: true }
    }),

  listBindings: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(connectorBindings)
        .where(eq(connectorBindings.productId, input.productId))
    }),

  createBinding: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        connectorId: z.string().uuid(),
        nodeId: z.string().uuid().optional(),
        externalId: z.string().optional(),
        externalType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [binding] = await ctx.db
        .insert(connectorBindings)
        .values(input)
        .returning()
      return binding
    }),
})
