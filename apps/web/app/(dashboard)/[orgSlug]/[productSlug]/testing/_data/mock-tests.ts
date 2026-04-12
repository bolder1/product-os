export interface TestCase {
  id: string
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number // ms
}

export interface TestSuite {
  id: string
  name: string
  tests: TestCase[]
  lastRun: string
  status: 'passed' | 'failed' | 'partial'
}

export interface TestRun {
  id: string
  runNumber: number
  date: string
  duration: number // seconds
  passed: number
  failed: number
  skipped: number
  trigger: 'manual' | 'ci' | 'scheduled'
  status: 'passed' | 'failed' | 'partial'
}

export interface CoverageCategory {
  name: string
  percentage: number
}

export interface CoverageData {
  overall: number
  categories: CoverageCategory[]
}

export interface MockTestData {
  suites: TestSuite[]
  runs: TestRun[]
  coverage: CoverageData
}

export const mockTestData: MockTestData = {
  suites: [
    {
      id: 'suite-001',
      name: 'Authentication Flow',
      lastRun: '2 hours ago',
      status: 'passed',
      tests: [
        { id: 'test-001', name: 'Login with valid credentials', status: 'passed', duration: 342 },
        { id: 'test-002', name: 'Login with invalid password', status: 'passed', duration: 218 },
        { id: 'test-003', name: 'OAuth2 redirect flow', status: 'passed', duration: 1204 },
        { id: 'test-004', name: 'Session expiry handling', status: 'passed', duration: 567 },
        { id: 'test-005', name: 'Password reset email', status: 'passed', duration: 890 },
      ],
    },
    {
      id: 'suite-002',
      name: 'Dashboard Components',
      lastRun: '45 min ago',
      status: 'failed',
      tests: [
        { id: 'test-006', name: 'Metric card renders correctly', status: 'passed', duration: 120 },
        { id: 'test-007', name: 'Chart data loading state', status: 'passed', duration: 95 },
        { id: 'test-008', name: 'Filter dropdown interaction', status: 'failed', duration: 456 },
        { id: 'test-009', name: 'Responsive layout breakpoints', status: 'passed', duration: 312 },
        { id: 'test-010', name: 'Dark mode toggle', status: 'skipped', duration: 0 },
        { id: 'test-011', name: 'Data refresh on interval', status: 'passed', duration: 2100 },
      ],
    },
    {
      id: 'suite-003',
      name: 'API Endpoints',
      lastRun: '1 hour ago',
      status: 'passed',
      tests: [
        { id: 'test-012', name: 'GET /api/products returns 200', status: 'passed', duration: 89 },
        { id: 'test-013', name: 'POST /api/tasks validates input', status: 'passed', duration: 145 },
        { id: 'test-014', name: 'DELETE /api/tasks/:id authorization', status: 'passed', duration: 203 },
        { id: 'test-015', name: 'Rate limiting returns 429', status: 'passed', duration: 1560 },
      ],
    },
    {
      id: 'suite-004',
      name: 'Workflow Engine',
      lastRun: '3 hours ago',
      status: 'partial',
      tests: [
        { id: 'test-016', name: 'Sequential step execution', status: 'passed', duration: 780 },
        { id: 'test-017', name: 'Parallel branch merge', status: 'failed', duration: 1240 },
        { id: 'test-018', name: 'Conditional routing logic', status: 'passed', duration: 450 },
        { id: 'test-019', name: 'Error recovery and retry', status: 'skipped', duration: 0 },
        { id: 'test-020', name: 'Webhook trigger handling', status: 'passed', duration: 670 },
      ],
    },
    {
      id: 'suite-005',
      name: 'Graph Explorer',
      lastRun: '30 min ago',
      status: 'passed',
      tests: [
        { id: 'test-021', name: 'Node rendering and positioning', status: 'passed', duration: 234 },
        { id: 'test-022', name: 'Edge connection drawing', status: 'passed', duration: 189 },
        { id: 'test-023', name: 'Drag-to-reposition nodes', status: 'passed', duration: 567 },
      ],
    },
  ],
  runs: [
    {
      id: 'run-001',
      runNumber: 47,
      date: '2026-03-29 14:30',
      duration: 124,
      passed: 19,
      failed: 1,
      skipped: 2,
      trigger: 'manual',
      status: 'partial',
    },
    {
      id: 'run-002',
      runNumber: 46,
      date: '2026-03-29 09:00',
      duration: 118,
      passed: 21,
      failed: 0,
      skipped: 1,
      trigger: 'ci',
      status: 'passed',
    },
    {
      id: 'run-003',
      runNumber: 45,
      date: '2026-03-28 22:00',
      duration: 132,
      passed: 16,
      failed: 4,
      skipped: 2,
      trigger: 'scheduled',
      status: 'failed',
    },
    {
      id: 'run-004',
      runNumber: 44,
      date: '2026-03-28 14:15',
      duration: 109,
      passed: 20,
      failed: 1,
      skipped: 1,
      trigger: 'ci',
      status: 'partial',
    },
  ],
  coverage: {
    overall: 79,
    categories: [
      { name: 'Components', percentage: 87 },
      { name: 'Pages', percentage: 72 },
      { name: 'API', percentage: 91 },
      { name: 'Workflows', percentage: 65 },
    ],
  },
}
