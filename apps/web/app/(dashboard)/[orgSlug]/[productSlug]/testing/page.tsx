'use client'

import { useState, useMemo } from 'react'
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
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 shrink-0 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Testing
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Quality assurance &amp; test management
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button className="tool-btn text-[var(--accent-text)]">
            <Sparkles size={12} />
            AI: Generate Tests
          </button>
          <button className="tool-btn">
            <Play size={12} />
            Run All
          </button>
          <button className="tool-btn tool-btn-primary">
            <Plus size={12} />
            New Suite
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center shrink-0 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-inset)] px-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
          { label: 'Passed', value: stats.passed, color: 'var(--color-success)' },
          { label: 'Failed', value: stats.failed, color: 'var(--color-error)' },
          { label: 'Skipped', value: stats.skipped, color: 'var(--text-tertiary)' },
          { label: 'Coverage', value: `${stats.coverage}%`, color: 'var(--accent-text)' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium">
              {stat.label}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: stat.color }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="tool-tabs shrink-0 pl-1 bg-[var(--bg-surface)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tool-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tool-badge ml-1">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'suites' && <TestSuites suites={suites} />}
        {activeTab === 'runs' && <TestRuns runs={runs} />}
        {activeTab === 'coverage' && <CoverageReport coverage={coverage} />}
      </div>
    </div>
  )
}
