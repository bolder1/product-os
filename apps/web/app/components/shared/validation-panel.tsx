'use client'

import { useState, useMemo } from 'react'
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
  if (score < 40) return 'var(--color-error)'
  if (score <= 70) return 'var(--color-warning)'
  return 'var(--color-success)'
}

// ---------------------------------------------------------------------------
// Readiness Ring (pure CSS, no framer-motion)
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
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold"
          style={{ color }}
        >
          {score}%
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Overall Readiness</span>
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
}: {
  label: string
  score: number
  icon: typeof MapPin
}) {
  const color = scoreColor(score)

  return (
    <div className="flex items-center gap-3 group">
      <div className="p-1 rounded-sm bg-[var(--bg-inset)]">
        <Icon size={12} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
          <span className="text-[10px] font-medium" style={{ color }}>
            {score}%
          </span>
        </div>
        <div className="h-1 rounded-sm bg-[var(--bg-inset)] overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{ backgroundColor: color, width: `${score}%` }}
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
    info: { icon: Info, color: 'text-[var(--accent-text)]', bgClass: 'bg-[var(--accent)]/10' },
  }

  const config = severityConfig[issue.severity]
  const SeverityIcon = config.icon

  return (
    <div className="flex items-start gap-2.5 px-3 py-2 rounded-sm bg-[var(--bg-inset)] hover:bg-[var(--surface-hover)] transition-colors group">
      <div className={`p-1 rounded-sm ${config.bgClass} mt-0.5`}>
        <SeverityIcon size={11} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[var(--text-primary)] leading-relaxed">{issue.title}</p>
        {issue.description && (
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
            {issue.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="tool-badge text-[10px] bg-[var(--accent)]/10 text-[var(--accent-text)] border-[var(--accent)]/20">
            {issue.studio}
          </span>
          {issue.suggestion && (
            <span className="text-[10px] text-[var(--text-tertiary)] truncate">{issue.suggestion}</span>
          )}
        </div>
      </div>
      <button className="tool-btn flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-100 shrink-0">
        <Wrench size={10} />
        Fix
      </button>
    </div>
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
    info: 'text-[var(--accent-text)]',
  }

  if (issues.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-1 py-1.5 text-left hover:bg-[var(--surface-hover)] rounded-sm transition-colors"
      >
        <ChevronRight
          size={12}
          className={`text-[var(--text-tertiary)] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className={`text-[11px] font-medium ${colors[severity]}`}>
          {labels[severity]}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">{issues.length}</span>
      </button>
      {open && (
        <div className="space-y-1 mt-1">
          {issues.map((issue) => (
            <IssueItem key={issue.id} issue={issue} />
          ))}
        </div>
      )}
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

export function ValidationTrigger({ productId, compact }: { productId: string; compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const { readiness, errorCount, warningCount } = useValidation(productId)

  return (
    <>
      {compact ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-[10px] leading-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span style={{ color: scoreColor(readiness.overall) }} className="font-medium">
            {readiness.overall}%
          </span>
          {errorCount > 0 && (
            <span className="text-red-400">{errorCount}E</span>
          )}
          {warningCount > 0 && (
            <span className="text-yellow-400">{warningCount}W</span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="tool-btn flex items-center gap-2 px-2.5 py-1.5"
        >
          <ShieldCheck size={13} style={{ color: scoreColor(readiness.overall) }} />
          <span className="text-[11px] font-medium" style={{ color: scoreColor(readiness.overall) }}>
            {readiness.overall}%
          </span>
          {(errorCount > 0 || warningCount > 0) && (
            <span className="flex items-center gap-1 ml-1">
              {errorCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                  <AlertTriangle size={10} />
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
                  <AlertCircle size={10} />
                  {warningCount}
                </span>
              )}
            </span>
          )}
        </button>
      )}
      <ValidationPanelInner
        productId={productId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
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

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-[400px] flex flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-[var(--accent-text)]" />
            <h2 className="text-[13px] font-medium text-[var(--text-primary)]">Product Readiness</h2>
          </div>
          <button
            onClick={onClose}
            className="tool-btn p-1"
          >
            <X size={13} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          {/* Overall readiness ring */}
          <div className="flex justify-center py-6 border-b border-[var(--border-default)]">
            <ReadinessRing score={readiness.overall} />
          </div>

          {/* Readiness breakdown */}
          <div className="px-3 py-4 border-b border-[var(--border-default)]">
            <h3 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-3">
              Readiness Breakdown
            </h3>
            <div className="space-y-3">
              {AREA_CONFIG.map((area) => (
                <ReadinessBar
                  key={area.key}
                  label={area.label}
                  score={readiness[area.key]}
                  icon={area.icon}
                />
              ))}
            </div>
          </div>

          {/* Issues list */}
          <div className="px-3 py-4">
            <h3 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-3">
              Validation Issues
            </h3>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-500/10 mb-3">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">All checks passed</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
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
        <div className="px-3 py-2 border-t border-[var(--border-default)] bg-[var(--bg-inset)]">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
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
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
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
      </aside>
    </>
  )
}
