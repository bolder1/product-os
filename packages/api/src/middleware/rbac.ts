import { TRPCError } from '@trpc/server'
import { checkPermission, hasStudioAccess, type Action, type Role, type Scope } from '@product-os/auth'
import { middleware, protectedProcedure } from '../trpc'

/**
 * Builds a tRPC middleware that enforces a permission check on the
 * authenticated session's role for a given (action, scope).
 *
 * Usage:
 *   const editorOnly = requirePermission('edit', 'product')
 *   editorOnly.mutation(...)
 */
export function requirePermission(action: Action, scope: Scope) {
  return protectedProcedure.use(
    middleware(({ ctx, next }) => {
      const role = ctx.session?.role as Role | undefined
      if (!role) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No role on session' })
      }
      if (!checkPermission(role, action, scope)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Role '${role}' is not allowed to '${action}' on scope '${scope}'`,
        })
      }
      return next({ ctx })
    }),
  )
}

/**
 * Builds a tRPC middleware that requires the session role to have access
 * to a particular studio. The studio name is taken from `input.studio`.
 */
export function requireStudio(studio: string) {
  return protectedProcedure.use(
    middleware(({ ctx, next }) => {
      const role = ctx.session?.role as Role | undefined
      if (!role) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No role on session' })
      }
      if (!hasStudioAccess(role, studio)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Role '${role}' has no access to studio '${studio}'`,
        })
      }
      return next({ ctx })
    }),
  )
}

/**
 * Convenience procedures for the most common gates.
 */
export const editorProcedure = requirePermission('edit', 'product')
export const adminProcedure = requirePermission('manage_permissions', 'product')
export const publishProcedure = requirePermission('publish', 'product')

/**
 * Pure helper — returns whether a role can perform an action.
 * Useful inside resolvers when you want to branch logic instead of throwing.
 */
export function can(role: Role | undefined | null, action: Action, scope: Scope = 'product'): boolean {
  if (!role) return false
  try {
    return checkPermission(role, action, scope)
  } catch {
    return false
  }
}
