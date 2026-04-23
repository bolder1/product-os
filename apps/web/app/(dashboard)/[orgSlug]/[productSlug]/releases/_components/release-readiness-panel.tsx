'use client'

import { useMemo } from 'react'
import { Rocket, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { useTaskStore, type Task } from '../../../../../lib/task-store'
import { useApprovalStore, type ApprovalRequest } from '../../../../../lib/approval-store'
import { useValidation } from '../../../../../lib/validation-engine'

export interface ReleaseReadinessPanelProps {
  productId: string
  releaseId?: string
  onDeploy?: (env: string) => void
}

interface SubScore {
  label: string
  score: number
  max: number
  color: string
}

function CircleProgress({ score }: { score: number }) {
  const radius = 44
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color =
    score >= 80
      ? 'var(--color-success, #10B981)'
      : score >= 50
      ? 'var(--color-warning, #F59E0B)'
      : 'var(--color-error, #F43F5E)'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
      <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          / 100
        </span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, max, color }: SubScore) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {score}/{max}
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }}
        />
      </div>
    </div>
  )
}

export function ReleaseReadinessPanel({ productId, onDeploy }: ReleaseReadinessPanelProps) {
  const tasks = useTaskStore((s: { tasks: Task[] }) => s.tasks)
  const approvals = useApprovalStore((s: { requests: ApprovalRequest[] }) => s.requests)
  const { readiness } = useValidation(productId)

  const { score, taskScore, approvalScore, validationScore, blockerDeduction, topIssues } =
    useMemo(() => {
      const productTasks = tasks.filter((t) => t.productId === productId)
      const done = productTasks.filter((t) => t.status === 'done').length
      const blocked = productTasks.filter((t) => t.status === 'blocked')
      const total = productTasks.length

      const taskPts = total > 0 ? Math.round((done / total) * 30) : 30
      const taskScore = taskPts

      const productApprovals = approvals.filter((a) => a.productId === productId)
      const approvedCount = productApprovals.filter((a) => a.status === 'approved').length
      const totalApprovals = productApprovals.length
      const approvalPts = totalApprovals > 0 ? Math.round((approvedCount / totalApprovals) * 25) : 25
      const approvalScore = approvalPts

      const validationPts = Math.round((readiness.overall / 100) * 25)
      const validationScore = validationPts

      const blockerPts = Math.min(blocked.length * 5, 20)
      const blockerDeduction = blockerPts

      const raw = taskPts + approvalPts + validationPts - blockerPts
      const score = Math.max(0, Math.min(100, raw))

      // Build top issues list
      const issues: string[] = []
      const pendingApprovals = productApprovals.filter((a) => a.status === 'pending')
      pendingApprovals.slice(0, 2).forEach((a) => issues.push(`Pending approval: ${a.title}`))
      blocked.slice(0, 2).forEach((t) => issues.push(`Blocked task: ${t.title}`))
      const notDone = productTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
      if (issues.length < 3 && notDone.length > 0) {
        notDone.slice(0, 3 - issues.length).forEach((t) => issues.push(`Open task: ${t.title}`))
      }

      return {
        score,
        taskScore,
        approvalScore,
        validationScore,
        blockerDeduction,
        topIssues: issues.slice(0, 3),
      }
    }, [tasks, approvals, readiness, productId])

  const scoreColor =
    score >= 80
      ? 'var(--color-success, #10B981)'
      : score >= 50
      ? 'var(--color-warning, #F59E0B)'
      : 'var(--color-error, #F43F5E)'

  const subScores: SubScore[] = [
    { label: 'Tasks', score: taskScore, max: 30, color: '#60A5FA' },
    { label: 'Approvals', score: approvalScore, max: 25, color: '#A78BFA' },
    { label: 'Validation', score: validationScore, max: 25, color: '#34D399' },
    {
      label: 'Blockers (deduction)',
      score: Math.max(0, 20 - blockerDeduction),
      max: 20,
      color: '#FB923C',
    },
  ]

  const envs = ['Draft', 'Staging', 'Production']

  return (
    <div
      className="rounded-xl border flex flex-col gap-5 p-5"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.03))',
        borderColor: 'var(--border-default, rgba(255,255,255,0.08))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Rocket size={13} style={{ color: 'var(--text-secondary)' }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Release Readiness
        </span>
        <span
          className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ color: scoreColor, background: `${scoreColor}18` }}
        >
          {score >= 80 ? 'Ready' : score >= 50 ? 'Almost Ready' : 'Not Ready'}
        </span>
      </div>

      {/* Score ring + bars */}
      <div className="flex items-center gap-6">
        <CircleProgress score={score} />
        <div className="flex-1 flex flex-col gap-2.5">
          {subScores.map((s) => (
            <ScoreBar key={s.label} {...s} />
          ))}
        </div>
      </div>

      {/* Blocking issues (only when score < 80) */}
      {score < 80 && topIssues.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Top Issues
          </span>
          {topIssues.map((issue, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]"
              style={{
                background: 'var(--bg-subtle, rgba(255,255,255,0.04))',
                color: 'var(--text-secondary)',
              }}
            >
              <AlertTriangle size={11} style={{ color: 'var(--color-warning, #F59E0B)', flexShrink: 0 }} />
              <span className="truncate">{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Deploy tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          {envs.map((env) => {
            const isDisabled = score < 80
            return (
              <button
                key={env}
                onClick={() => !isDisabled && onDeploy?.(env)}
                disabled={isDisabled}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors"
                style={
                  isDisabled
                    ? {
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-tertiary)',
                        cursor: 'not-allowed',
                      }
                    : {
                        background: 'var(--color-success, #10B981)',
                        color: '#fff',
                        cursor: 'pointer',
                      }
                }
                title={isDisabled ? `Score must be ≥ 80 to deploy` : `Deploy to ${env}`}
              >
                {isDisabled ? (
                  <Clock size={11} />
                ) : (
                  <CheckCircle size={11} />
                )}
                {env}
              </button>
            )
          })}
        </div>
        {score < 80 && (
          <p className="text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            Score must reach 80 to enable deployment
          </p>
        )}
      </div>
    </div>
  )
}
