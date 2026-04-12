import { suggestSkill } from './suggest'
import { scaffoldSkill } from './scaffold'
import { analyzeSkill } from './analyze'
import type { SkillDefinition } from './types'

export type { SkillDefinition, SkillAction, SkillResult } from './types'

const skillRegistry = new Map<string, SkillDefinition>()

function registerSkill(skill: SkillDefinition) {
  skillRegistry.set(skill.name, skill)
}

// Register built-in skills
registerSkill(suggestSkill as SkillDefinition)
registerSkill(scaffoldSkill as SkillDefinition)
registerSkill(analyzeSkill as SkillDefinition)

export function getSkill(name: string): SkillDefinition | undefined {
  return skillRegistry.get(name)
}

export function listSkills(): SkillDefinition[] {
  return Array.from(skillRegistry.values())
}

export function listSkillsByCategory(
  category: string,
): SkillDefinition[] {
  return Array.from(skillRegistry.values()).filter((s) => s.category === category)
}

export { suggestSkill, scaffoldSkill, analyzeSkill }
