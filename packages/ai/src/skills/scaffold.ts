import { generateText } from 'ai'
import { z } from 'zod'
import { getModel } from '../provider.js'
import { buildSystemPrompt, type AIContext } from '../context.js'
import type { SkillDefinition } from './types.js'

const scaffoldInputSchema = z.object({
  prompt: z.string(),
  targetStructure: z.enum([
    'product_plan',
    'page_layout',
    'workflow',
    'component_tree',
    'entity_schema',
    'brand_system',
    'feature_breakdown',
    'journey_map',
  ]),
})

const scaffoldOutputSchema = z.object({
  nodes: z.array(
    z.object({
      tempId: z.string(),
      kind: z.string(),
      label: z.string(),
      data: z.record(z.unknown()),
    }),
  ),
  edges: z.array(
    z.object({
      sourceTempId: z.string(),
      targetTempId: z.string(),
      kind: z.string(),
    }),
  ),
  summary: z.string(),
})

type ScaffoldInput = z.infer<typeof scaffoldInputSchema>
type ScaffoldOutput = z.infer<typeof scaffoldOutputSchema>

export const scaffoldSkill: SkillDefinition<ScaffoldInput, ScaffoldOutput> = {
  name: 'scaffold',
  description: 'Generate a structured graph scaffold from a natural language description',
  action: 'scaffold',
  category: 'product',
  inputSchema: scaffoldInputSchema,
  outputSchema: scaffoldOutputSchema,
  creditCost: 3,

  async execute(context: AIContext, input: ScaffoldInput): Promise<ScaffoldOutput> {
    const systemPrompt = buildSystemPrompt(context)

    const { text } = await generateText({
      model: getModel('anthropic'),
      system: `${systemPrompt}\n\nYou are generating a product graph scaffold. Respond with a JSON object containing:\n- "nodes": array of {tempId, kind, label, data} where kind is one of: product, plan, module, feature, journey, page, route, screen, workflow, entity, field, component, token, asset\n- "edges": array of {sourceTempId, targetTempId, kind} where kind is one of: contains, depends_on, references, implements, uses_token, uses_component, triggers, routes_to\n- "summary": brief description of what was generated\n\nGenerate a ${input.targetStructure} structure.`,
      prompt: input.prompt,
    })

    try {
      const parsed = JSON.parse(text)
      return scaffoldOutputSchema.parse(parsed)
    } catch {
      return {
        nodes: [],
        edges: [],
        summary: `Failed to parse scaffold output. Raw: ${text.substring(0, 200)}`,
      }
    }
  },
}
