import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared enums & small helpers
// ---------------------------------------------------------------------------

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])
const statusEnum = z.enum(['draft', 'active', 'archived', 'deprecated'])
const publishStateEnum = z.enum(['draft', 'published', 'scheduled', 'unpublished'])
const syncDirectionEnum = z.enum(['push', 'pull', 'bidirectional'])
const computerActionModeEnum = z.enum(['browse', 'code', 'terminal', 'design'])
const taskStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled'])
const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])
const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'changes_requested'])
const releaseStatusEnum = z.enum(['planned', 'staging', 'canary', 'released', 'rolled_back'])
const tokenStatusEnum = z.enum(['active', 'deprecated', 'candidate'])
const componentStatusEnum = z.enum(['draft', 'ready', 'deprecated'])
const computerActionStatusEnum = z.enum(['pending', 'running', 'completed', 'failed', 'rolled_back'])

// ---------------------------------------------------------------------------
// 1. product
// ---------------------------------------------------------------------------
export const productDataSchema = z.object({
  problemStatement: z.string(),
  goalStatement: z.string(),
  category: z.string().optional(),
  targetOutcomes: z.array(z.string()).default([]),
})

// ---------------------------------------------------------------------------
// 2. plan
// ---------------------------------------------------------------------------
export const planDataSchema = z.object({
  problemStatement: z.string(),
  goalStatement: z.string(),
  targetOutcomes: z.array(z.string()).default([]),
  personas: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    goals: z.array(z.string()).default([]),
  })).default([]),
  coreFeatures: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  userFlows: z.array(z.string()).default([]),
  selectedStudios: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  aiSuggestionsLog: z.array(z.object({
    prompt: z.string(),
    response: z.string(),
    accepted: z.boolean().default(false),
    timestamp: z.string().datetime().optional(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 3. template_bundle
// ---------------------------------------------------------------------------
export const templateBundleDataSchema = z.object({
  manifest: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  includedStudios: z.array(z.string()).default([]),
  compatibility: z.object({
    minVersion: z.string().optional(),
    maxVersion: z.string().optional(),
    requiredFeatures: z.array(z.string()).default([]),
  }).default({}),
  bundleData: z.record(z.string(), z.unknown()).default({}),
})

// ---------------------------------------------------------------------------
// 4. module
// ---------------------------------------------------------------------------
export const moduleDataSchema = z.object({
  description: z.string().optional(),
  priority: priorityEnum.default('medium'),
  status: statusEnum.default('draft'),
})

// ---------------------------------------------------------------------------
// 5. feature
// ---------------------------------------------------------------------------
export const featureDataSchema = z.object({
  description: z.string().optional(),
  priority: priorityEnum.default('medium'),
  status: statusEnum.default('draft'),
  acceptanceCriteria: z.array(z.string()).default([]),
  storyPoints: z.number().int().nonnegative().optional(),
})

// ---------------------------------------------------------------------------
// 6. journey
// ---------------------------------------------------------------------------
export const journeyDataSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    order: z.number().int().default(0),
  })).default([]),
  touchpoints: z.array(z.object({
    stepId: z.string(),
    channel: z.string(),
    description: z.string().optional(),
  })).default([]),
  emotionMap: z.array(z.object({
    stepId: z.string(),
    emotion: z.string(),
    intensity: z.number().min(-1).max(1).optional(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 7. page
// ---------------------------------------------------------------------------
export const pageDataSchema = z.object({
  template: z.string().optional(),
  contentModelRefs: z.array(z.string()).default([]),
  navigationPosition: z.number().int().optional(),
  seoMetadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().url().optional(),
    canonicalUrl: z.string().url().optional(),
  }).default({}),
  publishState: publishStateEnum.default('draft'),
})

// ---------------------------------------------------------------------------
// 8. route
// ---------------------------------------------------------------------------
export const routeDataSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).default('GET'),
  params: z.array(z.object({
    name: z.string(),
    type: z.string().default('string'),
    required: z.boolean().default(true),
  })).default([]),
  guards: z.array(z.string()).default([]),
})

