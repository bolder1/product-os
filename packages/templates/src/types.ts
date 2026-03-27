import { z } from 'zod'

export const templateVariableSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'select', 'boolean', 'color', 'number']),
  default: z.unknown(),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
})

export const templateNodeSchema = z.object({
  templateId: z.string(),
  kind: z.string(),
  label: z.string(),
  data: z.record(z.unknown()),
})

export const templateEdgeSchema = z.object({
  sourceTemplateId: z.string(),
  targetTemplateId: z.string(),
  kind: z.string(),
})

export const templateBundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'saas',
    'mobile',
    'ecommerce',
    'marketing',
    'design_system',
    'internal_ops',
    'custom',
  ]),
  tags: z.array(z.string()),
  thumbnail: z.string().optional(),
  variables: z.array(templateVariableSchema),
  nodes: z.array(templateNodeSchema),
  edges: z.array(templateEdgeSchema),
  version: z.string().default('1.0.0'),
  author: z.string().default('Product OS'),
  compatibility: z.string().default('0.1.0'),
})

export type TemplateVariable = z.infer<typeof templateVariableSchema>
export type TemplateNode = z.infer<typeof templateNodeSchema>
export type TemplateEdge = z.infer<typeof templateEdgeSchema>
export type TemplateBundle = z.infer<typeof templateBundleSchema>
