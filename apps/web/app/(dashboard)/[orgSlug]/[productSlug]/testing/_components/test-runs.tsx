'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  User,
  GitBranch,
  Timer,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { TestRun } from '../_data/mock-tests'

interface TestRunsProps {
  runs: TestRun[]
}

const triggerConfig: Record<TestRun['trigger'], { label: string; icon: React.ReactNode; color: string }> = {
  manual: { label: 'Manual', icon: <User className="w-3 h-3" />, color: 'text-[#94A3B8]' },
  ci: { label: 'CI', icon: <GitBranch className="w-3 h-3" />, color: 'text-blue-400' },
  scheduled: { label: 'Scheduled', icon: <Timer className="w-3 h-3" />, color: 'text-amber-400' },
}

const statusBarColor: Record<TestRun['status'], string> = {
  passed: 'bg-emerald-500',
  failed: 'bg-rose-500',
  partial: 'bg-amber-500',
}

const statusBadgeColor: Record<TestRun['status'], string> = {
  passed: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-rose-500/15 text-rose-400',
  partial: 'bg-amber-500/15 text-amber-400',
}

export function TestRuns({ runs }: TestRunsProps) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="grid grid-cols-[60px_1fr_120px_200px_100px_80px_40px] gap-3 px-4 py-2 text-xs text-[#64748B] font-medium">
        <span>Run</span>
        <span>Date</span>
        <span>Duration</span>
        <span>Results</span>
        <span>Trigger</span>
        <span>Status</span>
        <span />
      </div>

      {runs.map((run, i) => {
        const total = run.passed + run.failed + run.skipped
        const passPercent = total > 0 ? (run.passed / total) * 100 : 0
        const failPercent = total > 0 ? (run.failed / total) * 100 : 0
        const skipPercent = total > 0 ? (run.skipped / total) * 100 : 0
        const trigger = triggerConfig[run.trigger]
        const isOpen = expandedRun === run.id

        return (
          <motion.div
            key={run.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
          >
            <button
              onClick={() => setExpandedRun(isOpen ? null : run.id)}
              className="w-full grid grid-cols-[60px_1fr_120px_200px_100px_80px_40px] gap-3 items-center px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              {/* Run number */}
              <span className="text-sm font-mono font-medium text-[#F1F5F9]">
                #{run.runNumber}
              </span>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Clock className="w-3 h-3 text-[#64748B]" />
                {run.date}
              </div>

              {/* Duration */}
              <span className="text-xs text-[#94A3B8]">{run.duration}s</span>

              {/* Results bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${passPercent}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${failPercent}%` }} />
                  <div className="h-full bg-[#64748B]" style={{ width: `${skipPercent}%` }} />
                </div>
                <span className="text-[10px] text-[#64748B] whitespace-nowrap">
                  {run.passed}/{run.failed}/{run.skipped}
                </span>
              </div>

              {/* Trigger */}
              <div className={`flex items-center gap-1 text-xs ${trigger.color}`}>
                {trigger.icon}
                {trigger.label}
              </div>

              {/* Status */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-center ${statusBadgeColor[run.status]}`}
              >
                {run.status}
              </span>

              {/* Expand */}
              <div className="text-[#64748B]">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.06] px-4 py-3 grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Passed</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusBarColor.passed}`} />
                        <span className="text-sm font-medium text-emerald-400">{run.passed} tests</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Failed</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusBarColor.failed}`} />
                        <span className="text-sm font-medium text-rose-400">{run.failed} tests</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Skipped</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#64748B]" />
                        <span className="text-sm font-medium text-[#94A3B8]">{run.skipped} tests</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
