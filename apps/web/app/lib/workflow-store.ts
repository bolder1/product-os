'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'enum' | 'relation' | 'json' | 'rich-text' | 'file' | 'computed'
export type Cardinality = 'has_one' | 'has_many' | 'belongs_to' | 'many_to_many'

export interface FieldValidation {
  min?: number
  max?: number
  regex?: string
  unique?: boolean
  customMessage?: string
}

export interface FieldConditional {
  showIf?: string
  enableIf?: string
}

export interface FieldDef {
  id: string
  name: string
  type: FieldType
  required: boolean
  defaultValue?: string
  enumValues?: string[]
  validation?: FieldValidation
  computed?: { formula: string; dependencies: string[] }
  conditional?: FieldConditional
}

export interface RelationDef {
  id: string
  name: string
  targetEntityId: string
  cardinality: Cardinality
}

export interface EntityDef {
  id: string
  label: string
  description: string
  fields: FieldDef[]
  relations: RelationDef[]
  productId?: string
  version?: number
}

/* State machine types */
export interface Guard {
  id: string
  type: 'field_check' | 'role_check' | 'custom_expression'
  field?: string
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'is_set' | 'is_empty'
  value?: unknown
  role?: string
  expression?: string
  errorMessage?: string
}

export interface Action {
  id: string
  type: 'set_field' | 'create_task' | 'send_notification' | 'request_approval' | 'call_webhook' | 'run_ai_skill'
  config: Record<string, unknown>
}

export interface StateDef {
  id: string
  name: string
  color: string
  type: 'initial' | 'normal' | 'final'
  entryActions: Action[]
  exitActions: Action[]
}

export interface TransitionDef {
  id: string
  fromStateId: string
  toStateId: string
  trigger: string
  guards: Guard[]
  actions: Action[]
  allowedRoles?: string[]
  requiresApproval?: boolean
  approvalConfig?: { approverRoles: string[]; minApprovals: number }
}

export interface WorkflowDef {
  id: string
  label: string
  entityId?: string
  description: string
  states: StateDef[]
  transitions: TransitionDef[]
  productId?: string
  version?: number
}

/* Automation types */
export interface AutomationTrigger {
  type: 'entity_created' | 'entity_updated' | 'entity_deleted' | 'state_changed' | 'schedule' | 'webhook' | 'manual'
  entityKind?: string
  fromState?: string
  toState?: string
  cron?: string
  webhookPath?: string
}

export interface AutomationCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'contains' | 'is_set' | 'is_empty'
  value: unknown
}

export interface AutomationDef {
  id: string
  label: string
  description: string
  enabled: boolean
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: Action[]
  productId?: string
}

/* Form types */
export interface FormFieldDef {
  id: string
  entityFieldId: string
  label: string
  placeholder?: string
  helpText?: string
  order: number
  width: 'full' | 'half' | 'third'
  showIf?: string
  enableIf?: string
  group?: string
}

export interface FormStep {
  id: string
  title: string
  fieldIds: string[]
}

