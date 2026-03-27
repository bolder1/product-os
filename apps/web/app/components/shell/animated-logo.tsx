'use client'

import { motion } from 'framer-motion'

interface AnimatedLogoProps {
  size?: 'compact' | 'expanded'
}

export function AnimatedLogo({ size = 'compact' }: AnimatedLogoProps) {
  const dim = size === 'compact' ? 32 : 40
  const scale = dim / 40

  return (
    <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connection lines */}
      <motion.line
        x1="12" y1="12" x2="28" y2="12"
        stroke="#3B82F6"
        strokeWidth={1.5}
        strokeOpacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.line
        x1="28" y1="12" x2="20" y2="28"
        stroke="#3B82F6"
        strokeWidth={1.5}
        strokeOpacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
      <motion.line
        x1="20" y1="28" x2="12" y2="12"
        stroke="#3B82F6"
        strokeWidth={1.5}
        strokeOpacity={0.4}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />

      {/* Node 1 — top-left */}
      <motion.circle
        cx="12" cy="12" r="3.5"
        fill="#3B82F6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Node 2 — top-right */}
      <motion.circle
        cx="28" cy="12" r="3.5"
        fill="#8B5CF6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
      />

      {/* Node 3 — bottom-center */}
      <motion.circle
        cx="20" cy="28" r="3.5"
        fill="#06B6D4"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 },
        }}
      />
    </svg>
  )
}
