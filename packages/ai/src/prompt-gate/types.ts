/**
 * Prompt-gate data contracts.
 *
 * The prompt gate is the pre-flight surface that every natural-language prompt
 * passes through before a skill runs. It exposes two affordances:
 *   1. Enhance — rewrite a vague prompt into a well-defined one.
 *   2. Estimate — break down token cost and model routing before spending.
 *
 * See docs/revamp/03_ai_prompt_layer.md for full context.
 */

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Prompt context — what the gate knows about the user's current situation.
// ─────────────────────────────────────────────────────────────────────────────

export const EntryPointSchema = z.enum([
  'cortex',
  'copilot',
  'palette',
  'computer-mode',
  'studio-ask',
  'skill-invoke',
])
export type EntryPoint = z.infer<typeof EntryPointSchema>

export const ComputerModeSchema = z.enum(['suggest', 'assist', 'autopilot'])
export type ComputerMode = z.infer<typeof ComputerModeSchema>

export const GraphNodeRefSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string().optional(),
})
export type GraphNodeRef = z.infer<typeof GraphNodeRefSchema>

export const PromptContextSchema = z.object({
  entryPoint: EntryPointSchema,
  /** Studio the prompt originated from (e.g. 'cortex', 'design'). */
  studio: z.string().optional(),
  /** Alias for studio — used internally by the enhancer. */
  studioKey: z.string().optional(),
  selection: z.array(GraphNodeRefSchema).optional(),
  activePlanId: z.string().optional(),
  recentArtifacts: z.array(GraphNodeRefSchema).optional(),
  computerMode: ComputerModeSchema.optional(),
  /** Product context — used to scope graph queries. */
  productId: z.string().optional(),
  orgSlug: z.string().optional(),
  productSlug: z.string().optional(),
})
export type PromptContext = z.infer<typeof PromptContextSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced prompt — the result of the enhancer service.
// ─────────────────────────────────────────────────────────────────────────────

export const StrategyKeySchema = z.enum([
  'resolve-pronouns',
  'add-constraints',
  'bind-artifacts',
  'expand-scope',
  'extract-variables',
])
export type StrategyKey = z.infer<typeof StrategyKeySchema>

export const DiffOpSchema = z.enum(['equal', 'insert', 'delete'])
export const DiffSegmentSchema = z.object({
  op: DiffOpSchema,
  text: z.string(),
})
export type DiffSegment = z.infer<typeof DiffSegmentSchema>

export const TemplateVariableSchema = z.object({
  name: z.string(),
  value: z.string(),
  choices: z.array(z.string()).optional(),
  source: z.enum(['selection', 'studio', 'recent', 'user-input']),
})
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>

export const EnhancedPromptSchema = z.object({
  raw: z.string(),
  enhanced: z.string(),
  diff: z.array(DiffSegmentSchema),
  variables: z.array(TemplateVariableSchema),
  strategiesApplied: z.array(StrategyKeySchema),
  confidence: z.number().min(0).max(1),
})
export type EnhancedPrompt = z.infer<typeof EnhancedPromptSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Execution plan — the input to the token estimator.
// ─────────────────────────────────────────────────────────────────────────────

export const ModelIdSchema = z.enum([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'voyage-3',
  'text-embedding-3-small',
])
export type ModelId = z.infer<typeof ModelIdSchema>

export const StepRoleSchema = z.enum([
  'planner',
  'generator',
  'critic',
  'embedding',
  'tool-call',
])
export type StepRole = z.infer<typeof StepRoleSchema>

export const ExecutionStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  role: StepRoleSchema,
  model: ModelIdSchema,
  approxInputChars: z.number().nonnegative(),
  toolCount: z.number().nonnegative().default(0),
  dependsOn: z.array(z.string()).optional(),
})
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>

export const ExecutionPlanSchema = z.object({
  skillId: z.string(),
  steps: z.array(ExecutionStepSchema).min(1),
})
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Token estimate — the result of the estimator service.
// ─────────────────────────────────────────────────────────────────────────────

export const TokenRangeSchema = z.object({
  p10: z.number().nonnegative(),
  p50: z.number().nonnegative(),
  p90: z.number().nonnegative(),
})
export type TokenRange = z.infer<typeof TokenRangeSchema>

export const CostRangeSchema = z.object({
  p10: z.number().nonnegative(),
  p50: z.number().nonnegative(),
  p90: z.number().nonnegative(),
  currency: z.literal('USD').default('USD'),
})
export type CostRange = z.infer<typeof CostRangeSchema>

export const StepEstimateSchema = z.object({
  stepId: z.string(),
  label: z.string(),
  model: ModelIdSchema,
  inputTokens: TokenRangeSchema,
  outputTokens: TokenRangeSchema,
  cost: CostRangeSchema,
})
export type StepEstimate = z.infer<typeof StepEstimateSchema>

export const AlternativeSchema = z.object({
  label: z.string(),
  description: z.string(),
  savingsPct: z.number(),
  qualityDeltaPct: z.number(),
  cost: CostRangeSchema,
})
export type Alternative = z.infer<typeof AlternativeSchema>

export const BudgetSnapshotSchema = z.object({
  usedToday: z.number().nonnegative(),
  capToday: z.number().positive(),
  projectedAfter: z.number().nonnegative(),
  usedThisMonth: z.number().nonnegative(),
  capThisMonth: z.number().positive(),
})
export type BudgetSnapshot = z.infer<typeof BudgetSnapshotSchema>

export const TokenEstimateSchema = z.object({
  planId: z.string(),
  steps: z.array(StepEstimateSchema),
  total: z.object({
    tokens: TokenRangeSchema,
    cost: CostRangeSchema,
  }),
  budget: BudgetSnapshotSchema,
  alternatives: z.array(AlternativeSchema),
  confidence: z.number().min(0).max(1),
  generatedAt: z.string().datetime(),
})
export type TokenEstimate = z.infer<typeof TokenEstimateSchema>
