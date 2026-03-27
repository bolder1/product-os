export const animation = {
  // Easing curves
  easing: {
    default: [0.16, 1, 0.3, 1] as const,   // ease-out-expo
    smooth: [0.4, 0, 0.2, 1] as const,      // ease-in-out
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    sharp: [0.4, 0, 0.6, 1] as const,
  },

  // Duration
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    slower: 0.6,
  },

  // Spring configs for Framer Motion
  spring: {
    snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
    gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
    slow: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
} as const

// Framer Motion page transition variants
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animation.duration.normal,
      ease: animation.easing.default,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: animation.duration.fast,
      ease: animation.easing.sharp,
    },
  },
} as const

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animation.duration.normal,
      ease: animation.easing.default,
    },
  },
} as const

// Micro interaction variants
export const microInteraction = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
  hoverGlow: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
  },
} as const
