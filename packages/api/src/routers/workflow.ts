import { z } from 'zod'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { graphNodes, graphEdges } from '@product-os/db'
import { router, protectedProcedure } from '../trpc'

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                        */
/* ------------------------------------------------------------------ */

const fieldDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'boolean', 'date', 'email', 'url', 'enum', 'relation', 'json', 'rich-text', 'file', 'computed']),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      regex: z.string().optional(),
      unique: z.boolean().optional(),
      customMessage: z.string().optional(),
    })
    .optional(),
  computed: z
    .object({
      formula: z.string(),
      dependencies: z.array(z.string()),
    })
    .optional(),
  conditional: z
    .object({
      showIf: z.string().optional(),
      enableIf: z.string().optional(),
    })
    .optional(),
})

const relationDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetEntityId: z.string(),
  cardinality: z.enum(['has_one', 'has_many', 'belongs_to', 'many_to_many']),
})

const entityDataSchema = z.object({
  description: z.string().default(''),
  fields: z.array(fieldDefSchema).default([]),
  relations: z.array(relationDefSchema).default([]),
})

/* State machine schemas */
const guardSchema = z.object({
  id: z.string(),
  type: z.enum(['field_check', 'role_check', 'custom_expression']),
  field: z.string().optional(),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'is_set', 'is_empty']).optional(),
  value: z.unknown().optional(),
  role: z.string().optional(),
  expression: z.string().optional(),
  errorMessage: z.string().optional(),
})

const actionSchema = z.object({
  id: z.string(),
  type: z.enum(['set_field', 'create_task', 'send_notification', 'request_approval', 'call_webhook', 'run_ai_skill']),
  config: z.record(z.string(), z.unknown()),
})

const stateDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().default('#3B82F6'),
  type: z.enum(['initial', 'normal', 'final']).default('normal'),
  entryActions: z.array(actionSchema).default([]),
  exitActions: z.array(actionSchema).default([]),
})

const transitionDefSchema = z.object({
  id: z.string(),
  fromStateId: z.string(),
  toStateId: z.string(),
  trigger: z.string(),
  guards: z.array(guardSchema).default([]),
  actions: z.array(actionSchema).default([]),
  allowedRoles: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(),
  approvalConfig: z
    .object({
      approverRoles: z.array(z.string()),
      minApprovals: z.number().default(1),
    })
    .optional(),
})

const workflowDataSchema = z.object({
  entityId: z.string().optional(),
  description: z.string().default(''),
  states: z.array(stateDefSchema).default([]),
  transitions: z.array(transitionDefSchema).default([]),
})

/* Automation schemas */
const triggerSchema = z.object({
  type: z.enum(['entity_created', 'entity_updated', 'entity_deleted', 'state_changed', 'schedule', 'webhook', 'manual']),
  entityKind: z.string().optional(),
  fromState: z.string().optional(),
  toState: z.string().optional(),
  cron: z.string().optional(),
  webhookPath: z.string().optional(),
})

const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'contains', 'is_set', 'is_empty']),
  value: z.unknown(),
})

const automationDataSchema = z.object({
  description: z.string().default(''),
  enabled: z.boolean().default(true),
  trigger: triggerSchema,
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).default([]),
})

/* Form schemas */
const formFieldSchema = z.object({
  id: z.string(),
  entityFieldId: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  order: z.number().default(0),
  width: z.enum(['full', 'half', 'third']).default('full'),
  showIf: z.string().optional(),
  enableIf: z.string().optional(),
  group: z.string().optional(),
})

