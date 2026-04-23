import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { eq, and } from 'drizzle-orm'
import { users, sessions, memberships, organizations } from '@product-os/db'
import crypto from 'crypto'
import { hashPassword, verifyPassword } from '../utils/password'

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

      // Verify password when hash is present; fall through for legacy seed users without a hash
      if (user.passwordHash) {
        const valid = verifyPassword(input.password, user.passwordHash)
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password' })
        }
      }

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

      const passwordHash = hashPassword(input.password)

      const [user] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          passwordHash,
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
   * Create an organization for the current user.
   * Called after signup/onboarding to provision a real org in the DB.
   * If the user already belongs to an org, returns that org instead.
   */
  createOrg: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(1).max(200),
        slug: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Resolve the session from the provided token
      const [sessionRow] = await ctx.db
        .select({ userId: sessions.userId })
        .from(sessions)
        .where(eq(sessions.token, input.token))
        .limit(1)

      if (!sessionRow) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session token' })
      }

      // Check if user already has an org (idempotency)
      const [existingMembership] = await ctx.db
        .select({
          orgId: memberships.orgId,
          orgName: organizations.name,
          orgSlug: organizations.slug,
          role: memberships.role,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.orgId, organizations.id))
        .where(eq(memberships.userId, sessionRow.userId))
        .limit(1)

      if (existingMembership) {
        return {
          id: existingMembership.orgId,
          name: existingMembership.orgName,
          slug: existingMembership.orgSlug,
          role: existingMembership.role,
        }
      }

      // Create the org
      const [org] = await ctx.db
        .insert(organizations)
        .values({ name: input.name, slug: input.slug })
        .returning()

      // Create owner membership
      await ctx.db
        .insert(memberships)
        .values({ userId: sessionRow.userId, orgId: org.id, role: 'owner' })

      return { id: org.id, name: org.name, slug: org.slug, role: 'owner' }
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
