import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { memberships, users } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'
import { adminProcedure } from '../middleware/rbac'

const RoleEnum = z.enum(['owner', 'admin', 'editor', 'viewer', 'guest'])

export const memberRouter = router({
  /**
   * List all members in the current org along with their user profile.
   */
  list: protectedProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }).default({}))
    .query(async ({ ctx, input }) => {
      const orgId = input.orgId ?? ctx.session.orgId
      const rows = await ctx.db
        .select({
          id: memberships.id,
          userId: memberships.userId,
          orgId: memberships.orgId,
          role: memberships.role,
          invitedAt: memberships.invitedAt,
          acceptedAt: memberships.acceptedAt,
          createdAt: memberships.createdAt,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.orgId, orgId))
      return rows
    }),

  /**
   * Invite a new member by email. If the user already exists, attach the
   * membership directly. Otherwise, create a placeholder user row.
   * Requires admin permission.
   */
  invite: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: RoleEnum.default('viewer'),
        orgId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = input.orgId ?? ctx.session.orgId

      // Look up or create a user
      const existing = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      let userId: string
      if (existing.length > 0) {
        userId = existing[0]!.id
      } else {
        const [created] = await ctx.db
          .insert(users)
          .values({
            email: input.email,
            name: input.email.split('@')[0] ?? input.email,
          })
          .returning()
        userId = created!.id
      }

      // Avoid duplicates
      const dup = await ctx.db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)))
        .limit(1)
      if (dup.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Already a member' })
      }

      const [membership] = await ctx.db
        .insert(memberships)
        .values({
          userId,
          orgId,
          role: input.role,
          invitedAt: new Date(),
        })
        .returning()

      ctx.eventBus
        .emit('member.invited', {
          productId: orgId,
          actorId: ctx.session.userId,
          payload: { membershipId: membership!.id, email: input.email, role: input.role },
        })
        .catch(() => {})

      return membership
    }),

  /**
   * Update a member's role. Requires admin permission.
   * Owners cannot be demoted by non-owners.
   */
  updateRole: adminProcedure
    .input(
      z.object({
        membershipId: z.string().uuid(),
        role: RoleEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(memberships)
        .where(eq(memberships.id, input.membershipId))
        .limit(1)
      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' })
      }
      if (target.role === 'owner' && ctx.session.role !== 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can change owner roles' })
      }

      const [updated] = await ctx.db
        .update(memberships)
        .set({ role: input.role })
        .where(eq(memberships.id, input.membershipId))
        .returning()

      ctx.eventBus
        .emit('member.role_changed', {
          productId: target.orgId,
          actorId: ctx.session.userId,
          payload: { membershipId: input.membershipId, role: input.role },
        })
        .catch(() => {})

      return updated
    }),

  /**
   * Remove a member from the org. Requires admin permission.
   */
  remove: adminProcedure
    .input(z.object({ membershipId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(memberships)
        .where(eq(memberships.id, input.membershipId))
        .limit(1)
      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' })
      }
      if (target.role === 'owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove org owner' })
      }

      await ctx.db.delete(memberships).where(eq(memberships.id, input.membershipId))

      ctx.eventBus
        .emit('member.removed', {
          productId: target.orgId,
          actorId: ctx.session.userId,
          payload: { membershipId: input.membershipId, userId: target.userId },
        })
        .catch(() => {})

      return { success: true }
    }),
})
