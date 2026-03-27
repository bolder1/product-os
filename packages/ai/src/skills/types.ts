import { z } from 'zod'
import type { AIContext } from '../context.js'

export const skillActionEnum = z.enum([
  'suggest',
  'scaffold',
  'transform',
  'analyze',
  'validate',
])

export type SkillAction = z.infer<typeof skillActionEnum>

export interface SkillDefinition<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  action: SkillAction
  category: 'product' | 'design' | 'engineering' | 'growth' | 'system'
  inputSchema: z.ZodType<TInput>
  outputSchema: z.ZodType<TOutput>
  creditCost: number
  execute: (context: AIContext, input: TInput) => Promise<TOutput>
}

export interface SkillResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  tokensUsed: number
  model: string
  duration: number
}
