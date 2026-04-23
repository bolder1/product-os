'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Database,
  Palette,
  Layers,
  PenTool,
  Volume2,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpstreamDep {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  href: string
  satisfied: boolean
}

export interface ContextChip {
  label: string
  source: string
  version?: number
  color: string
}

// ---------------------------------------------------------------------------
// Pre-built dep configs
// ---------------------------------------------------------------------------

export function brandDep(orgSlug: string, productSlug: string, satisfied = false): UpstreamDep {
  return {
    key: 'brand',
    label: 'Brand Tokens',
    description: 'Color palette, typography, spacing and token system',
    icon: <Palette size={16} />,
    color: '#EC4899',
    href: `/${orgSlug}/${productSlug}/brand`,
    satisfied,
  }
}

export function brandVoiceDep(orgSlug: string, productSlug: string, satisfied = false): UpstreamDep {
  return {
    key: 'brand-voice',
    label: 'Brand Voice',
    description: 'Personality, tone sliders and copy guidelines',
    icon: <Volume2 size={16} />,
    color: '#8B5CF6',
    href: `/${orgSlug}/${productSlug}/brand/voice`,
    satisfied,
  }
}

export function componentsDep(orgSlug: string, productSlug: string, satisfied = false): UpstreamDep {
  return {
    key: 'components',
    label: 'Components',
    description: 'Reusable UI component library',
    icon: <Layers size={16} />,
    color: '#6366F1',
    href: `/${orgSlug}/${productSlug}/components`,
    satisfied,
  }
}

export function designDep(orgSlug: string, productSlug: string, satisfied = false): UpstreamDep {
  return {
    key: 'design',
    label: 'Design Screens',
    description: 'User flows and screen designs',
    icon: <PenTool size={16} />,
    color: '#3B82F6',
    href: `/${orgSlug}/${productSlug}/design`,
    satisfied,
  }
}

export function memoryDep(orgSlug: string, productSlug: string, satisfied = false): UpstreamDep {
  return {
    key: 'memory',
    label: 'Product Memory',
    description: 'Uploaded documents and research',
    icon: <Database size={16} />,
    color: '#8B5CF6',
    href: `/${orgSlug}/${productSlug}/memory`,
    satisfied,
  }
}

// ---------------------------------------------------------------------------
// Full empty state — shown when studio has NO data and upstream is missing
// ---------------------------------------------------------------------------

interface FullEmptyStateProps {
  studioLabel: string
  studioColor: string
  studioIcon: React.ReactNode
  headline: string
  subline: string
  deps: UpstreamDep[]
  planModeHref: string
}

export function FullEmptyState({
  studioLabel,
  studioColor,
  studioIcon,
  headline,
  subline,
  deps,
  planModeHref,
}: FullEmptyStateProps) {
  const unsatisfied = deps.filter((d) => !d.satisfied)
  const allSatisfied = unsatisfied.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center h-full px-8 py-16 text-center"
    >
      {/* Studio icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: `${studioColor}18`, border: `1.5px solid ${studioColor}30` }}
      >
        <span style={{ color: studioColor }}>{studioIcon}</span>
      </div>

      <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">{headline}</h2>
      <p className="text-sm text-[#64748B] max-w-md leading-relaxed mb-8">{subline}</p>

      {/* Upstream deps */}
      {deps.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <p className="text-xs text-[#475569] uppercase tracking-wide font-semibold mb-3">
            {allSatisfied ? 'Context ready' : 'Set these up first'}
          </p>
          <div className="flex flex-col gap-2">
            {deps.map((dep) => (
              <Link
                key={dep.key}
                href={dep.satisfied ? '#' : dep.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  dep.satisfied
                    ? 'border-[#10B981]/20 bg-[#10B981]/05 cursor-default'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14]'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${dep.color}18`, color: dep.color }}
                >
                  {dep.satisfied ? <CheckCircle2 size={16} className="text-[#10B981]" /> : dep.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-medium ${dep.satisfied ? 'text-[#10B981]' : 'text-[#F1F5F9]'}`}>
                    {dep.label}
                  </p>
                  <p className="text-xs text-[#64748B] truncate">{dep.description}</p>
                </div>
                {!dep.satisfied && <ArrowRight size={14} className="text-[#64748B] shrink-0" />}
                {dep.satisfied && (
                  <span className="text-[10px] font-semibold text-[#10B981] uppercase tracking-wide shrink-0">Ready</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={planModeHref}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
        >
          <Zap size={14} />
          Run Plan Mode
        </Link>
        {unsatisfied[0] && (
          <Link
            href={unsatisfied[0].href}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/[0.08] text-[#94A3B8] hover:bg-white/[0.04] transition-colors"
            style={{ borderColor: `${unsatisfied[0].color}30`, color: unsatisfied[0].color }}
          >
            {unsatisfied[0].icon}
            Set up {unsatisfied[0].label}
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Context banner — shown at top of studio when upstream data IS present
// Optionally shows "missing" chips for partially satisfied deps
// ---------------------------------------------------------------------------

interface ContextBannerProps {
  chips: ContextChip[]
  missing?: UpstreamDep[]
  className?: string
}

export function ContextBanner({ chips, missing = [], className = '' }: ContextBannerProps) {
  if (chips.length === 0 && missing.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] flex-wrap ${className}`}
    >
      {/* "Context used" label */}
      {chips.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 text-[10px] text-[#475569] font-semibold uppercase tracking-wide shrink-0">
            <Brain size={11} />
            Context
          </div>
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${chip.color}18`, color: chip.color }}
            >
              <CheckCircle2 size={9} />
              {chip.label}
              {chip.version !== undefined && <span className="opacity-60">v{chip.version}</span>}
            </span>
          ))}
        </>
      )}

      {/* Missing deps */}
      {missing.length > 0 && (
        <>
          {chips.length > 0 && <div className="w-px h-3 bg-white/[0.08] mx-1" />}
          <AlertCircle size={11} className="text-[#F59E0B]" />
          {missing.map((dep) => (
            <Link
              key={dep.key}
              href={dep.href}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#F59E0B18', color: '#F59E0B' }}
            >
              {dep.icon}
              Set up {dep.label}
              <ArrowRight size={9} />
            </Link>
          ))}
        </>
      )}

      {/* AI-powered badge */}
      {chips.length > 0 && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#475569]">
          <Sparkles size={10} className="text-[#8B5CF6]" />
          AI-powered suggestions enabled
        </span>
      )}
    </motion.div>
  )
}