export interface FormDef {
  id: string
  label: string
  entityId: string
  description: string
  fields: FormFieldDef[]
  steps: FormStep[]
  submitAction: 'create' | 'update' | 'transition'
  transitionTrigger?: string
  successMessage?: string
  redirectSlug?: string
  productId?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let trpcMutate: ((path: string, input: unknown) => Promise<unknown>) | null = null
try { trpcMutate = require('./api').trpcMutate } catch { trpcMutate = null }

let trpcQuery: ((path: string, input: unknown) => Promise<unknown>) | null = null
try { trpcQuery = require('./api').trpcQuery } catch { trpcQuery = null }

function parseEntity(raw: Record<string, unknown>): EntityDef {
  const data = (raw.data ?? {}) as Record<string, unknown>
  let fields: FieldDef[] = []
  try { fields = typeof data.fields === 'string' ? JSON.parse(data.fields) : (data.fields as FieldDef[]) ?? [] } catch { /* empty */ }
  let relations: RelationDef[] = []
  try { relations = typeof data.relations === 'string' ? JSON.parse(data.relations) : (data.relations as RelationDef[]) ?? [] } catch { /* empty */ }

  return {
    id: raw.id as string,
    label: (raw.label as string) ?? '',
    description: (data.description as string) ?? '',
    fields,
    relations,
    productId: raw.productId as string,
    version: (raw.version as number) ?? 1,
  }
}

function parseWorkflow(raw: Record<string, unknown>): WorkflowDef {
  const data = (raw.data ?? {}) as Record<string, unknown>
  let states: StateDef[] = []
  try { states = typeof data.states === 'string' ? JSON.parse(data.states) : (data.states as StateDef[]) ?? [] } catch { /* empty */ }
  let transitions: TransitionDef[] = []
  try { transitions = typeof data.transitions === 'string' ? JSON.parse(data.transitions) : (data.transitions as TransitionDef[]) ?? [] } catch { /* empty */ }

  // Ensure states have entryActions/exitActions arrays
  states = states.map((s) => ({ ...s, entryActions: s.entryActions ?? [], exitActions: s.exitActions ?? [] }))
  // Ensure transitions have guards/actions arrays
  transitions = transitions.map((t) => ({ ...t, guards: t.guards ?? [], actions: t.actions ?? [] }))

  return {
    id: raw.id as string,
    label: (raw.label as string) ?? '',
    entityId: (data.entityId as string) ?? undefined,
    description: (data.description as string) ?? '',
    states,
    transitions,
    productId: raw.productId as string,
    version: (raw.version as number) ?? 1,
  }
}

function parseAutomation(raw: Record<string, unknown>): AutomationDef {
  const data = (raw.data ?? {}) as Record<string, unknown>
  let conditions: AutomationCondition[] = []
  try { conditions = typeof data.conditions === 'string' ? JSON.parse(data.conditions) : (data.conditions as AutomationCondition[]) ?? [] } catch { /* empty */ }
  let actions: Action[] = []
  try { actions = typeof data.actions === 'string' ? JSON.parse(data.actions) : (data.actions as Action[]) ?? [] } catch { /* empty */ }

  return {
    id: raw.id as string,
    label: (raw.label as string) ?? '',
    description: (data.description as string) ?? '',
    enabled: (data.enabled as boolean) ?? true,
    trigger: (data.trigger as AutomationTrigger) ?? { type: 'manual' },
    conditions,
    actions,
    productId: raw.productId as string,
  }
}

function parseForm(raw: Record<string, unknown>): FormDef {
  const data = (raw.data ?? {}) as Record<string, unknown>
  let fields: FormFieldDef[] = []
  try { fields = typeof data.fields === 'string' ? JSON.parse(data.fields) : (data.fields as FormFieldDef[]) ?? [] } catch { /* empty */ }
  let steps: FormStep[] = []
  try { steps = typeof data.steps === 'string' ? JSON.parse(data.steps) : (data.steps as FormStep[]) ?? [] } catch { /* empty */ }

  return {
    id: raw.id as string,
    label: (raw.label as string) ?? '',
    entityId: (data.entityId as string) ?? '',
    description: (data.description as string) ?? '',
    fields,
    steps,
    submitAction: (data.submitAction as FormDef['submitAction']) ?? 'create',
    transitionTrigger: data.transitionTrigger as string | undefined,
    successMessage: data.successMessage as string | undefined,
    redirectSlug: data.redirectSlug as string | undefined,
    productId: raw.productId as string,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface WorkflowState {
  entities: EntityDef[]
  workflows: WorkflowDef[]
  automations: AutomationDef[]
  forms: FormDef[]

  selectedEntityId: string | null
  selectedWorkflowId: string | null
  selectedAutomationId: string | null
  selectedFormId: string | null
  activeTab: 'entities' | 'workflows' | 'automations' | 'forms'

  loading: boolean

  // Hydrate
  hydrate: (productId: string) => Promise<void>

  // Entities
  selectEntity: (id: string | null) => void
  createEntity: (productId: string, name: string, data?: Partial<EntityDef>) => Promise<EntityDef | null>
  updateEntity: (id: string, data: Partial<EntityDef>) => Promise<void>
  removeEntity: (id: string) => Promise<void>
  addField: (entityId: string, field: FieldDef) => void
  updateField: (entityId: string, fieldId: string, updates: Partial<FieldDef>) => void
  removeField: (entityId: string, fieldId: string) => void
  addRelation: (entityId: string, relation: RelationDef) => void
  removeRelation: (entityId: string, relationId: string) => void

  // Workflows
  selectWorkflow: (id: string | null) => void
  createWorkflow: (productId: string, name: string, data?: Partial<WorkflowDef>) => Promise<WorkflowDef | null>
  updateWorkflow: (id: string, data: Partial<WorkflowDef>) => Promise<void>
  removeWorkflow: (id: string) => Promise<void>
  addState: (workflowId: string, state: StateDef) => void
  updateState: (workflowId: string, stateId: string, updates: Partial<StateDef>) => void
  removeState: (workflowId: string, stateId: string) => void
  addTransition: (workflowId: string, transition: TransitionDef) => void
  updateTransition: (workflowId: string, transitionId: string, updates: Partial<TransitionDef>) => void
  removeTransition: (workflowId: string, transitionId: string) => void

  // Guards & Actions on transitions
  addGuard: (workflowId: string, transitionId: string, guard: Guard) => void
  removeGuard: (workflowId: string, transitionId: string, guardId: string) => void
  addTransitionAction: (workflowId: string, transitionId: string, action: Action) => void
  removeTransitionAction: (workflowId: string, transitionId: string, actionId: string) => void

  // Automations
  selectAutomation: (id: string | null) => void
  createAutomation: (productId: string, name: string, data?: Partial<AutomationDef>) => Promise<AutomationDef | null>
  updateAutomation: (id: string, data: Partial<AutomationDef>) => Promise<void>
  removeAutomation: (id: string) => Promise<void>

  // Forms
  selectForm: (id: string | null) => void
  createForm: (productId: string, name: string, data?: Partial<FormDef>) => Promise<FormDef | null>
  updateForm: (id: string, data: Partial<FormDef>) => Promise<void>
  removeForm: (id: string) => Promise<void>

  // Tab
  setActiveTab: (tab: WorkflowState['activeTab']) => void
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      entities: [],
      workflows: [],
      automations: [],
      forms: [],
      selectedEntityId: null,
      selectedWorkflowId: null,
      selectedAutomationId: null,
      selectedFormId: null,
      activeTab: 'entities',
      loading: false,

      hydrate: async (productId) => {
        set({ loading: true })
        try {
          if (trpcQuery) {
            const [entities, workflows, automations, forms] = await Promise.all([
              trpcQuery('workflow.listEntities', { productId }) as Promise<Array<Record<string, unknown>>>,
              trpcQuery('workflow.listWorkflows', { productId }) as Promise<Array<Record<string, unknown>>>,
              trpcQuery('workflow.listAutomations', { productId }) as Promise<Array<Record<string, unknown>>>,
              trpcQuery('workflow.listForms', { productId }) as Promise<Array<Record<string, unknown>>>,
            ])
            set({
              entities: entities.map(parseEntity),
              workflows: workflows.map(parseWorkflow),
              automations: automations.map(parseAutomation),
              forms: forms.map(parseForm),
              loading: false,
            })
          }
        } catch {
          set({ loading: false })
        }
      },

      /* ── Entities ─── */
      selectEntity: (id) => set({ selectedEntityId: id }),

      createEntity: async (productId, name, data) => {
        const tempId = `ent-temp-${Date.now()}`
        const newEntity: EntityDef = {
          id: tempId,
          label: name,
          description: data?.description ?? '',
          fields: data?.fields ?? [],
          relations: data?.relations ?? [],
          productId,
        }
        set((s) => ({ entities: [...s.entities, newEntity], selectedEntityId: tempId }))

        try {
          if (trpcMutate) {
            const result = (await trpcMutate('workflow.createEntity', {
              productId, name,
              data: { description: newEntity.description, fields: newEntity.fields, relations: newEntity.relations },
            })) as Record<string, unknown>
            const created = parseEntity(result)
            set((s) => ({
              entities: s.entities.map((e) => (e.id === tempId ? created : e)),
              selectedEntityId: created.id,
            }))
            return created
          }
        } catch {
          set((s) => ({ entities: s.entities.filter((e) => e.id !== tempId) }))
        }
        return newEntity
      },

      updateEntity: async (id, data) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id ? { ...e, ...data, fields: data.fields ?? e.fields, relations: data.relations ?? e.relations } : e,
          ),
        }))
        try {
          if (trpcMutate) {
            const entity = get().entities.find((e) => e.id === id)
            if (!entity) return
            await trpcMutate('workflow.updateEntity', {
              id, name: data.label,
              data: { description: data.description, fields: data.fields ?? entity.fields, relations: data.relations ?? entity.relations },
            })
          }
        } catch { /* optimistic */ }
      },

      removeEntity: async (id) => {
        const prev = get().entities
        set((s) => ({ entities: s.entities.filter((e) => e.id !== id), selectedEntityId: s.selectedEntityId === id ? null : s.selectedEntityId }))
        try {
          if (trpcMutate) await trpcMutate('workflow.deleteEntity', { id })
        } catch { set({ entities: prev }) }
      },

      addField: (entityId, field) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, fields: [...e.fields, field] } : e,
          ),
        }))
      },

      updateField: (entityId, fieldId, updates) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId
              ? { ...e, fields: e.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) }
              : e,
          ),
        }))
      },

      removeField: (entityId, fieldId) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, fields: e.fields.filter((f) => f.id !== fieldId) } : e,
          ),
        }))
      },

      addRelation: (entityId, relation) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, relations: [...e.relations, relation] } : e,
          ),
        }))
      },

      removeRelation: (entityId, relationId) => {
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === entityId ? { ...e, relations: e.relations.filter((r) => r.id !== relationId) } : e,
          ),
        }))
      },

      /* ── Workflows ─── */
      selectWorkflow: (id) => set({ selectedWorkflowId: id }),

      createWorkflow: async (productId, name, data) => {
        const tempId = `wf-temp-${Date.now()}`
        const newWf: WorkflowDef = {
          id: tempId,
          label: name,
          entityId: data?.entityId,
          description: data?.description ?? '',
          states: data?.states ?? [],
          transitions: data?.transitions ?? [],
          productId,
        }
        set((s) => ({ workflows: [...s.workflows, newWf], selectedWorkflowId: tempId }))

        try {
          if (trpcMutate) {
            const result = (await trpcMutate('workflow.createWorkflow', {
              productId, name,
              data: { entityId: newWf.entityId, description: newWf.description, states: newWf.states, transitions: newWf.transitions },
            })) as Record<string, unknown>
            const created = parseWorkflow(result)
            set((s) => ({
              workflows: s.workflows.map((w) => (w.id === tempId ? created : w)),
              selectedWorkflowId: created.id,
            }))
            return created
          }
        } catch {
          set((s) => ({ workflows: s.workflows.filter((w) => w.id !== tempId) }))
        }
        return newWf
      },

      updateWorkflow: async (id, data) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id
              ? { ...w, ...data, states: data.states ?? w.states, transitions: data.transitions ?? w.transitions }
              : w,
          ),
        }))
        try {
          if (trpcMutate) {
            const wf = get().workflows.find((w) => w.id === id)
            if (!wf) return
            await trpcMutate('workflow.updateWorkflow', {
              id, name: data.label,
              data: { entityId: data.entityId, description: data.description, states: data.states ?? wf.states, transitions: data.transitions ?? wf.transitions },
            })
          }
        } catch { /* optimistic */ }
      },

      removeWorkflow: async (id) => {
        const prev = get().workflows
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id), selectedWorkflowId: s.selectedWorkflowId === id ? null : s.selectedWorkflowId }))
        try {
          if (trpcMutate) await trpcMutate('workflow.deleteWorkflow', { id })
        } catch { set({ workflows: prev }) }
      },

      addState: (workflowId, state) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId ? { ...w, states: [...w.states, state] } : w,
          ),
        }))
      },

      updateState: (workflowId, stateId, updates) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? { ...w, states: w.states.map((st) => (st.id === stateId ? { ...st, ...updates } : st)) }
              : w,
          ),
        }))
      },

      removeState: (workflowId, stateId) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? {
                  ...w,
                  states: w.states.filter((st) => st.id !== stateId),
                  transitions: w.transitions.filter((t) => t.fromStateId !== stateId && t.toStateId !== stateId),
                }
              : w,
          ),
        }))
      },

      addTransition: (workflowId, transition) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId ? { ...w, transitions: [...w.transitions, transition] } : w,
          ),
        }))
      },

      updateTransition: (workflowId, transitionId, updates) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? { ...w, transitions: w.transitions.map((t) => (t.id === transitionId ? { ...t, ...updates } : t)) }
              : w,
          ),
        }))
      },

      removeTransition: (workflowId, transitionId) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId ? { ...w, transitions: w.transitions.filter((t) => t.id !== transitionId) } : w,
          ),
        }))
      },

      /* Guards & Actions helpers */
      addGuard: (workflowId, transitionId, guard) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? {
                  ...w,
                  transitions: w.transitions.map((t) =>
                    t.id === transitionId ? { ...t, guards: [...t.guards, guard] } : t,
                  ),
                }
              : w,
          ),
        }))
      },

      removeGuard: (workflowId, transitionId, guardId) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? {
                  ...w,
                  transitions: w.transitions.map((t) =>
                    t.id === transitionId ? { ...t, guards: t.guards.filter((g) => g.id !== guardId) } : t,
                  ),
                }
              : w,
          ),
        }))
      },

      addTransitionAction: (workflowId, transitionId, action) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? {
                  ...w,
                  transitions: w.transitions.map((t) =>
                    t.id === transitionId ? { ...t, actions: [...t.actions, action] } : t,
                  ),
                }
              : w,
          ),
        }))
      },

      removeTransitionAction: (workflowId, transitionId, actionId) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === workflowId
              ? {
                  ...w,
                  transitions: w.transitions.map((t) =>
                    t.id === transitionId ? { ...t, actions: t.actions.filter((a) => a.id !== actionId) } : t,
                  ),
                }
              : w,
          ),
        }))
      },

      /* ── Automations ─── */
      selectAutomation: (id) => set({ selectedAutomationId: id }),

      createAutomation: async (productId, name, data) => {
        const tempId = `auto-temp-${Date.now()}`
        const newAuto: AutomationDef = {
          id: tempId,
          label: name,
          description: data?.description ?? '',
          enabled: data?.enabled ?? true,
          trigger: data?.trigger ?? { type: 'manual' },
          conditions: data?.conditions ?? [],
          actions: data?.actions ?? [],
          productId,
        }
        set((s) => ({ automations: [...s.automations, newAuto], selectedAutomationId: tempId }))

        try {
          if (trpcMutate) {
            const result = (await trpcMutate('workflow.createAutomation', {
              productId, name,
              data: { description: newAuto.description, enabled: newAuto.enabled, trigger: newAuto.trigger, conditions: newAuto.conditions, actions: newAuto.actions },
            })) as Record<string, unknown>
            const created = parseAutomation(result)
            set((s) => ({
              automations: s.automations.map((a) => (a.id === tempId ? created : a)),
              selectedAutomationId: created.id,
            }))
            return created
          }
        } catch {
          set((s) => ({ automations: s.automations.filter((a) => a.id !== tempId) }))
        }
        return newAuto
      },

      updateAutomation: async (id, data) => {
        set((s) => ({
          automations: s.automations.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }))
        try {
          if (trpcMutate) {
            await trpcMutate('workflow.updateAutomation', { id, name: data.label, data })
          }
        } catch { /* optimistic */ }
      },

      removeAutomation: async (id) => {
        const prev = get().automations
        set((s) => ({ automations: s.automations.filter((a) => a.id !== id), selectedAutomationId: s.selectedAutomationId === id ? null : s.selectedAutomationId }))
        try {
          if (trpcMutate) await trpcMutate('workflow.deleteAutomation', { id })
        } catch { set({ automations: prev }) }
      },

      /* ── Forms ─── */
      selectForm: (id) => set({ selectedFormId: id }),

      createForm: async (productId, name, data) => {
        const tempId = `form-temp-${Date.now()}`
        const newForm: FormDef = {
          id: tempId,
          label: name,
          entityId: data?.entityId ?? '',
          description: data?.description ?? '',
          fields: data?.fields ?? [],
          steps: data?.steps ?? [],
          submitAction: data?.submitAction ?? 'create',
          productId,
        }
        set((s) => ({ forms: [...s.forms, newForm], selectedFormId: tempId }))

        try {
          if (trpcMutate) {
            const result = (await trpcMutate('workflow.createForm', {
              productId, name,
              data: { entityId: newForm.entityId, description: newForm.description, fields: newForm.fields, steps: newForm.steps, submitAction: newForm.submitAction },
            })) as Record<string, unknown>
            const created = parseForm(result)
            set((s) => ({
              forms: s.forms.map((f) => (f.id === tempId ? created : f)),
              selectedFormId: created.id,
            }))
            return created
          }
        } catch {
          set((s) => ({ forms: s.forms.filter((f) => f.id !== tempId) }))
        }
        return newForm
      },

      updateForm: async (id, data) => {
        set((s) => ({
          forms: s.forms.map((f) => (f.id === id ? { ...f, ...data } : f)),
        }))
        try {
          if (trpcMutate) {
            await trpcMutate('workflow.updateForm', { id, name: data.label, data })
          }
        } catch { /* optimistic */ }
      },

      removeForm: async (id) => {
        const prev = get().forms
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id), selectedFormId: s.selectedFormId === id ? null : s.selectedFormId }))
        try {
          if (trpcMutate) await trpcMutate('workflow.deleteForm', { id })
        } catch { set({ forms: prev }) }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'product-os-workflow-store',
      partialize: (s) => ({
        entities: s.entities,
        workflows: s.workflows,
        automations: s.automations,
        forms: s.forms,
        activeTab: s.activeTab,
      }),
    },
  ),
)
