'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Mail, ArrowRight, Star, Bell } from 'lucide-react'
import type { BrandConfig } from '../_data/default-brand'

interface BrandPreviewProps {
  brandData: BrandConfig
}

export default function BrandPreview({ brandData }: BrandPreviewProps) {
  const [darkMode, setDarkMode] = useState(true)

  const { colorGroups, typography, spacing, effects } = brandData

  // Extract base colors
  const getColor = (id: string) =>
    colorGroups.find((g) => g.id === id)?.token.base ?? 'var(--text-tertiary)'
  const getScale = (id: string, shade: string) =>
    colorGroups.find((g) => g.id === id)?.token.scale[shade] ?? 'var(--text-tertiary)'

  const primary = getColor('primary')
  const secondary = getColor('secondary')
  const accent = getColor('accent')
  const success = getColor('success')
  const warning = getColor('warning')
  const error = getColor('error')

  // R20: preview-simulation palette — this component renders a *simulated*
  // dark / light canvas to let a user preview their brand swatches in both
  // modes regardless of the app's active theme. These are not chrome tokens
  // and intentionally do not follow the active theme; they're the neutral
  // scaffold the brand swatches sit on top of.
  const bgColor = darkMode ? '#0F172A' : '#FFFFFF'
  const surfaceColor = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const surfaceBorder = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  // eslint-disable-next-line no-hardcoded-hex -- preview simulation (slate-100 / slate-900)
  const textPrimary = darkMode ? '#F1F5F9' : '#0F172A'
  // eslint-disable-next-line no-hardcoded-hex -- preview simulation (slate-400 / slate-500)
  const textSecondary = darkMode ? '#94A3B8' : '#64748B'
  // eslint-disable-next-line no-hardcoded-hex -- preview simulation (slate-500 / slate-400)
  const textMuted = darkMode ? '#64748B' : '#94A3B8'

  const headingFont = typography.headingFont
  const bodyFont = typography.bodyFont

  const radiusMd = spacing.radii.find((r) => r.id === 'md')?.value ?? 8
  const radiusLg = spacing.radii.find((r) => r.id === 'lg')?.value ?? 12
  const radiusXl = spacing.radii.find((r) => r.id === 'xl')?.value ?? 16

  // Gradient from effects
  const gradient = effects.gradients[0]
  const gradientCSS = gradient
    ? `linear-gradient(${gradient.direction}deg, ${gradient.stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`
    : `linear-gradient(135deg, ${primary}, ${secondary})`

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Live Preview</h3>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-white/[0.03] border border-white/[0.08]">
          <button
            onClick={() => setDarkMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              darkMode ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Moon className="w-3 h-3" />
            Dark
          </button>
          <button
            onClick={() => setDarkMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !darkMode ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Sun className="w-3 h-3" />
            Light
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      <motion.div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: bgColor,
          borderColor: surfaceBorder,
        }}
        layout
      >
        <div className="p-6 space-y-6">
          {/* Color Palette Dots */}
          <div className="flex items-center gap-2">
            {colorGroups.map((g) => (
              <motion.div
                key={g.id}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: g.token.base }}
                whileHover={{ scale: 1.2 }}
                title={g.label}
              />
            ))}
          </div>

          {/* Sample Card */}
          <motion.div
            className="p-5 border"
            style={{
              backgroundColor: surfaceColor,
              borderColor: surfaceBorder,
              borderRadius: `${radiusXl}px`,
            }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2
              style={{
                fontFamily: headingFont,
                fontSize: '24px',
                fontWeight: 700,
                lineHeight: 1.3,
                color: textPrimary,
                marginBottom: '8px',
              }}
            >
              Welcome to Product OS
            </h2>
            <p
              style={{
                fontFamily: bodyFont,
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: textSecondary,
                marginBottom: '16px',
              }}
            >
              Build, manage, and scale your products with an intelligent operating system
              that adapts to your workflow.
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
                style={{
                  background: gradientCSS,
                  borderRadius: `${radiusMd}px`,
                }}
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 text-sm font-medium border"
                style={{
                  color: textSecondary,
                  borderColor: surfaceBorder,
                  borderRadius: `${radiusMd}px`,
                  backgroundColor: 'transparent',
                }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${primary}20`,
                color: primary,
                borderRadius: `${radiusMd}px`,
              }}
            >
              <Star className="w-3 h-3" />
              Featured
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${success}20`,
                color: success,
                borderRadius: `${radiusMd}px`,
              }}
            >
              Active
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${warning}20`,
                color: warning,
                borderRadius: `${radiusMd}px`,
              }}
            >
              <Bell className="w-3 h-3" />
              Pending
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${error}20`,
                color: error,
                borderRadius: `${radiusMd}px`,
              }}
            >
              Overdue
            </span>
          </div>

          {/* Input Field */}
          <div>
            <label
              style={{
                fontFamily: bodyFont,
                fontSize: '12px',
                fontWeight: 500,
                color: textMuted,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div
              className="flex items-center border"
              style={{
                backgroundColor: surfaceColor,
                borderColor: surfaceBorder,
                borderRadius: `${radiusMd}px`,
              }}
            >
              <div className="px-3 py-2.5 flex items-center">
                <Mail className="w-4 h-4" style={{ color: textMuted }} />
              </div>
              <span
                style={{
                  fontFamily: bodyFont,
                  fontSize: '14px',
                  color: textMuted,
                  padding: '10px 0',
                }}
              >
                you@example.com
              </span>
            </div>
          </div>

          {/* Glass Card Preview */}
          <div className="relative h-28 rounded-xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{ background: gradientCSS, opacity: 0.4 }}
            />
            <div
              className="absolute inset-3 rounded-lg border flex items-center justify-center"
              style={{
                backdropFilter: `blur(${effects.backdropBlur}px)`,
                WebkitBackdropFilter: `blur(${effects.backdropBlur}px)`,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}
            >
              <span
                style={{
                  fontFamily: headingFont,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: textPrimary,
                }}
              >
                Glass Morphism Surface
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
