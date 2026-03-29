'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
} from 'lucide-react'
import type { TestSuite, TestCase } from '../_data/mock-tests'

interface TestSuitesProps {
  suites: TestSuite[]
}

const statusIcon: Record<TestCase['status'], React.ReactNode> = {
  passed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-rose-400" />,
  skipped: <MinusCircle className="w-4 h-4 text-[#64748B]" />,
}

const suiteStatusColor: Record<TestSuite['status'], string> = {
  passed: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-rose-500/15 text-rose-400',
  partial: 'bg-amber-500/15 text-amber-400',
}

export function TestSuites({ suites }: TestSuitesProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-3">
      {suites.map((suite, i) => {
        const passed = suite.tests.filter((t) => t.status === 'passed').length
        const total = suite.tests.length
        const passRate = total > 0 ? (passed / total) * 100 : 0
        const failRate = 100 - passRate
        const isOpen = expanded === suite.id

        return (
          <motion.div
            key={suite.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
          >
            {/* Suite header */}
            <button
              onClick={() => toggle(suite.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-[#64748B]">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-[#F1F5F9] truncate">
                  {suite.name}
                </span>
                <span className="text-xs text-[#64748B]">{total} tests</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${suiteStatusColor[suite.status]}`}
                >
                  {suite.status}
                </span>
              </div>

              {/* Pass rate bar */}
              <div className="flex items-center gap-2 w-40 shrink-0">
                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${passRate}%` }}
                  />
                  {failRate > 0 && (
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${failRate}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-[#94A3B8] w-10 text-right">
                  {Math.round(passRate)}%
                </span>
              </div>

              {/* Last run */}
              <div className="flex items-center gap-1 text-xs text-[#64748B] shrink-0">
                <Clock className="w-3 h-3" />
                {suite.lastRun}
              </div>

              {/* Run suite button */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              >
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#F43F5E] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 transition-colors">
                  <Play className="w-3 h-3" />
                  Run
                </button>
              </div>
            </button>

            {/* Expanded test list */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.06] px-4 py-2">
                    {suite.tests.map((test, ti) => (
                      <motion.div
                        key={test.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ti * 0.04 }}
                        className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]"
                      >
                        {statusIcon[test.status]}
                        <span className="flex-1 text-sm text-[#94A3B8]">
                          {test.name}
                        </span>
                        {test.duration > 0 && (
                          <span className="text-xs text-[#64748B]">
                            {test.duration}ms
                          </span>
                        )}
                      </motion.div>
                    ))}
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
