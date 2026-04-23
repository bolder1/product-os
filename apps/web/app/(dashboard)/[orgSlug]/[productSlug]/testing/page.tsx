'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Play, FlaskConical } from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { mockTestData, type TestSuite as MockSuite, type TestRun as MockRun } from './_data/mock-tests'
import { TestSuites } from './_components/test-suites'
import { TestRuns } from './_components/test-runs'
import { CoverageReport } from './_components/coverage-report'
import { useProduct } from '../layout'
import {
  useTestingStore,
  type TestSuite as StoreSuite,
  type TestRun as StoreRun,
  type TestTab,
} from '../../../../lib/testing-store'

/** Normalize store suite into the shape TestSuites expects. */
function toMockSuite(s: StoreSuite): MockSuite {
  return {
    id: s.id,
    name: s.name || s.label,
    lastRun: s.lastRun ?? (s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'never'),
    status: (s.status === 'pending' ? 'partial' : s.status) as MockSuite['status'],
    tests: s.tests.map((t) => ({
      id: t.id,
      name: t.name,
      status: (t.status === 'pending' ? 'skipped' : t.status) as MockSuite['tests'][number]['status'],
      duration: t.duration,
    })),
  }
}

/** Normalize store run into the shape TestRuns expects. */
function toMockRun(r: StoreRun): MockRun {
  return {
    id: r.id,
    runNumber: r.runNumber,
    date: r.date,
    duration: r.duration,
    passed: r.passed,
    failed: r.failed,
    skipped: r.skipped,
    trigger: r.trigger,
    status: r.status,
  }
}

export default function TestingPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const storeSuites = useTestingStore((s) => s.suites)
  const storeRuns = useTestingStore((s) => s.runs)
  const storeCoverage = useTestingStore((s) => s.coverage)
  const activeTab = useTestingStore((s) => s.activeTab)
  const setTab = useTestingStore((s) => s.setTab)

  const productSuites = useMemo(
    () => storeSuites.filter((s) => s.productId === productId),
    [storeSuites, productId],
  )
  const productRuns = useMemo(
    () => storeRuns.filter((r) => r.productId === productId),
    [storeRuns, productId],
  )

  const isLive = productSuites.length > 0 || productRuns.length > 0

  // Prefer live data; fall back to the seeded mock project when empty.
  const suites: MockSuite[] = isLive
    ? productSuites.map(toMockSuite)
    : mockTestData.suites
  const runs: MockRun[] = productRuns.length > 0
    ? productRuns.map(toMockRun)
    : mockTestData.runs
  const coverage =
    storeCoverage.categories.length > 0 ? storeCoverage : mockTestData.coverage

  const stats = useMemo(() => {
    const allTests = suites.flatMap((s) => s.tests)
    const total = allTests.length
    const passed = allTests.filter((t) => t.status === 'passed').length
    const failed = allTests.filter((t) => t.status === 'failed').length
    const skipped = allTests.filter((t) => t.status === 'skipped').length
    return { total, passed, failed, skipped, coverage: coverage.overall }
  }, [suites, coverage])

  const tabs: { key: TestTab; label: string; count?: number }[] = [
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
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AIActionBar workspace="ship" productId={productId} compact />
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
            onClick={() => setTab(tab.key)}
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
