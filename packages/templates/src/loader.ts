import { type TemplateBundle, templateBundleSchema } from './types'

export function loadBundle(raw: unknown): TemplateBundle {
  return templateBundleSchema.parse(raw)
}

export function resolveVariables(
  template: TemplateBundle,
  values: Record<string, unknown>,
): TemplateBundle {
  const resolved = JSON.parse(JSON.stringify(template)) as TemplateBundle

  for (const node of resolved.nodes) {
    node.label = replaceVars(node.label, values)
    node.data = JSON.parse(replaceVars(JSON.stringify(node.data), values))
  }

  return resolved
}

function replaceVars(text: string, values: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = values[key]
    return val !== undefined ? String(val) : `{{${key}}}`
  })
}
