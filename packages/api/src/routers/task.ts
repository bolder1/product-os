import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { tasks } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

const taskStatusValues = ['todo', 'in_progress', 'review', 'done', 'cancelled'] as const
const taskPriorityValues = ['low', 'medium', 'high', 'urgent'] as const

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        status: z.enum(taskStatusValues).optional(),
        assigneeId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(tasks.productId, input.productId)]
      if (input.status) {
        conditions.push(eq(tasks.status, input.status))
      }
      if (input.assigneeId) {
        conditions.push(eq(tasks.assigneeId, input.assigneeId))
      }
      return ctx.db.select().from(tasks).where(and(...conditions))
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        nodeId: z.string().uuid().optional(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        status: z.enum(taskStatusValues).default('todo'),
        priority: z.enum(taskPriorityValues).default('medium'),
        assigneeId: z.string().uuid().optional(),
        dueAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .insert(tasks)
        .values({
          productId: input.productId,
          nodeId: input.nodeId,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          dueAt: input.dueAt,
          createdBy: ctx.session.userId,
        })
        .returning()
      return task
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        status: z.enum(taskStatusValues).optional(),
        priority: z.enum(taskPriorityValues).optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        dueAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const setClause: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.title !== undefined) setClause.title = updates.title
      if (updates.description !== undefined) setClause.description = updates.description
      if (updates.status !== undefined) setClause.status = updates.status
      if (updates.priority !== undefined) setClause.priority = updates.priority
      if (updates.assigneeId !== undefined) setClause.assigneeId = updates.assigneeId
      if (updates.dueAt !== undefined) setClause.dueAt = updates.dueAt

      const [task] = await ctx.db
        .update(tasks)
        .set(setClause)
        .where(eq(tasks.id, id))
        .returning()
      if (!task) {
        throw new Error('Task not found')
      }
      return task
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .delete(tasks)
        .where(eq(tasks.id, input.id))
        .returning()
      if (!task) {
        throw new Error('Task not found')
      }
      return task
    }),
})
