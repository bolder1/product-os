'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Wrench,
  MapPin,
  Palette,
  Blocks,
  PenTool,
  GitBranch,
  FileText,
  Code,
  TestTube,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import {
  useValidation,
  type ValidationIssue,
  type ValidationSeverity,
  type ReadinessScore,
} from '../../lib/validation-engine'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AREA_CONFIG: {
  key: keyof Omit<ReadinessScore, 'overall'>
  label: string
  icon: typeof MapPin
}[] = [
  { key: 'plan', label: 'Plan', icon: MapPin },
  { key: 'brand', label: 'Brand', icon: Palette },
  { key: 'components', label: 'Components', icon: Blocks },
  { key: 'design', label: 'Design', icon: PenTool },
  { key: 'workflows', label: 'Workflows', icon: GitBranch },
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'code', label: 'Code', icon: Code },
  { key: 'testing', label: 'Testing', icon: TestTube },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function scoreColor(score: number): string {
  if (score < 40) return '#EF4444'
  if (score <= 70) return '#EAB308'
  return '#22C55E'
}

// ---------------------------------------------------------------------------
// Circular Progress Ring
// ---------------------------------------------------------------------------

function ReadinessRing({ score }: { score: number }) {
  const radius = 52
  const stroke = 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px]">
      <svg width={140} height={140} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <motion.circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
        >
          {score}%
        </motion.span>
        <span className="text-[0.625rem] text-[#64748B] mt-0.5">Overall Readiness</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Readiness Bar
// ---------------------------------------------------------------------------

