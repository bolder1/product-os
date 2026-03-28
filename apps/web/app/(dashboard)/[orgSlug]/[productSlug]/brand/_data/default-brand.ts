// ── Default Brand Configuration ──
// All brand tokens for the Brand Builder studio

export interface ColorToken {
  name: string
  base: string
  scale: Record<string, string>
}

export interface ColorGroup {
  id: string
  label: string
  semantic: string
  token: ColorToken
}

export interface TypeScaleStep {
  id: string
  label: string
  size: number
  weight: number
  lineHeight: number
  letterSpacing: number
  preview: string
}

export interface SpacingToken {
  key: string
  multiplier: number
  value: number
}

export interface RadiusToken {
  id: string
  label: string
  value: number
}

export interface ShadowToken {
  id: string
  label: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
}

export interface GradientStop {
  color: string
  position: number
}

export interface GradientToken {
  id: string
  label: string
  direction: number
  stops: GradientStop[]
}

export interface EffectsConfig {
  shadows: ShadowToken[]
  glowEnabled: boolean
  glowColor: string
  glowIntensity: number
  backdropBlur: number
  gradients: GradientToken[]
}

export interface TypographyConfig {
  headingFont: string
  bodyFont: string
  codeFont: string
  baseSize: number
  scale: TypeScaleStep[]
}

export interface SpacingConfig {
  baseUnit: number
  scale: SpacingToken[]
  radii: RadiusToken[]
}

export interface BrandConfig {
  colorGroups: ColorGroup[]
  typography: TypographyConfig
  spacing: SpacingConfig
  effects: EffectsConfig
}

// ── Helpers ──

function generateScale(base: string): Record<string, string> {
  // Simple scale generation from base color
  const hex = base.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const lighten = (amount: number) => {
    const lr = Math.min(255, Math.round(r + (255 - r) * amount))
    const lg = Math.min(255, Math.round(g + (255 - g) * amount))
    const lb = Math.min(255, Math.round(b + (255 - b) * amount))
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
  }

  const darken = (amount: number) => {
    const dr = Math.max(0, Math.round(r * (1 - amount)))
    const dg = Math.max(0, Math.round(g * (1 - amount)))
    const db = Math.max(0, Math.round(b * (1 - amount)))
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
  }

  return {
    '50': lighten(0.92),
    '100': lighten(0.84),
    '200': lighten(0.68),
    '300': lighten(0.5),
    '400': lighten(0.3),
    '500': base,
    '600': darken(0.15),
    '700': darken(0.3),
    '800': darken(0.45),
    '900': darken(0.6),
    '950': darken(0.75),
  }
}

export { generateScale }

// ── Default Color Groups ──

const defaultColorGroups: ColorGroup[] = [
  {
    id: 'primary',
    label: 'Primary',
    semantic: 'Main brand color, CTAs, links',
    token: { name: 'primary', base: '#3B82F6', scale: generateScale('#3B82F6') },
  },
  {
    id: 'secondary',
    label: 'Secondary',
    semantic: 'Supporting actions, secondary buttons',
    token: { name: 'secondary', base: '#8B5CF6', scale: generateScale('#8B5CF6') },
  },
  {
    id: 'accent',
    label: 'Accent',
    semantic: 'Highlights, decorative elements',
    token: { name: 'accent', base: '#06B6D4', scale: generateScale('#06B6D4') },
  },
  {
    id: 'neutral',
    label: 'Neutral',
    semantic: 'Backgrounds, borders, muted text',
    token: { name: 'neutral', base: '#64748B', scale: generateScale('#64748B') },
  },
  {
    id: 'success',
    label: 'Success',
    semantic: 'Confirmations, positive states',
    token: { name: 'success', base: '#10B981', scale: generateScale('#10B981') },
  },
  {
    id: 'warning',
    label: 'Warning',
    semantic: 'Caution states, attention required',
    token: { name: 'warning', base: '#F59E0B', scale: generateScale('#F59E0B') },
  },
  {
    id: 'error',
    label: 'Error',
    semantic: 'Destructive actions, errors',
    token: { name: 'error', base: '#F43F5E', scale: generateScale('#F43F5E') },
  },
  {
    id: 'info',
    label: 'Info',
    semantic: 'Informational, tooltips, notices',
    token: { name: 'info', base: '#06B6D4', scale: generateScale('#06B6D4') },
  },
]

// ── Default Typography ──

