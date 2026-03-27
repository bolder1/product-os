import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { approvals, approvalDecisions } from '@product-os/db'
import { router, protectedProcedure } from '../trpc.js'

const approvalStatusValues = ['pending', 'approved', 'rejected', 'changes_requested'] as const

export const approvalRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(approvals)
        .where(eq(approvals.productId, input.productId))
    }),

  create: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        nodeId: z.string().uuid(),
        routing: z
          .object({
            approvers: z.array(z.string().uuid()),
            mode: z.enum(['sequential', 'parallel']),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [approval] = await ctx.db
        .insert(approvals)
        .values({
          productId: input.productId,
          nodeId: input.nodeId,
          requestedBy: ctx.session.userId,
          routing: input.routing,
        })
        .returning()
      return approval
    }),

  decide: protectedProcedure
    .input(
      z.object({
        approvalId: z.string().uuid(),
        decision: z.enum(['approved', 'rejected', 'changes_requested']),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Record the individual decision
      const [decisionRow] = await ctx.db
        .insert(approvalDecisions)
        .values({
          approvalId: input.approvalId,
          approverId: ctx.session.userId,
          decision: input.decision,
          comment: input.comment,
        })
        .returning()

      // Update the parent approval status and decidedAt timestamp
      await ctx.db
        .update(approvals)
        .set({
          status: input.decision,
          decidedAt: new Date(),
        })
        .where(eq(approvals.id, input.approvalId))

      return decisionRow
    }),
})
