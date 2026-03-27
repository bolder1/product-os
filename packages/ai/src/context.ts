import { z } from 'zod'

export const aiContextSchema = z.object({
  productId: z.string().uuid(),
  studioOrigin: z.string(),
  currentNodeId: z.string().uuid().optional(),
  currentNodeKind: z.string().optional(),
  neighborNodes: z
    .array(
      z.object({
        id: z.string().uuid(),
        kind: z.string(),
        label: z.string(),
        data: z.record(z.unknown()),
      }),
    )
    .default([]),
  productBrief: z
    .object({
      name: z.string(),
      description: z.string().optional(),
      problemStatement: z.string().optional(),
      goalStatement: z.string().optional(),
    })
    .optional(),
  brandGuidelines: z
    .object({
      primaryColor: z.string().optional(),
      typography: z.string().optional(),
      voiceTone: z.string().optional(),
    })
    .optional(),
  recentActivity: z
    .array(
      z.object({
        action: z.string(),
        entityType: z.string(),
        timestamp: z.number(),
      }),
    )
    .default([]),
})

export type AIContext = z.infer<typeof aiContextSchema>

export function buildSystemPrompt(context: AIContext): string {
  const parts: string[] = [
    'You are an AI assistant for Product OS, a unified product intelligence and execution system.',
    `You are currently in the ${context.studioOrigin} studio.`,
  ]

  if (context.productBrief) {
    parts.push(`Product: ${context.productBrief.name}`)
    if (context.productBrief.problemStatement) {
      parts.push(`Problem: ${context.productBrief.problemStatement}`)
    }
    if (context.productBrief.goalStatement) {
      parts.push(`Goal: ${context.productBrief.goalStatement}`)
    }
  }

  if (context.currentNodeKind) {
    parts.push(`Currently working on a ${context.currentNodeKind} node.`)
  }

  if (context.neighborNodes.length > 0) {
    parts.push(
      `Related nodes: ${context.neighborNodes.map((n) => `${n.kind}:${n.label}`).join(', ')}`,
    )
  }

  if (context.brandGuidelines?.voiceTone) {
    parts.push(`Brand voice: ${context.brandGuidelines.voiceTone}`)
  }

  return parts.join('\n')
}

export async function buildContext(
  productId: string,
  studioOrigin: string,
  currentNodeId?: string,
): Promise<AIContext> {
  // In production, this fetches from the graph DB
  // For now, return a minimal context
  return {
    productId,
    studioOrigin,
    currentNodeId,
    neighborNodes: [],
    recentActivity: [],
  }
}
