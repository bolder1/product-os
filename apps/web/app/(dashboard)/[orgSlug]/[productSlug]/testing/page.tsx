'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Play, Sparkles, FlaskConical } from 'lucide-react'
import { mockTestData } from './_data/mock-tests'
import { TestSuites } from './_components/test-suites'
import { TestRuns } from './_components/test-runs'
import { CoverageReport } from './_components/coverage-report'

type Tab = 'suites' | 'runs' | 'coverage'

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('suites')
  const { suites, runs, coverage } = mockTestData

  const stats = useMemo(() => {
    const allTests = suites.flatMap((s) => s.tests)
    const total = allTests.length
    const passed = allTests.filter((t) => t.status === 'passed').length
    const failed = allTests.filter((t) => t.status === 'failed').length
    const skipped = allTests.filter((t) => t.status === 'skipped').length
    return { total, passed, failed, skipped, coverage: coverage.overall }
  }, [suites, coverage])

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'suites', label: 'Test Suites', count: suites.length },
    { key: 'runs', label: 'Test Runs', count: runs.length },
    { key: 'coverage', label: 'Coverage' },
  ]

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F43F5E]/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[#F43F5E]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Testing</h1>
            <p className="text-xs text-[#64748B]">Quality assurance &amp; test management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Generate Tests
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#F43F5E] bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 transition-colors">
            <Play className="w-3.5 h-3.5" />
            Run All
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors">
            <Plus className="w-4 h-4" />
            New Test Suite
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-5 gap-3"
      >
        {[
          { label: 'Total Tests', value: stats.total, color: '#F1F5F9' },
          { label: 'Passed', value: stats.passed, color: '#10B981' },
          { label: 'Failed', value: stats.failed, color: '#F43F5E' },
          { label: 'Skipped', value: stats.skipped, color: '#64748B' },
          { label: 'Coverage', value: `${stats.coverage}%`, color: '#F43F5E' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex flex-col gap-1"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
              {stat.label}
            </span>
            <span className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.08]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-[#F43F5E]'
                : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-[#F43F5E]/15 text-[#F43F5E]'
                      : 'bg-white/[0.06] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="testing-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F43F5E]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {activeTab === 'suites' && <TestSuites suites={suites} />}
        {activeTab === 'runs' && <TestRuns runs={runs} />}
        {activeTab === 'coverage' && <CoverageReport coverage={coverage} />}
      </motion.div>
    </div>
  )
}
