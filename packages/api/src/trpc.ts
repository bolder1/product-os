import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { db } from '@product-os/db'
import type { Database } from '@product-os/db'

export interface Session {
  userId: string
  orgId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest'
}

export interface TRPCContext {
  db: Database
  session: Session | null
}

/**
 * Creates the tRPC context from an incoming request.
 * Resolves the user session, organization, and permissions from headers.
 */
export async function createTRPCContext(opts: {
  headers: Headers
}): Promise<TRPCContext> {
  const token = opts.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { db, session: null }
  }

  // Resolve session from the token via the sessions table
  const { sessions, users, memberships } = await import('@product-os/db')
  const { eq, and, gt } = await import('drizzle-orm')

  const [sessionRow] = await db
    .select({
      userId: sessions.userId,
      token: sessions.token,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!sessionRow) {
    return { db, session: null }
  }

  // Resolve org from x-org-id header
  const orgId = opts.headers.get('x-org-id')
  if (!orgId) {
    return { db, session: null }
  }

  // Look up the user's membership in the org
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, sessionRow.userId), eq(memberships.orgId, orgId)))
    .limit(1)

  const role = membership?.role ?? 'viewer'

  return {
    db,
    session: {
      userId: sessionRow.userId,
      orgId,
      role,
    },
  }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const middleware = t.middleware

/**
 * Public procedure — no auth required.
 */
export const publicProcedure = t.procedure

/**
 * Middleware that enforces authentication.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

/**
 * Protected procedure — requires an authenticated session.
 */
export const protectedProcedure = t.procedure.use(enforceAuth)