const formDataSchema = z.object({
  entityId: z.string(),
  description: z.string().default(''),
  fields: z.array(formFieldSchema).default([]),
  steps: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        fieldIds: z.array(z.string()),
      }),
    )
    .default([]),
  submitAction: z.enum(['create', 'update', 'transition']).default('create'),
  transitionTrigger: z.string().optional(),
  successMessage: z.string().optional(),
  redirectSlug: z.string().optional(),
})

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
export const workflowRouter = router({
  /* ================================================================ */
  /*  ENTITIES                                                         */
  /* ================================================================ */

  listEntities: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, input.productId), eq(graphNodes.kind, 'entity'), isNull(graphNodes.deletedAt)))
        .orderBy(desc(graphNodes.updatedAt))
    }),

  getEntity: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'entity'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Entity not found')
      return node
    }),

  createEntity: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: entityDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        ...input.data,
        fields: JSON.stringify(input.data.fields),
        relations: JSON.stringify(input.data.relations),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'entity',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus
        .emit('workflow.entity.created', {
          productId: input.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: node!.id, productId: input.productId, label: input.name, userId: ctx.session.userId },
        })
        .catch(() => {})

      return node!
    }),

  updateEntity: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: entityDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'entity'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Entity not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.description !== undefined) merged.description = input.data.description
      if (input.data.fields !== undefined) merged.fields = JSON.stringify(input.data.fields)
      if (input.data.relations !== undefined) merged.relations = JSON.stringify(input.data.relations)

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: merged,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus
        .emit('workflow.entity.updated', {
          productId: updated!.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: updated!.id, productId: updated!.productId, label: updated!.label, userId: ctx.session.userId },
        })
        .catch(() => {})

      return updated!
    }),

  deleteEntity: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'entity')))
        .returning()
      if (!deleted) throw new Error('Entity not found')

      ctx.eventBus
        .emit('workflow.entity.deleted', {
          productId: deleted.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: input.id, productId: deleted.productId, userId: ctx.session.userId },
        })
        .catch(() => {})

      return { deleted: true }
    }),

  /* ================================================================ */
  /*  WORKFLOWS (STATE MACHINES)                                       */
  /* ================================================================ */

  listWorkflows: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, input.productId), eq(graphNodes.kind, 'workflow'), isNull(graphNodes.deletedAt)))
        .orderBy(desc(graphNodes.updatedAt))
    }),

  getWorkflow: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'workflow'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Workflow not found')
      return node
    }),

  createWorkflow: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: workflowDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        ...input.data,
        states: JSON.stringify(input.data.states),
        transitions: JSON.stringify(input.data.transitions),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'workflow',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      // Link workflow → entity via edge
      if (input.data.entityId) {
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId: node!.id,
          targetId: input.data.entityId,
          kind: 'references',
        })
      }

      ctx.eventBus
        .emit('workflow.created', {
          productId: input.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: node!.id, productId: input.productId, label: input.name, stateCount: input.data.states.length, userId: ctx.session.userId },
        })
        .catch(() => {})

      return node!
    }),

  updateWorkflow: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: workflowDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'workflow'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Workflow not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.entityId !== undefined) merged.entityId = input.data.entityId
      if (input.data.description !== undefined) merged.description = input.data.description
      if (input.data.states !== undefined) merged.states = JSON.stringify(input.data.states)
      if (input.data.transitions !== undefined) merged.transitions = JSON.stringify(input.data.transitions)

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: merged,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      ctx.eventBus
        .emit('workflow.updated', {
          productId: updated!.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: updated!.id, productId: updated!.productId, label: updated!.label, userId: ctx.session.userId },
        })
        .catch(() => {})

      return updated!
    }),

  deleteWorkflow: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'workflow')))
        .returning()
      if (!deleted) throw new Error('Workflow not found')

      ctx.eventBus
        .emit('workflow.deleted', {
          productId: deleted.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: input.id, productId: deleted.productId, userId: ctx.session.userId },
        })
        .catch(() => {})

      return { deleted: true }
    }),

  /* ---------- Validate workflow ------------------------------------- */
  validate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [node] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'workflow'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!node) throw new Error('Workflow not found')

      const data = node.data as Record<string, unknown>
      const states = (() => {
        try { return JSON.parse(String(data.states || '[]')) }
        catch { return [] }
      })() as Array<{ id: string; name: string; type: string }>
      const transitions = (() => {
        try { return JSON.parse(String(data.transitions || '[]')) }
        catch { return [] }
      })() as Array<{ fromStateId: string; toStateId: string; trigger: string }>

      const issues: Array<{ severity: 'error' | 'warning'; message: string }> = []

      // Check for initial state
      const initials = states.filter((s) => s.type === 'initial')
      if (initials.length === 0) issues.push({ severity: 'error', message: 'No initial state defined' })
      if (initials.length > 1) issues.push({ severity: 'warning', message: 'Multiple initial states' })

      // Check for final state
      const finals = states.filter((s) => s.type === 'final')
      if (finals.length === 0) issues.push({ severity: 'warning', message: 'No final state defined' })

      // Check for orphan states (no incoming or outgoing transitions except initial)
      const stateIds = new Set(states.map((s) => s.id))
      for (const s of states) {
        if (s.type === 'initial') continue
        const hasIncoming = transitions.some((t) => t.toStateId === s.id)
        if (!hasIncoming) issues.push({ severity: 'warning', message: `State "${s.name}" has no incoming transitions` })
      }
      for (const s of states) {
        if (s.type === 'final') continue
        const hasOutgoing = transitions.some((t) => t.fromStateId === s.id)
        if (!hasOutgoing) issues.push({ severity: 'warning', message: `State "${s.name}" has no outgoing transitions` })
      }

      // Check for invalid refs
      for (const t of transitions) {
        if (!stateIds.has(t.fromStateId)) issues.push({ severity: 'error', message: `Transition references missing source state` })
        if (!stateIds.has(t.toStateId)) issues.push({ severity: 'error', message: `Transition references missing target state` })
      }

      // Dead state detection (unreachable from initial)
      if (initials.length > 0) {
        const reachable = new Set<string>()
        const queue = initials.map((s) => s.id)
        while (queue.length > 0) {
          const current = queue.pop()!
          if (reachable.has(current)) continue
          reachable.add(current)
          for (const t of transitions) {
            if (t.fromStateId === current && !reachable.has(t.toStateId)) {
              queue.push(t.toStateId)
            }
          }
        }
        for (const s of states) {
          if (!reachable.has(s.id)) {
            issues.push({ severity: 'warning', message: `State "${s.name}" is unreachable from initial state` })
          }
        }
      }

      const score = Math.max(0, 100 - issues.filter((i) => i.severity === 'error').length * 25 - issues.filter((i) => i.severity === 'warning').length * 10)

      return { score, issues, stateCount: states.length, transitionCount: transitions.length }
    }),

  /* ================================================================ */
  /*  AUTOMATIONS                                                      */
  /* ================================================================ */

  listAutomations: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Automations stored as graph nodes with kind 'skill_action' and a data.automationType marker
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, input.productId), eq(graphNodes.kind, 'skill_action'), isNull(graphNodes.deletedAt)))
        .orderBy(desc(graphNodes.updatedAt))

      return rows.filter((r) => (r.data as Record<string, unknown>)?.automationType === 'workflow_automation')
    }),

  createAutomation: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: automationDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        automationType: 'workflow_automation',
        ...input.data,
        conditions: JSON.stringify(input.data.conditions),
        actions: JSON.stringify(input.data.actions),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'skill_action',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      ctx.eventBus
        .emit('workflow.automation.created', {
          productId: input.productId,
          actorId: ctx.session.userId,
          payload: { nodeId: node!.id, label: input.name, triggerType: input.data.trigger.type, userId: ctx.session.userId },
        })
        .catch(() => {})

      return node!
    }),

  updateAutomation: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: automationDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'skill_action'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Automation not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.description !== undefined) merged.description = input.data.description
      if (input.data.enabled !== undefined) merged.enabled = input.data.enabled
      if (input.data.trigger !== undefined) merged.trigger = input.data.trigger
      if (input.data.conditions !== undefined) merged.conditions = JSON.stringify(input.data.conditions)
      if (input.data.actions !== undefined) merged.actions = JSON.stringify(input.data.actions)

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: merged,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      return updated!
    }),

  deleteAutomation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'skill_action')))
        .returning()
      if (!deleted) throw new Error('Automation not found')
      return { deleted: true }
    }),

  /* ================================================================ */
  /*  FORMS                                                            */
  /* ================================================================ */

  listForms: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.productId, input.productId), eq(graphNodes.kind, 'field'), isNull(graphNodes.deletedAt)))
        .orderBy(desc(graphNodes.updatedAt))

      return rows.filter((r) => (r.data as Record<string, unknown>)?.formType === 'workflow_form')
    }),

  createForm: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        data: formDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const serialized = {
        formType: 'workflow_form',
        ...input.data,
        fields: JSON.stringify(input.data.fields),
        steps: JSON.stringify(input.data.steps),
      }

      const [node] = await ctx.db
        .insert(graphNodes)
        .values({
          productId: input.productId,
          kind: 'field',
          label: input.name,
          data: serialized as Record<string, unknown>,
          createdBy: ctx.session.userId,
          version: 1,
        })
        .returning()

      // Link form → entity
      if (input.data.entityId) {
        await ctx.db.insert(graphEdges).values({
          productId: input.productId,
          sourceId: node!.id,
          targetId: input.data.entityId,
          kind: 'references',
        })
      }

      return node!
    }),

  updateForm: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        data: formDataSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [current] = await ctx.db
        .select()
        .from(graphNodes)
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'field'), isNull(graphNodes.deletedAt)))
        .limit(1)
      if (!current) throw new Error('Form not found')

      const currentData = current.data as Record<string, unknown>
      const merged: Record<string, unknown> = { ...currentData }

      if (input.data.entityId !== undefined) merged.entityId = input.data.entityId
      if (input.data.description !== undefined) merged.description = input.data.description
      if (input.data.fields !== undefined) merged.fields = JSON.stringify(input.data.fields)
      if (input.data.steps !== undefined) merged.steps = JSON.stringify(input.data.steps)
      if (input.data.submitAction !== undefined) merged.submitAction = input.data.submitAction
      if (input.data.transitionTrigger !== undefined) merged.transitionTrigger = input.data.transitionTrigger
      if (input.data.successMessage !== undefined) merged.successMessage = input.data.successMessage
      if (input.data.redirectSlug !== undefined) merged.redirectSlug = input.data.redirectSlug

      const [updated] = await ctx.db
        .update(graphNodes)
        .set({
          label: input.name ?? current.label,
          data: merged,
          version: (current.version ?? 1) + 1,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, input.id))
        .returning()

      return updated!
    }),

  deleteForm: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .update(graphNodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(graphNodes.id, input.id), eq(graphNodes.kind, 'field')))
        .returning()
      if (!deleted) throw new Error('Form not found')
      return { deleted: true }
    }),
})
