import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'
import { users, sessions, memberships, organizations } from '@product-os/db'
import crypto from 'crypto'

export const authRouter = router({
  /**
   * Login with email + password.
   * For dev mode, any password works for seeded users.
   * Returns session token + user info.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No account found with this email',
        })
      }

      // In dev mode, accept any password for seeded users
      // TODO: Implement proper password hashing with Better-Auth in production

      // Create a session token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const [session] = await ctx.db
        .insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt,
        })
        .returning()

      // Get user's org membership
      const [membership] = await ctx.db
        .select({
          orgId: memberships.orgId,
          role: memberships.role,
          orgName: organizations.name,
          orgSlug: organizations.slug,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.orgId, organizations.id))
        .where(eq(memberships.userId, user.id))
        .limit(1)

      return {
        token: session.token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        org: membership
          ? {
              id: membership.orgId,
              name: membership.orgName,
              slug: membership.orgSlug,
              role: membership.role,
            }
          : null,
      }
    }),

  /**
   * Signup with name, email, password.
   * Creates user + session. Does NOT create org (that's a separate step).
   */
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email is already taken
      const [existing] = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists',
        })
      }

      // Create user
      // TODO: Hash password with Better-Auth in production
      const [user] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          emailVerified: false,
        })
        .returning()

      // Create session
      const token = crypto.randomUUID()
      const [session] = await ctx.db
        .insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning()

      return {
        token: session.token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        org: null,
      }
    }),

  /**
   * Get the current session's user and org info.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.userId))
      .limit(1)

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
    }

    const [membership] = await ctx.db
      .select({
        orgId: memberships.orgId,
        role: memberships.role,
        orgName: organizations.name,
        orgSlug: organizations.slug,
      })
      .from(memberships)
      .innerJoin(organizations, eq(memberships.orgId, organizations.id))
      .where(
        and(
          eq(memberships.userId, user.id),
          eq(memberships.orgId, ctx.session.orgId),
        ),
      )
      .limit(1)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      org: membership
        ? {
            id: membership.orgId,
            name: membership.orgName,
            slug: membership.orgSlug,
            role: membership.role,
          }
        : null,
    }
  }),

  /**
   * Logout — delete the current session.
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(sessions)
      .where(eq(sessions.userId, ctx.session.userId))
    return { success: true }
  }),
})
