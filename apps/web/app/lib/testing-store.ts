'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TestCase {
  id: string
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'pending'
  duration: number
  error?: string
  steps: string[]
}

export interface TestSuite {
  id: string
  productId: string
  label: string
  name: string
  tests: TestCase[]
  lastRun?: string
  status: 'passed' | 'failed' | 'partial' | 'pending'
  tags: string[]
  createdAt?: string
  updatedAt?: string
}

export interface TestRun {
  id: string
  productId: string
  runNumber: number
  date: string
  duration: number
  passed: number
  failed: number
  skipped: number
  trigger: 'manual' | 'ci' | 'scheduled'
  status: 'passed' | 'failed' | 'partial'
  suiteId?: string
}

export interface CoverageData {
  overall: number
  categories: Array<{ name: string; percentage: number }>
}

export type TestTab = 'suites' | 'runs' | 'coverage'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseSuite(raw: Record<string, unknown>): TestSuite {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    label: raw.label as string,
    name: data.name ?? raw.label ?? '',
    tests: data.tests ?? [],
    lastRun: data.lastRun,
    status: data.status ?? 'pending',
    tags: data.tags ?? [],
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  }
}

function parseRun(raw: Record<string, unknown>): TestRun {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    runNumber: data.runNumber ?? 0,
    date: data.date ?? raw.createdAt ?? '',
    duration: data.duration ?? 0,
    passed: data.passed ?? 0,
    failed: data.failed ?? 0,
    skipped: data.skipped ?? 0,
    trigger: data.trigger ?? 'manual',
    status: data.status ?? 'partial',
    suiteId: data.suiteId,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface TestingState {
  suites: TestSuite[]
  runs: TestRun[]
  coverage: CoverageData
  activeTab: TestTab
  expandedSuiteId: string | null
  loading: boolean

  hydrateSuites: (raw: Record<string, unknown>[]) => void
  hydrateRuns: (raw: Record<string, unknown>[]) => void
  hydrateCoverage: (data: CoverageData) => void
  setTab: (t: TestTab) => void
  expandSuite: (id: string | null) => void

  createSuite: (suite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSuite: (id: string, patch: Partial<TestSuite>) => void
  removeSuite: (id: string) => void

  addTestCase: (suiteId: string, tc: TestCase) => void
  updateTestCase: (suiteId: string, testId: string, patch: Partial<TestCase>) => void
  removeTestCase: (suiteId: string, testId: string) => void

  recordRun: (run: Omit<TestRun, 'id'>) => void
}

export const useTestingStore = create<TestingState>()(
  persist(
    (set, get) => ({
      suites: [],
      runs: [],
      coverage: { overall: 0, categories: [] },
      activeTab: 'suites',
      expandedSuiteId: null,
      loading: false,

      hydrateSuites: (raw) => set({ suites: raw.map(parseSuite), loading: false }),
      hydrateRuns: (raw) => set({ runs: raw.map(parseRun) }),
      hydrateCoverage: (data) => set({ coverage: data }),
      setTab: (t) => set({ activeTab: t }),
      expandSuite: (id) => set({ expandedSuiteId: get().expandedSuiteId === id ? null : id }),

      createSuite: (suite) => {
        const id = crypto.randomUUID()
        set({ suites: [{ ...suite, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...get().suites] })
      },
      updateSuite: (id, patch) =>
        set({ suites: get().suites.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)) }),
      removeSuite: (id) => set({ suites: get().suites.filter((s) => s.id !== id) }),

      addTestCase: (suiteId, tc) =>
        set({
          suites: get().suites.map((s) =>
            s.id === suiteId ? { ...s, tests: [...s.tests, tc] } : s,
          ),
        }),
      updateTestCase: (suiteId, testId, patch) =>
        set({
          suites: get().suites.map((s) =>
            s.id === suiteId
              ? { ...s, tests: s.tests.map((t) => (t.id === testId ? { ...t, ...patch } : t)) }
              : s,
          ),
        }),
      removeTestCase: (suiteId, testId) =>
        set({
          suites: get().suites.map((s) =>
            s.id === suiteId ? { ...s, tests: s.tests.filter((t) => t.id !== testId) } : s,
          ),
        }),

      recordRun: (run) => {
        const id = crypto.randomUUID()
        set({ runs: [{ ...run, id }, ...get().runs] })
      },
    }),
    { name: 'product-os-testing-store', partialize: (s) => ({ activeTab: s.activeTab }) },
  ),
)
