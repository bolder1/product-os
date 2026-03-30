import { generateText } from 'ai'
import { z } from 'zod'
import { getModel } from '../provider'
import { buildSystemPrompt, type AIContext } from '../context'
import type { SkillDefinition, SkillResult } from './types'

const suggestInputSchema = z.object({
  prompt: z.string(),
  maxSuggestions: z.number().default(5),
  targetNodeKind: z.string().optional(),
})

const suggestOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      confidence: z.number().min(0).max(1),
      category: z.string().optional(),
      applyAction: z
        .object({
          nodeKind: z.string(),
          label: z.string(),
          data: z.record(z.unknown()),
        })
        .optional(),
    }),
  ),
})

type SuggestInput = z.infer<typeof suggestInputSchema>
type SuggestOutput = z.infer<typeof suggestOutputSchema>

export const suggestSkill: SkillDefinition<SuggestInput, SuggestOutput> = {
  name: 'suggest',
  description: 'Generate contextual suggestions for any studio based on the product graph',
  action: 'suggest',
  category: 'system',
  inputSchema: suggestInputSchema,
  outputSchema: suggestOutputSchema,
  creditCost: 1,

  async execute(context: AIContext, input: SuggestInput): Promise<SuggestOutput> {
    const systemPrompt = buildSystemPrompt(context)

    const { text } = await generateText({
      model: getModel('anthropic'),
      system: `${systemPrompt}\n\nRespond with a JSON object containing a "suggestions" array. Each suggestion should have: title, description, confidence (0-1), and optionally a category and applyAction with nodeKind, label, and data fields.`,
      prompt: input.prompt,
    })

    try {
      const parsed = JSON.parse(text)
      return suggestOutputSchema.parse(parsed)
    } catch {
      return {
        suggestions: [
          {
            title: 'AI Suggestion',
            description: text,
            confidence: 0.7,
          },
        ],
      }
    }
  },
}