const defaultTypography: TypographyConfig = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  codeFont: 'JetBrains Mono',
  baseSize: 16,
  scale: [
    { id: 'display', label: 'Display', size: 60, weight: 700, lineHeight: 1.1, letterSpacing: -0.02, preview: 'Display Heading' },
    { id: 'h1', label: 'Heading 1', size: 48, weight: 700, lineHeight: 1.15, letterSpacing: -0.02, preview: 'Heading One' },
    { id: 'h2', label: 'Heading 2', size: 36, weight: 600, lineHeight: 1.2, letterSpacing: -0.01, preview: 'Heading Two' },
    { id: 'h3', label: 'Heading 3', size: 30, weight: 600, lineHeight: 1.25, letterSpacing: -0.01, preview: 'Heading Three' },
    { id: 'h4', label: 'Heading 4', size: 24, weight: 600, lineHeight: 1.3, letterSpacing: 0, preview: 'Heading Four' },
    { id: 'h5', label: 'Heading 5', size: 20, weight: 600, lineHeight: 1.35, letterSpacing: 0, preview: 'Heading Five' },
    { id: 'h6', label: 'Heading 6', size: 18, weight: 600, lineHeight: 1.4, letterSpacing: 0, preview: 'Heading Six' },
    { id: 'body-lg', label: 'Body Large', size: 18, weight: 400, lineHeight: 1.6, letterSpacing: 0, preview: 'Large body text for emphasis.' },
    { id: 'body', label: 'Body', size: 16, weight: 400, lineHeight: 1.6, letterSpacing: 0, preview: 'Default body text for content.' },
    { id: 'body-sm', label: 'Body Small', size: 14, weight: 400, lineHeight: 1.5, letterSpacing: 0, preview: 'Small body text for details.' },
    { id: 'caption', label: 'Caption', size: 12, weight: 500, lineHeight: 1.4, letterSpacing: 0.01, preview: 'Caption text for labels.' },
    { id: 'overline', label: 'Overline', size: 11, weight: 600, lineHeight: 1.4, letterSpacing: 0.08, preview: 'OVERLINE TEXT' },
  ],
}

// ── Default Spacing ──

const spacingMultipliers = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

const defaultSpacing: SpacingConfig = {
  baseUnit: 4,
  scale: spacingMultipliers.map((m) => ({
    key: String(m),
    multiplier: m,
    value: m * 4,
  })),
  radii: [
    { id: 'sm', label: 'Small', value: 4 },
    { id: 'md', label: 'Medium', value: 8 },
    { id: 'lg', label: 'Large', value: 12 },
    { id: 'xl', label: 'Extra Large', value: 16 },
    { id: 'full', label: 'Full', value: 9999 },
  ],
}

// ── Default Effects ──

const defaultEffects: EffectsConfig = {
  shadows: [
    { id: 'sm', label: 'Small', offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: 'rgba(0,0,0,0.12)' },
    { id: 'md', label: 'Medium', offsetX: 0, offsetY: 4, blur: 12, spread: -2, color: 'rgba(0,0,0,0.15)' },
    { id: 'lg', label: 'Large', offsetX: 0, offsetY: 12, blur: 32, spread: -4, color: 'rgba(0,0,0,0.2)' },
    { id: 'xl', label: 'Extra Large', offsetX: 0, offsetY: 24, blur: 48, spread: -8, color: 'rgba(0,0,0,0.25)' },
  ],
  glowEnabled: true,
  glowColor: '#3B82F6',
  glowIntensity: 20,
  backdropBlur: 12,
  gradients: [
    {
      id: 'brand',
      label: 'Brand Gradient',
      direction: 135,
      stops: [
        { color: '#3B82F6', position: 0 },
        { color: '#8B5CF6', position: 100 },
      ],
    },
    {
      id: 'accent',
      label: 'Accent Gradient',
      direction: 90,
      stops: [
        { color: '#06B6D4', position: 0 },
        { color: '#3B82F6', position: 100 },
      ],
    },
  ],
}

// ── Assembled Default ──

export const defaultBrandConfig: BrandConfig = {
  colorGroups: defaultColorGroups,
  typography: defaultTypography,
  spacing: defaultSpacing,
  effects: defaultEffects,
}

// ── Font Options ──

export const fontOptions = [
  'Inter',
  'Plus Jakarta Sans',
  'DM Sans',
  'Poppins',
  'Space Grotesk',
  'Manrope',
]

export const codeFontOptions = [
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
]

// ── AI Palette Suggestions ──

export interface AIPaletteSuggestion {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    neutral: string
    success: string
    warning: string
  }
}

export const aiPaletteSuggestions: AIPaletteSuggestion[] = [
  {
    id: 'modern-saas',
    name: 'Modern SaaS',
    description: 'Clean, professional, trust-inspiring',
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      accent: '#0EA5E9',
      neutral: '#475569',
      success: '#059669',
      warning: '#D97706',
    },
  },
  {
    id: 'warm-friendly',
    name: 'Warm & Friendly',
    description: 'Approachable, human, delightful',
    colors: {
      primary: '#F97316',
      secondary: '#EC4899',
      accent: '#FBBF24',
      neutral: '#78716C',
      success: '#22C55E',
      warning: '#EAB308',
    },
  },
  {
    id: 'bold-technical',
    name: 'Bold & Technical',
    description: 'Powerful, precise, cutting-edge',
    colors: {
      primary: '#DC2626',
      secondary: '#1D4ED8',
      accent: '#14B8A6',
      neutral: '#334155',
      success: '#16A34A',
      warning: '#CA8A04',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal & Clean',
    description: 'Elegant, spacious, refined',
    colors: {
      primary: '#18181B',
      secondary: '#71717A',
      accent: '#6366F1',
      neutral: '#A1A1AA',
      success: '#34D399',
      warning: '#FCD34D',
    },
  },
]