// ---------------------------------------------------------------------------
// 9. screen
// ---------------------------------------------------------------------------
export const screenDataSchema = z.object({
  frameWidth: z.number().positive(),
  frameHeight: z.number().positive(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'watch', 'custom']).default('desktop'),
  prototypeLinks: z.array(z.object({
    targetScreenId: z.string(),
    hotspotRegion: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).optional(),
    transition: z.string().optional(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 10. workflow
// ---------------------------------------------------------------------------
export const workflowDataSchema = z.object({
  states: z.array(z.object({
    id: z.string(),
    label: z.string(),
    isInitial: z.boolean().default(false),
    isFinal: z.boolean().default(false),
  })).default([]),
  transitions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    event: z.string(),
    condition: z.string().optional(),
  })).default([]),
  triggers: z.array(z.object({
    event: z.string(),
    action: z.string(),
    config: z.record(z.string(), z.unknown()).optional(),
  })).default([]),
  automations: z.array(z.object({
    name: z.string(),
    triggerEvent: z.string(),
    steps: z.array(z.record(z.string(), z.unknown())).default([]),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 11. entity
// ---------------------------------------------------------------------------
export const entityDataSchema = z.object({
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
  })).default([]),
  relations: z.array(z.object({
    targetEntity: z.string(),
    kind: z.enum(['one_to_one', 'one_to_many', 'many_to_many']),
    foreignKey: z.string().optional(),
  })).default([]),
  displayField: z.string().optional(),
})

// ---------------------------------------------------------------------------
// 12. field
// ---------------------------------------------------------------------------
export const fieldDataSchema = z.object({
  fieldType: z.enum([
    'text', 'number', 'boolean', 'date', 'datetime',
    'email', 'url', 'json', 'enum', 'relation', 'file', 'rich_text',
  ]),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    custom: z.string().optional(),
  }).optional(),
  options: z.array(z.string()).optional(),
})

// ---------------------------------------------------------------------------
// 13. component
// ---------------------------------------------------------------------------
export const componentDataSchema = z.object({
  category: z.string().optional(),
  visualSchema: z.record(z.string(), z.unknown()).default({}),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    defaultValue: z.unknown().optional(),
    required: z.boolean().default(false),
    description: z.string().optional(),
  })).default([]),
  slots: z.array(z.object({
    name: z.string(),
    allowedComponents: z.array(z.string()).default([]),
  })).default([]),
  linkedTokens: z.array(z.string()).default([]),
  linkedCodeComponent: z.string().optional(),
  status: componentStatusEnum.default('draft'),
})

