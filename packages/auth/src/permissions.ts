import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas & Types
// ---------------------------------------------------------------------------

export const RoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer', 'guest'])
export type Role = z.infer<typeof RoleSchema>

export const ScopeSchema = z.enum(['workspace', 'product', 'studio', 'object'])
export type Scope = z.infer<typeof ScopeSchema>

export const ActionSchema = z.enum([
  'view',
  'comment',
  'edit',
  'create',
  'delete',
  'approve',
  'publish',
  'branch',
  'merge',
  'manage_templates',
  'manage_tokens',
  'manage_permissions',
])
export type Action = z.infer<typeof ActionSchema>

export interface Permission {
  role: Role
  action: Action
  scope: Scope
}

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------

/**
 * Maps each role to the set of actions it may perform within each scope.
 *
 * Design rationale:
 *  - owner  : full control everywhere
 *  - admin  : everything except the most destructive workspace-level ops
 *  - editor : day-to-day content work (create, edit, branch, merge, comment)
 *  - viewer : read-only with commenting
 *  - guest  : read-only, workspace + product scopes only
 */
const permissionMatrix: Record<Role, Record<Scope, ReadonlySet<Action>>> = {
  owner: {
    workspace: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates', 'manage_tokens', 'manage_permissions',
    ]),
    product: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates', 'manage_tokens', 'manage_permissions',
    ]),
    studio: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates', 'manage_tokens', 'manage_permissions',
    ]),
    object: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates', 'manage_tokens', 'manage_permissions',
    ]),
  },

  admin: {
    workspace: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates', 'manage_tokens', 'manage_permissions',
    ]),
    product: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates',
    ]),
    studio: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
      'manage_templates',
    ]),
    object: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete',
      'approve', 'publish', 'branch', 'merge',
    ]),
  },

  editor: {
    workspace: new Set<Action>(['view', 'comment']),
    product: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'branch', 'merge',
    ]),
    studio: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'branch', 'merge',
    ]),
    object: new Set<Action>([
      'view', 'comment', 'edit', 'create', 'delete', 'branch', 'merge',
    ]),
  },

  viewer: {
    workspace: new Set<Action>(['view']),
    product: new Set<Action>(['view', 'comment']),
    studio: new Set<Action>(['view', 'comment']),
    object: new Set<Action>(['view', 'comment']),
  },

  guest: {
    workspace: new Set<Action>(['view']),
    product: new Set<Action>(['view']),
    studio: new Set<Action>([]),
    object: new Set<Action>([]),
  },
}

// ---------------------------------------------------------------------------
// Studio access control
// ---------------------------------------------------------------------------

/**
 * Studios that each role is permitted to open.
 * `'*'` means access to every studio.
 */
const studioAccess: Record<Role, '*' | ReadonlySet<string>> = {
  owner: '*',
  admin: '*',
  editor: new Set(['content', 'schema', 'flow', 'api', 'data']),
  viewer: new Set(['content', 'data']),
  guest: new Set(),
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the given `role` is allowed to perform `action` within
 * `scope`.  All three parameters are validated at runtime via Zod so callers
 * can safely pass untrusted input.
 *
 * @throws {z.ZodError} if any argument fails validation
 */
export function checkPermission(role: Role, action: Action, scope: Scope): boolean {
  const validatedRole = RoleSchema.parse(role)
  const validatedAction = ActionSchema.parse(action)
  const validatedScope = ScopeSchema.parse(scope)

  return permissionMatrix[validatedRole][validatedScope].has(validatedAction)
}

/**
 * Returns `true` when `role` is allowed to access the studio identified by
 * `studioName`.  Studio names are compared case-insensitively.
 *
 * @throws {z.ZodError} if `role` fails validation
 */
export function hasStudioAccess(role: Role, studioName: string): boolean {
  const validatedRole = RoleSchema.parse(role)

  const access = studioAccess[validatedRole]
  if (access === '*') return true

  return access.has(studioName.toLowerCase())
}

/**
 * Lists every action a role may perform within a given scope.
 */
export function getAllowedActions(role: Role, scope: Scope): Action[] {
  const validatedRole = RoleSchema.parse(role)
  const validatedScope = ScopeSchema.parse(scope)

  return [...permissionMatrix[validatedRole][validatedScope]]
}
