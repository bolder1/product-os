import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type AIProvider = 'anthropic' | 'openai'

export function getModel(provider: AIProvider = 'anthropic', modelId?: string) {
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId ?? 'claude-sonnet-4-20250514')
    case 'openai':
      return openai(modelId ?? 'gpt-4o')
    default:
      return anthropic('claude-sonnet-4-20250514')
  }
}