function ReadinessBar({
  label,
  score,
  icon: Icon,
  delay,
}: {
  label: string
  score: number
  icon: typeof MapPin
  delay: number
}) {
  const color = scoreColor(score)

  return (
    <div className="flex items-center gap-3 group">
      <div className="p-1 rounded bg-white/[0.03]">
        <Icon size={13} className="text-[#64748B] group-hover:text-[#94A3B8] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.6875rem] text-[#94A3B8]">{label}</span>
          <span className="text-[0.625rem] font-medium" style={{ color }}>
            {score}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Issue Item
// ---------------------------------------------------------------------------

function IssueItem({ issue }: { issue: ValidationIssue }) {
  const severityConfig: Record<
    ValidationSeverity,
    { icon: typeof AlertTriangle; color: string; bgClass: string }
  > = {
    error: { icon: AlertTriangle, color: 'text-red-400', bgClass: 'bg-red-500/10' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bgClass: 'bg-yellow-500/10' },
    info: { icon: Info, color: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  }

  const config = severityConfig[issue.severity]
  const SeverityIcon = config.icon

  return (
    <motion.div
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className={`p-1 rounded ${config.bgClass} mt-0.5`}>
        <SeverityIcon size={12} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#F1F5F9] leading-relaxed">{issue.title}</p>
        {issue.description && (
          <p className="text-[0.625rem] text-[#64748B] mt-0.5 line-clamp-2">
            {issue.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.5625rem] font-medium bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
            {issue.studio}
          </span>
          {issue.suggestion && (
            <span className="text-[0.5625rem] text-[#475569] truncate">{issue.suggestion}</span>
          )}
        </div>
      </div>
      <button className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100 shrink-0">
        <Wrench size={10} />
        Fix
      </button>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Issue Section
// ---------------------------------------------------------------------------

function IssueSection({
  severity,
  issues,
  defaultOpen,
}: {
  severity: ValidationSeverity
  issues: ValidationIssue[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const labels: Record<ValidationSeverity, string> = {
    error: 'Errors',
    warning: 'Warnings',
    info: 'Info',
  }

  const colors: Record<ValidationSeverity, string> = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  }

  if (issues.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-1 py-1.5 text-left hover:bg-white/[0.03] rounded transition-colors"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={12} className="text-[#64748B]" />
        </motion.div>
        <span className={`text-[0.6875rem] font-medium ${colors[severity]}`}>
          {labels[severity]}
        </span>
        <span className="ml-auto text-[0.625rem] text-[#475569]">{issues.length}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="space-y-1.5 mt-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {issues.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

interface ValidationPanelProps {
  productId: string
}

export function ValidationPanel({ productId }: ValidationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ValidationPanelInner
      productId={productId}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}

// ---------------------------------------------------------------------------
// Trigger Button (exported standalone)
// ---------------------------------------------------------------------------

export function ValidationTrigger({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { readiness, errorCount, warningCount } = useValidation(productId)

  return (
    <>
      <ValidationTriggerButton
        score={readiness.overall}
        errorCount={errorCount}
        warningCount={warningCount}
        onClick={() => setIsOpen(true)}
      />
      <ValidationPanelInner
        productId={productId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Trigger Button (visual)
// ---------------------------------------------------------------------------

function ValidationTriggerButton({
  score,
  errorCount,
  warningCount,
  onClick,
}: {
  score: number
  errorCount: number
  warningCount: number
  onClick: () => void
}) {
  const color = scoreColor(score)
  const hasIssues = errorCount + warningCount > 0

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <ShieldCheck size={14} style={{ color }} />
      <span className="text-xs font-medium" style={{ color }}>
        {score}%
      </span>
      {hasIssues && (
        <span className="flex items-center gap-1 ml-1">
          {errorCount > 0 && (
            <span className="flex items-center gap-0.5 text-[0.625rem] text-red-400">
              <AlertTriangle size={10} />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-0.5 text-[0.625rem] text-yellow-400">
              <AlertCircle size={10} />
              {warningCount}
            </span>
          )}
        </span>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Inner Panel (used by both ValidationPanel and ValidationTrigger)
// ---------------------------------------------------------------------------

function ValidationPanelInner({
  productId,
  isOpen,
  onClose,
}: {
  productId: string
  isOpen: boolean
  onClose: () => void
}) {
  const { issues, readiness, errorCount, warningCount, infoCount } = useValidation(productId)

  const errors = useMemo(() => issues.filter((i) => i.severity === 'error'), [issues])
  const warnings = useMemo(() => issues.filter((i) => i.severity === 'warning'), [issues])
  const infos = useMemo(() => issues.filter((i) => i.severity === 'info'), [issues])

  const totalChecks = 10
  const passRate = Math.round(((totalChecks - issues.length) / totalChecks) * 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-[400px] flex flex-col border-l border-white/[0.08] bg-[#060918] shadow-2xl"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#6366F1]/10">
                  <ShieldCheck size={16} className="text-[#6366F1]" />
                </div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Product Readiness</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#64748B] hover:text-[#94A3B8]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto">
              {/* Overall readiness ring */}
              <div className="flex justify-center py-6 border-b border-white/[0.08]">
                <ReadinessRing score={readiness.overall} />
              </div>

              {/* Readiness breakdown */}
              <div className="px-4 py-4 border-b border-white/[0.08]">
                <h3 className="text-[0.6875rem] uppercase tracking-wider text-[#475569] font-medium mb-3">
                  Readiness Breakdown
                </h3>
                <div className="space-y-3">
                  {AREA_CONFIG.map((area, idx) => (
                    <ReadinessBar
                      key={area.key}
                      label={area.label}
                      score={readiness[area.key]}
                      icon={area.icon}
                      delay={idx * 0.05}
                    />
                  ))}
                </div>
              </div>

              {/* Issues list */}
              <div className="px-4 py-4">
                <h3 className="text-[0.6875rem] uppercase tracking-wider text-[#475569] font-medium mb-3">
                  Validation Issues
                </h3>
                {issues.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="p-3 rounded-xl bg-emerald-500/10 mb-3">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                    </div>
                    <p className="text-sm text-[#94A3B8]">All checks passed</p>
                    <p className="text-xs text-[#475569] mt-1">
                      Your product graph has no validation issues.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <IssueSection severity="error" issues={errors} defaultOpen={true} />
                    <IssueSection severity="warning" issues={warnings} defaultOpen={true} />
                    <IssueSection severity="info" issues={infos} defaultOpen={false} />
                  </div>
                )}
              </div>
            </div>

            {/* Footer stats */}
            <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.01]">
              <div className="flex items-center justify-between text-[0.625rem] text-[#475569]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {infoCount} info
                  </span>
                </div>
                <span>
                  Pass rate:{' '}
                  <span
                    className="font-medium"
                    style={{ color: scoreColor(Math.max(0, passRate)) }}
                  >
                    {Math.max(0, passRate)}%
                  </span>
                </span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
