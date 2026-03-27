export {
  // Individual schemas
  productDataSchema,
  planDataSchema,
  templateBundleDataSchema,
  moduleDataSchema,
  featureDataSchema,
  journeyDataSchema,
  pageDataSchema,
  routeDataSchema,
  screenDataSchema,
  workflowDataSchema,
  entityDataSchema,
  fieldDataSchema,
  componentDataSchema,
  variantDataSchema,
  tokenDataSchema,
  assetDataSchema,
  taskDataSchema,
  approvalDataSchema,
  insightDataSchema,
  releaseDataSchema,
  connectorBindingDataSchema,
  mcpBindingDataSchema,
  skillActionDataSchema,
  computerActionDataSchema,
  // Map & type utilities
  nodeDataSchemas,
  graphNodeKinds,
} from './node-kinds.js'

export type { GraphNodeKind, NodeData } from './node-kinds.js'

import { nodeDataSchemas, type GraphNodeKind } from './node-kinds.js'

// ---------------------------------------------------------------------------
// Runtime validator
// ---------------------------------------------------------------------------

export interface ValidationResult {
  success: boolean
  data?: unknown
  errors?: Array<{ path: (string | number)[]; message: string }>
}

/**
 * Validate the `data` payload of a graph node against its kind-specific schema.
 *
 * @param kind  - One of the 24 `GraphNodeKind` strings.
 * @param data  - The raw data object to validate.
 * @returns A `ValidationResult` with parsed data on success or structured errors.
 */
export function validateNodeData(kind: GraphNodeKind, data: unknown): ValidationResult {
  const schema = nodeDataSchemas[kind]
  if (!schema) {
    return {
      success: false,
      errors: [{ path: [], message: `Unknown node kind: "${kind}"` }],
    }
  }

  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    })),
  }
}
