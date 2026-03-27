export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },

  fontSize: {
    '2xs': ['0.6875rem', { lineHeight: '1rem' }],    // 11px
    xs: ['0.75rem', { lineHeight: '1rem' }],          // 12px
    sm: ['0.8125rem', { lineHeight: '1.25rem' }],     // 13px
    base: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
    md: ['1rem', { lineHeight: '1.5rem' }],            // 16px
    lg: ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
    xl: ['1.5rem', { lineHeight: '2rem' }],            // 24px
    '2xl': ['2rem', { lineHeight: '2.5rem' }],         // 32px
    '3xl': ['3rem', { lineHeight: '3.5rem' }],         // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const
