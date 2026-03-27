import type { TemplateBundle } from './types.js'

export interface ApplyResult {
  nodeIdMap: Map<string, string> // templateId -> real graph node ID
  nodesCreated: number
  edgesCreated: number
}

export async function applyTemplate(
  bundle: TemplateBundle,
  productId: string,
  createNode: (node: {
    productId: string
    kind: string
    label: string
    data: Record<string, unknown>
  }) => Promise<string>,
  createEdge: (edge: {
    productId: string
    sourceId: string
    targetId: string
    kind: string
  }) => Promise<string>,
): Promise<ApplyResult> {
  const nodeIdMap = new Map<string, string>()

  // Create all nodes first
  for (const templateNode of bundle.nodes) {
    const nodeId = await createNode({
      productId,
      kind: templateNode.kind,
      label: templateNode.label,
      data: templateNode.data as Record<string, unknown>,
    })
    nodeIdMap.set(templateNode.templateId, nodeId)
  }

  // Create all edges
  let edgesCreated = 0
  for (const templateEdge of bundle.edges) {
    const sourceId = nodeIdMap.get(templateEdge.sourceTemplateId)
    const targetId = nodeIdMap.get(templateEdge.targetTemplateId)

    if (sourceId && targetId) {
      await createEdge({
        productId,
        sourceId,
        targetId,
        kind: templateEdge.kind,
      })
      edgesCreated++
    }
  }

  return {
    nodeIdMap,
    nodesCreated: nodeIdMap.size,
    edgesCreated,
  }
}
