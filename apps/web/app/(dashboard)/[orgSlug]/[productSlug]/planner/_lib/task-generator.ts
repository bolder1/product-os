export type OrgRole = 'Manager' | 'Business Analyst' | 'Product Designer' | 'Frontend Dev' | 'Backend Dev' | 'QA'

export interface GeneratedTask {
  id: string
  title: string
  description?: string
  role: OrgRole
  feature: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effort: 'S' | 'M' | 'L'
  studio: string
  dependsOn?: string[]
}

interface PlanFeature {
  id: string
  name: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
}

interface PlanData {
  problem: string
  goals: Array<{ id: string; text: string; category: string }>
  personas: Array<{ id: string; name: string; role: string; painPoint: string }>
  features: PlanFeature[]
  entities: Array<{ id: string; name: string; fields: Array<{ name: string; type: string }> }>
  activeStudios: string[]
}

// R20: ROLE_COLORS retired — role identity is carried by label + icon, not
// color tint. See step-review-launch.tsx for the post-R20 treatment.

const ROLE_STUDIOS: Record<OrgRole, string> = {
  Manager: 'planner',
  'Business Analyst': 'planner',
  'Product Designer': 'design',
  'Frontend Dev': 'components',
  'Backend Dev': 'workflows',
  QA: 'testing',
}

function mapPriorityToTask(featurePriority: PlanFeature['priority']): GeneratedTask['priority'] {
  switch (featurePriority) {
    case 'must-have':
      return 'critical'
    case 'should-have':
      return 'high'
    case 'nice-to-have':
      return 'medium'
    default:
      return 'medium'
  }
}

function generateTasksForFeature(feature: PlanFeature, index: number): GeneratedTask[] {
  const basePriority = mapPriorityToTask(feature.priority)
  const featureName = feature.name
  const baseId = `task-${index}`
  const isMustHave = feature.priority === 'must-have'

  const tasks: GeneratedTask[] = [
    // Manager tasks
    {
      id: `${baseId}-mgr-1`,
      title: `Define requirements for ${featureName}`,
      role: 'Manager',
      feature: featureName,
      priority: basePriority,
      effort: 'M',
      studio: 'planner',
    },
    {
      id: `${baseId}-mgr-2`,
      title: `Review ${featureName} milestone`,
      role: 'Manager',
      feature: featureName,
      priority: basePriority === 'critical' ? 'high' : 'medium',
      effort: 'S',
      studio: 'planner',
      dependsOn: [`${baseId}-fe-1`, `${baseId}-be-1`],
    },

    // Business Analyst tasks
    {
      id: `${baseId}-ba-1`,
      title: `Write user stories for ${featureName}`,
      role: 'Business Analyst',
      feature: featureName,
      priority: basePriority,
      effort: 'M',
      studio: 'planner',
      dependsOn: [`${baseId}-mgr-1`],
    },
    {
      id: `${baseId}-ba-2`,
      title: `Create acceptance criteria for ${featureName}`,
      role: 'Business Analyst',
      feature: featureName,
      priority: basePriority,
      effort: 'S',
      studio: 'planner',
      dependsOn: [`${baseId}-ba-1`],
    },

    // Product Designer tasks
    {
      id: `${baseId}-des-1`,
      title: `Design UI for ${featureName}`,
      role: 'Product Designer',
      feature: featureName,
      priority: basePriority,
      effort: 'L',
      studio: 'design',
      dependsOn: [`${baseId}-ba-1`],
    },
    {
      id: `${baseId}-des-2`,
      title: `Create wireframes for ${featureName}`,
      role: 'Product Designer',
      feature: featureName,
      priority: basePriority === 'critical' ? 'high' : 'medium',
      effort: 'M',
      studio: 'design',
      dependsOn: [`${baseId}-ba-1`],
    },

    // Frontend Dev tasks
    {
      id: `${baseId}-fe-1`,
      title: `Implement ${featureName} component`,
      role: 'Frontend Dev',
      feature: featureName,
      priority: basePriority,
      effort: 'L',
      studio: 'components',
      dependsOn: [`${baseId}-des-1`],
    },
    {
      id: `${baseId}-fe-2`,
      title: `Build ${featureName} page`,
      role: 'Frontend Dev',
      feature: featureName,
      priority: basePriority,
      effort: 'L',
      studio: 'pages',
      dependsOn: [`${baseId}-fe-1`],
    },

    // Backend Dev tasks
    {
      id: `${baseId}-be-1`,
      title: `Build ${featureName} API endpoint`,
      role: 'Backend Dev',
      feature: featureName,
      priority: basePriority,
      effort: 'L',
      studio: 'workflows',
      dependsOn: [`${baseId}-ba-2`],
    },
    {
      id: `${baseId}-be-2`,
      title: `Create ${featureName} data model`,
      role: 'Backend Dev',
      feature: featureName,
      priority: basePriority,
      effort: 'M',
      studio: 'code',
      dependsOn: [`${baseId}-ba-2`],
    },

    // QA tasks
    {
      id: `${baseId}-qa-1`,
      title: `Write test plan for ${featureName}`,
      role: 'QA',
      feature: featureName,
      priority: basePriority,
      effort: 'M',
      studio: 'testing',
      dependsOn: [`${baseId}-ba-2`],
    },
    {
      id: `${baseId}-qa-2`,
      title: `Execute regression tests for ${featureName}`,
      role: 'QA',
      feature: featureName,
      priority: basePriority === 'critical' ? 'high' : 'medium',
      effort: 'M',
      studio: 'testing',
      dependsOn: [`${baseId}-fe-2`, `${baseId}-be-1`],
    },
  ]

  // Must-have features get extra tasks
  if (isMustHave) {
    tasks.push(
      {
        id: `${baseId}-mgr-3`,
        title: `Create go-to-market checklist for ${featureName}`,
        role: 'Manager',
        feature: featureName,
        priority: 'high',
        effort: 'M',
        studio: 'planner',
        dependsOn: [`${baseId}-mgr-2`],
      },
      {
        id: `${baseId}-des-3`,
        title: `Create prototype for ${featureName}`,
        role: 'Product Designer',
        feature: featureName,
        priority: 'high',
        effort: 'L',
        studio: 'design',
        dependsOn: [`${baseId}-des-1`],
      },
    )
  }

  return tasks
}

export function generateTasksFromPlan(planData: PlanData): GeneratedTask[] {
  const allTasks: GeneratedTask[] = []

  planData.features.forEach((feature, index) => {
    const featureTasks = generateTasksForFeature(feature, index)
    allTasks.push(...featureTasks)
  })

  return allTasks
}

export function getTasksByRole(tasks: GeneratedTask[]): Record<OrgRole, GeneratedTask[]> {
  const roles: OrgRole[] = ['Manager', 'Business Analyst', 'Product Designer', 'Frontend Dev', 'Backend Dev', 'QA']
  const grouped: Record<OrgRole, GeneratedTask[]> = {
    Manager: [],
    'Business Analyst': [],
    'Product Designer': [],
    'Frontend Dev': [],
    'Backend Dev': [],
    QA: [],
  }

  for (const task of tasks) {
    if (grouped[task.role]) {
      grouped[task.role].push(task)
    }
  }

  return grouped
}

export { ROLE_STUDIOS }
