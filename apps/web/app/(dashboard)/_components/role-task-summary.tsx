'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, Inbox } from 'lucide-react'
import type { OrgRole } from '../../lib/role-config'

// R20.6 — studio identity shown via label + icon only (per role-color retirement).
// Priority maps to semantic tokens. Studio badges use neutral `accent-subtle` background.
interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  studio: string
}

const tasksByRole: Record<OrgRole, Task[]> = {
  admin: [
    { id: '1', title: 'Review Q1 security audit results', priority: 'high', dueDate: 'Today', studio: 'Admin' },
    { id: '2', title: 'Approve 4 pending access requests', priority: 'high', dueDate: 'Today', studio: 'Admin' },
    { id: '3', title: 'Update org billing information', priority: 'medium', dueDate: 'Mar 31', studio: 'Admin' },
    { id: '4', title: 'Review new member onboarding flow', priority: 'low', dueDate: 'Apr 2', studio: 'Tasks' },
    { id: '5', title: 'Set up SSO integration', priority: 'medium', dueDate: 'Apr 5', studio: 'Admin' },
  ],
  manager: [
    { id: '1', title: 'Finalize product roadmap for Q2', priority: 'high', dueDate: 'Today', studio: 'Planner' },
    { id: '2', title: 'Review sprint retrospective notes', priority: 'medium', dueDate: 'Mar 30', studio: 'Tasks' },
    { id: '3', title: 'Approve design system updates', priority: 'high', dueDate: 'Mar 31', studio: 'Approvals' },
    { id: '4', title: 'Prepare stakeholder demo', priority: 'medium', dueDate: 'Apr 1', studio: 'Templates' },
    { id: '5', title: 'Schedule team 1:1s for April', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks' },
  ],
  business_analyst: [
    { id: '1', title: 'Complete user journey mapping', priority: 'high', dueDate: 'Today', studio: 'Canvas' },
    { id: '2', title: 'Analyze conversion funnel data', priority: 'high', dueDate: 'Mar 30', studio: 'Analytics' },
    { id: '3', title: 'Write BRD for checkout redesign', priority: 'medium', dueDate: 'Apr 1', studio: 'Templates' },
    { id: '4', title: 'Review competitor feature matrix', priority: 'low', dueDate: 'Apr 3', studio: 'Planner' },
    { id: '5', title: 'Present findings to product team', priority: 'medium', dueDate: 'Apr 4', studio: 'Tasks' },
  ],
  product_designer: [
    { id: '1', title: 'Finalize button component variants', priority: 'high', dueDate: 'Today', studio: 'Components' },
    { id: '2', title: 'Update color palette for dark mode', priority: 'high', dueDate: 'Mar 30', studio: 'Brand' },
    { id: '3', title: 'Design onboarding screen flow', priority: 'medium', dueDate: 'Mar 31', studio: 'Design' },
    { id: '4', title: 'Create icon set for navigation', priority: 'medium', dueDate: 'Apr 2', studio: 'Graphics' },
    { id: '5', title: 'Review accessibility audit results', priority: 'low', dueDate: 'Apr 4', studio: 'Tasks' },
  ],
  frontend_dev: [
    { id: '1', title: 'Implement sidebar navigation', priority: 'high', dueDate: 'Today', studio: 'Code' },
    { id: '2', title: 'Fix responsive layout on dashboard', priority: 'high', dueDate: 'Mar 30', studio: 'Pages' },
    { id: '3', title: 'Build data table component', priority: 'medium', dueDate: 'Mar 31', studio: 'Components' },
    { id: '4', title: 'Review handoff specs for settings page', priority: 'medium', dueDate: 'Apr 1', studio: 'Handoff' },
    { id: '5', title: 'Write unit tests for form validation', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks' },
  ],
  backend_dev: [
    { id: '1', title: 'Implement auth middleware', priority: 'high', dueDate: 'Today', studio: 'Code' },
    { id: '2', title: 'Design API for workspace settings', priority: 'high', dueDate: 'Mar 30', studio: 'Workflow' },
    { id: '3', title: 'Fix N+1 query in product listing', priority: 'medium', dueDate: 'Mar 31', studio: 'Code' },
    { id: '4', title: 'Set up CI/CD pipeline stages', priority: 'medium', dueDate: 'Apr 1', studio: 'Handoff' },
    { id: '5', title: 'Review database migration plan', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks' },
  ],
  qa: [
    { id: '1', title: 'Run regression suite for v2.1', priority: 'high', dueDate: 'Today', studio: 'Testing' },
    { id: '2', title: 'Write E2E tests for checkout flow', priority: 'high', dueDate: 'Mar 30', studio: 'Testing' },
    { id: '3', title: 'Verify bug fixes from sprint 14', priority: 'medium', dueDate: 'Mar 31', studio: 'Tasks' },
    { id: '4', title: 'Update test plan for mobile release', priority: 'medium', dueDate: 'Apr 1', studio: 'Releases' },
    { id: '5', title: 'Log performance benchmarks', priority: 'low', dueDate: 'Apr 3', studio: 'Testing' },
  ],
  viewer: [],
}

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-[var(--color-error)]',
  medium: 'bg-[var(--color-warning)]',
  low:    'bg-[var(--text-tertiary)]',
}

export default function RoleTaskSummary({ role }: { role: OrgRole }) {
  const tasks = tasksByRole[role] || []

  if (tasks.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">My Tasks</h2>
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="w-8 h-8 text-[var(--bg-surface)] mb-2" />
          <p className="text-sm text-[var(--text-tertiary)]">No tasks assigned yet</p>
          <p className="text-xs text-[var(--border-default)] mt-1">Tasks will appear here when assigned to you</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">My Tasks</h2>
        <a
          href="#"
          className="text-xs text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1 transition"
        >
          View All <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition group cursor-pointer"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            {/* Priority dot */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-[var(--text-tertiary)]'}`} />
            {/* Title */}
            <span className="flex-1 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition truncate">
              {task.title}
            </span>
            {/* Due date */}
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] flex-shrink-0">
              <Clock className="w-3 h-3" />
              {task.dueDate}
            </div>
            {/* Studio badge */}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)]">
              {task.studio}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