// ---------------------------------------------------------------------------
// 14. variant
// ---------------------------------------------------------------------------
export const variantDataSchema = z.object({
  parentComponentId: z.string().uuid(),
  variantProps: z.record(z.string(), z.unknown()).default({}),
  conditions: z.array(z.object({
    property: z.string(),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in']),
    value: z.unknown(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 15. token
// ---------------------------------------------------------------------------
export const tokenDataSchema = z.object({
  namespace: z.string(),
  tokenType: z.enum([
    'color', 'spacing', 'typography', 'shadow', 'border',
    'radius', 'opacity', 'motion', 'sizing', 'custom',
  ]),
  value: z.unknown(),
  modes: z.record(z.string(), z.unknown()).default({}),
  semanticAlias: z.string().optional(),
  usageCount: z.number().int().nonnegative().default(0),
  status: tokenStatusEnum.default('active'),
})

// ---------------------------------------------------------------------------
// 16. asset
// ---------------------------------------------------------------------------
export const assetDataSchema = z.object({
  fileUrl: z.string().url(),
  mimeType: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

// ---------------------------------------------------------------------------
// 17. task  (mirrors collaboration.tasks table)
// ---------------------------------------------------------------------------
export const taskDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: taskStatusEnum.default('todo'),
  priority: taskPriorityEnum.default('medium'),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  studioOrigin: z.string().optional(),
})

// ---------------------------------------------------------------------------
// 18. approval  (mirrors collaboration.approvals table)
// ---------------------------------------------------------------------------
export const approvalDataSchema = z.object({
  requestedBy: z.string().uuid(),
  status: approvalStatusEnum.default('pending'),
  routing: z.object({
    approvers: z.array(z.string().uuid()),
    mode: z.enum(['sequential', 'parallel']),
  }).optional(),
  decidedAt: z.string().datetime().optional(),
})

// ---------------------------------------------------------------------------
// 19. insight
// ---------------------------------------------------------------------------
export const insightDataSchema = z.object({
  metricId: z.string(),
  value: z.number(),
  trend: z.enum(['up', 'down', 'flat']).optional(),
  recommendation: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
})

// ---------------------------------------------------------------------------
// 20. release
// ---------------------------------------------------------------------------
export const releaseDataSchema = z.object({
  version: z.string(),
  environment: z.string(),
  changelog: z.array(z.string()).default([]),
  status: releaseStatusEnum.default('planned'),
  publishedAt: z.string().datetime().optional(),
})

// ---------------------------------------------------------------------------
// 21. connector_binding
// ---------------------------------------------------------------------------
export const connectorBindingDataSchema = z.object({
  connectorType: z.string(),
  externalId: z.string(),
  syncDirection: syncDirectionEnum.default('bidirectional'),
  mappingRules: z.array(z.object({
    localField: z.string(),
    externalField: z.string(),
    transform: z.string().optional(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// 22. mcp_binding
// ---------------------------------------------------------------------------
export const mcpBindingDataSchema = z.object({
  serverUrl: z.string().url(),
  toolName: z.string(),
  lastResult: z.unknown().optional(),
})

// ---------------------------------------------------------------------------
// 23. skill_action
// ---------------------------------------------------------------------------
export const skillActionDataSchema = z.object({
  skillName: z.string(),
  inputSummary: z.string().optional(),
  outputSummary: z.string().optional(),
  accepted: z.boolean().default(false),
  tokensUsed: z.number().int().nonnegative().default(0),
})

// ---------------------------------------------------------------------------
// 24. computer_action
// ---------------------------------------------------------------------------
export const computerActionDataSchema = z.object({
  mode: computerActionModeEnum,
  actionPlan: z.string().optional(),
  executionLog: z.array(z.object({
    step: z.number().int(),
    description: z.string(),
    result: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  })).default([]),
  rollbackPoint: z.string().optional(),
  status: computerActionStatusEnum.default('pending'),
})

// ---------------------------------------------------------------------------
// Collected map: kind string -> Zod schema
// ---------------------------------------------------------------------------

export const nodeDataSchemas = {
  product: productDataSchema,
  plan: planDataSchema,
  template_bundle: templateBundleDataSchema,
  module: moduleDataSchema,
  feature: featureDataSchema,
  journey: journeyDataSchema,
  page: pageDataSchema,
  route: routeDataSchema,
  screen: screenDataSchema,
  workflow: workflowDataSchema,
  entity: entityDataSchema,
  field: fieldDataSchema,
  component: componentDataSchema,
  variant: variantDataSchema,
  token: tokenDataSchema,
  asset: assetDataSchema,
  task: taskDataSchema,
  approval: approvalDataSchema,
  insight: insightDataSchema,
  release: releaseDataSchema,
  connector_binding: connectorBindingDataSchema,
  mcp_binding: mcpBindingDataSchema,
  skill_action: skillActionDataSchema,
  computer_action: computerActionDataSchema,
} as const

/** All valid node kind strings. */
export const graphNodeKinds = Object.keys(nodeDataSchemas) as GraphNodeKind[]

/** Union of all 24 node kind literals. */
export type GraphNodeKind = keyof typeof nodeDataSchemas

/** Inferred TypeScript type for a given node kind's data field. */
export type NodeData<K extends GraphNodeKind> = z.infer<(typeof nodeDataSchemas)[K]>
