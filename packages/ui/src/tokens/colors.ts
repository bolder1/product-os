export const colors = {
  // Backgrounds — deep space navy
  bg: {
    primary: '#060918',
    secondary: '#0C1024',
    tertiary: '#121733',
    elevated: '#181E3A',
  },

  // Surfaces — glass morphism layers
  surface: {
    default: 'rgba(255, 255, 255, 0.03)',
    hover: 'rgba(255, 255, 255, 0.06)',
    active: 'rgba(255, 255, 255, 0.09)',
    overlay: 'rgba(6, 9, 24, 0.8)',
  },

  // Borders — subtle glow lines
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.12)',
    active: 'rgba(255, 255, 255, 0.18)',
    focus: 'rgba(59, 130, 246, 0.5)',
  },

  // Accent colors
  accent: {
    blue: '#3B82F6',
    violet: '#8B5CF6',
    cyan: '#06B6D4',
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#F43F5E',
    pink: '#EC4899',
    indigo: '#6366F1',
  },

  // Text
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
  },

  // Status
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#F43F5E',
    info: '#06B6D4',
  },

  // Glow effects
  glow: {
    blue: '0 0 20px rgba(59, 130, 246, 0.15)',
    violet: '0 0 20px rgba(139, 92, 246, 0.15)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.15)',
    emerald: '0 0 20px rgba(16, 185, 129, 0.15)',
  },

  // Studio-specific accent colors
  studio: {
    planner: '#3B82F6',
    templates: '#8B5CF6',
    canvas: '#6366F1',
    brand: '#EC4899',
    components: '#F59E0B',
    design: '#06B6D4',
    workflow: '#10B981',
    pages: '#3B82F6',
    code: '#64748B',
    handoff: '#94A3B8',
    graphics: '#EC4899',
    analytics: '#8B5CF6',
    tasks: '#F59E0B',
    approvals: '#10B981',
    notifications: '#F43F5E',
    releases: '#06B6D4',
    testing: '#F59E0B',
    controlTower: '#3B82F6',
    graphExplorer: '#6366F1',
  },
} as const

export type StudioName = keyof typeof colors.studio
