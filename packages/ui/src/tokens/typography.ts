/**
 * Editorial typography scale — aligns with CSS vars in globals.css.
 * Prefer the .t-* utility classes or CSS vars over hardcoded sizes.
 */
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "'Fraunces', 'Iowan Old Style', 'Palatino', Georgia, serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },

  fontSize: {
    caption: ['0.75rem',    { lineHeight: '1.4' }],   // 12px
    label:   ['0.8125rem',  { lineHeight: '1.45' }],  // 13px
    body:    ['0.9375rem',  { lineHeight: '1.55' }],  // 15px — base
    h3:      ['1.125rem',   { lineHeight: '1.4' }],   // 18px
    h2:      ['1.5rem',     { lineHeight: '1.3' }],   // 24px
    h1:      ['2rem',       { lineHeight: '1.2' }],   // 32px
    display: ['3rem',       { lineHeight: '1.1' }],   // 48px
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
  },

  letterSpacing: {
    display: '-0.025em',
    h1:      '-0.02em',
    h2:      '-0.015em',
    h3:      '-0.01em',
    body:    '-0.005em',
    eyebrow:  '0.08em',
  },

  lineHeight: {
    display: 1.1,
    h1: 1.2,
    h2: 1.3,
    h3: 1.4,
    body: 1.55,
    label: 1.45,
    caption: 1.4,
  },
} as const
