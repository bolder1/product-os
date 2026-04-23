import { z } from 'zod'
import { eq, and, sql } from 'drizzle-orm'
import { notifications, notificationPreferences, notificationTypeEnum } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.session.userId))
        .orderBy(notifications.createdAt)
        .limit(input.limit)
        .offset(input.offset)
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [notification] = await ctx.db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.userId),
          ),
        )
        .returning()
      if (!notification) {
        throw new Error('Notification not found')
      }
      return notification
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, ctx.session.userId),
          eq(notifications.read, false),
        ),
      )
    return { success: true }
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.session.userId),
          eq(notifications.read, false),
        ),
      )
    return result?.count ?? 0
  }),

  getPreferences: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const prefs = await ctx.db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, ctx.session.userId),
            eq(notificationPreferences.productId, input.productId),
          ),
        )
      // Map preferences by type for easier client usage
      const prefMap: Record<string, any> = {}
      for (const pref of prefs) {
        prefMap[pref.type] = {
          enabled: pref.enabled,
          channel: pref.channel,
          emailDigestFrequency: pref.emailDigestFrequency,
        }
      }
      return prefMap
    }),

  setPreferences: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        preferences: z.record(
          z.string(),
          z.object({
            enabled: z.boolean().default(true),
            channel: z.enum(['in_app', 'email', 'both']).default('in_app'),
            emailDigestFrequency: z
              .enum(['off', 'instant', 'daily', 'weekly'])
              .default('off'),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // For each preference in input, upsert into notificationPreferences
      for (const [type, settings] of Object.entries(input.preferences)) {
        // First try to find existing preference
        const existing = await ctx.db
          .select()
          .from(notificationPreferences)
          .where(
            and(
              eq(notificationPreferences.userId, ctx.session.userId),
              eq(notificationPreferences.productId, input.productId),
              eq(notificationPreferences.type, type as any),
            ),
          )
          .limit(1)

        if (existing.length > 0) {
          // Update existing
          await ctx.db
            .update(notificationPreferences)
            .set({
              enabled: settings.enabled,
              channel: settings.channel,
              emailDigestFrequency: settings.emailDigestFrequency,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(notificationPreferences.userId, ctx.session.userId),
                eq(notificationPreferences.productId, input.productId),
                eq(notificationPreferences.type, type as any),
              ),
            )
        } else {
          // Insert new
          await ctx.db.insert(notificationPreferences).values({
            userId: ctx.session.userId,
            productId: input.productId,
            type: type as any,
            enabled: settings.enabled,
            channel: settings.channel,
            emailDigestFrequency: settings.emailDigestFrequency,
          })
        }
      }
      return { success: true }
    }),
})
