import { z } from 'zod'
import { eq, and, sql } from 'drizzle-orm'
import { notifications } from '@product-os/db'
import { router, protectedProcedure } from '../trpc.js'

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
})
