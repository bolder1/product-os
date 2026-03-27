import { generateText } from 'ai'
import { z } from 'zod'
import { getModel } from '../provider.js'
import { buildSystemPrompt, type AIContext } from '../context.js'
import type { SkillDefinition } from './types.js'

const analyzeInputSchema = z.object({
  prompt: z.string(),
  analysisType: z.enum([
    'dependencies',
    'impact',
    'gaps',
    'risks',
    'performance',
    'accessibility',
    'compliance',
    'readiness',
  ]),
})

const analyzeOutputSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(['info', 'warning', 'error', 'critical']),
      category: z.string(),
      affectedNodes: z.array(z.string()).default([]),
      recommendation: z.string().optional(),
    }),
  ),
  summary: z.string(),
  score: z.number().min(0).max(100).optional(),
})

type AnalyzeInput = z.infer<typeof analyzeInputSchema>
type AnalyzeOutput = z.infer<typeof analyzeOutputSchema>

export const analyzeSkill: SkillDefinition<AnalyzeInput, AnalyzeOutput> = {
  name: 'analyze',
  description: 'Analyze the product graph for insights, risks, gaps, and recommendations',
  action: 'analyze',
  category: 'system',
  inputSchema: analyzeInputSchema,
  outputSchema: analyzeOutputSchema,
  creditCost: 2,

  async execute(context: AIContext, input: AnalyzeInput): Promise<AnalyzeOutput> {
    const systemPrompt = buildSystemPrompt(context)

    const { text } = await generateText({
      model: getModel('anthropic'),
      system: `${systemPrompt}\n\nYou are performing a ${input.analysisType} analysis. Respond with a JSON object containing:\n- "findings": array of {title, description, severity (info/warning/error/critical), category, affectedNodes (array of node IDs), recommendation}\n- "summary": brief overall analysis\n- "score": optional overall score 0-100`,
      prompt: input.prompt,
    })

    try {
      const parsed = JSON.parse(text)
      return analyzeOutputSchema.parse(parsed)
    } catch {
      return {
        findings: [],
        summary: text.substring(0, 500),
      }
    }
  },
}
