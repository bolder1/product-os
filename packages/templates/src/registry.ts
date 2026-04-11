import type { TemplateBundle } from './types'
import { loadBundle } from './loader'
import saasStarter from './bundles/saas-starter.json' with { type: 'json' }
import opsPilot from './bundles/ops-pilot.json' with { type: 'json' }
import landingPage from './bundles/landing-page.json' with { type: 'json' }
import mobileApp from './bundles/mobile-app.json' with { type: 'json' }
import designSystem from './bundles/design-system.json' with { type: 'json' }

const builtInBundles: TemplateBundle[] = [
  loadBundle(saasStarter),
  loadBundle(opsPilot),
  loadBundle(landingPage),
  loadBundle(mobileApp),
  loadBundle(designSystem),
]

export function getBuiltInTemplates(): TemplateBundle[] {
  return builtInBundles
}

export function getTemplateById(id: string): TemplateBundle | undefined {
  return builtInBundles.find((b) => b.id === id)
}

export function getTemplatesByCategory(category: string): TemplateBundle[] {
  return builtInBundles.filter((b) => b.category === category)
}

export function searchTemplates(query: string): TemplateBundle[] {
  const lower = query.toLowerCase()
  return builtInBundles.filter(
    (b) =>
      b.name.toLowerCase().includes(lower) ||
      b.description.toLowerCase().includes(lower) ||
      b.tags.some((t) => t.toLowerCase().includes(lower)),
  )
}
