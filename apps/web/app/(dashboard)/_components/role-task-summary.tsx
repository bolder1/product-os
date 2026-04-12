'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Clock, Inbox } from 'lucide-react'
import type { OrgRole } from '../../lib/role-config'

interface Task {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  studio: string
  studioColor: string
}

const tasksByRole: Record<OrgRole, Task[]> = {
  admin: [
    { id: '1', title: 'Review Q1 security audit results', priority: 'high', dueDate: 'Today', studio: 'Admin', studioColor: '#F43F5E' },
    { id: '2', title: 'Approve 4 pending access requests', priority: 'high', dueDate: 'Today', studio: 'Admin', studioColor: '#F43F5E' },
    { id: '3', title: 'Update org billing information', priority: 'medium', dueDate: 'Mar 31', studio: 'Admin', studioColor: '#F43F5E' },
    { id: '4', title: 'Review new member onboarding flow', priority: 'low', dueDate: 'Apr 2', studio: 'Tasks', studioColor: '#F59E0B' },
    { id: '5', title: 'Set up SSO integration', priority: 'medium', dueDate: 'Apr 5', studio: 'Admin', studioColor: '#F43F5E' },
  ],
  manager: [
    { id: '1', title: 'Finalize product roadmap for Q2', priority: 'high', dueDate: 'Today', studio: 'Planner', studioColor: '#8B5CF6' },
    { id: '2', title: 'Review sprint retrospective notes', priority: 'medium', dueDate: 'Mar 30', studio: 'Tasks', studioColor: '#F59E0B' },
    { id: '3', title: 'Approve design system updates', priority: 'high', dueDate: 'Mar 31', studio: 'Approvals', studioColor: '#10B981' },
    { id: '4', title: 'Prepare stakeholder demo', priority: 'medium', dueDate: 'Apr 1', studio: 'Templates', studioColor: '#3B82F6' },
    { id: '5', title: 'Schedule team 1:1s for April', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks', studioColor: '#F59E0B' },
  ],
  business_analyst: [
    { id: '1', title: 'Complete user journey mapping', priority: 'high', dueDate: 'Today', studio: 'Canvas', studioColor: '#8B5CF6' },
    { id: '2', title: 'Analyze conversion funnel data', priority: 'high', dueDate: 'Mar 30', studio: 'Analytics', studioColor: '#F59E0B' },
    { id: '3', title: 'Write BRD for checkout redesign', priority: 'medium', dueDate: 'Apr 1', studio: 'Templates', studioColor: '#3B82F6' },
    { id: '4', title: 'Review competitor feature matrix', priority: 'low', dueDate: 'Apr 3', studio: 'Planner', studioColor: '#8B5CF6' },
    { id: '5', title: 'Present findings to product team', priority: 'medium', dueDate: 'Apr 4', studio: 'Tasks', studioColor: '#F59E0B' },
  ],
  product_designer: [
    { id: '1', title: 'Finalize button component variants', priority: 'high', dueDate: 'Today', studio: 'Components', studioColor: '#3B82F6' },
    { id: '2', title: 'Update color palette for dark mode', priority: 'high', dueDate: 'Mar 30', studio: 'Brand', studioColor: '#EC4899' },
    { id: '3', title: 'Design onboarding screen flow', priority: 'medium', dueDate: 'Mar 31', studio: 'Design', studioColor: '#06B6D4' },
    { id: '4', title: 'Create icon set for navigation', priority: 'medium', dueDate: 'Apr 2', studio: 'Graphics', studioColor: '#8B5CF6' },
    { id: '5', title: 'Review accessibility audit results', priority: 'low', dueDate: 'Apr 4', studio: 'Tasks', studioColor: '#F59E0B' },
  ],
  frontend_dev: [
    { id: '1', title: 'Implement sidebar navigation', priority: 'high', dueDate: 'Today', studio: 'Code', studioColor: '#10B981' },
    { id: '2', title: 'Fix responsive layout on dashboard', priority: 'high', dueDate: 'Mar 30', studio: 'Pages', studioColor: '#3B82F6' },
    { id: '3', title: 'Build data table component', priority: 'medium', dueDate: 'Mar 31', studio: 'Components', studioColor: '#06B6D4' },
    { id: '4', title: 'Review handoff specs for settings page', priority: 'medium', dueDate: 'Apr 1', studio: 'Handoff', studioColor: '#8B5CF6' },
    { id: '5', title: 'Write unit tests for form validation', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks', studioColor: '#F59E0B' },
  ],
  backend_dev: [
    { id: '1', title: 'Implement auth middleware', priority: 'high', dueDate: 'Today', studio: 'Code', studioColor: '#10B981' },
    { id: '2', title: 'Design API for workspace settings', priority: 'high', dueDate: 'Mar 30', studio: 'Workflow', studioColor: '#3B82F6' },
    { id: '3', title: 'Fix N+1 query in product listing', priority: 'medium', dueDate: 'Mar 31', studio: 'Code', studioColor: '#10B981' },
    { id: '4', title: 'Set up CI/CD pipeline stages', priority: 'medium', dueDate: 'Apr 1', studio: 'Handoff', studioColor: '#8B5CF6' },
    { id: '5', title: 'Review database migration plan', priority: 'low', dueDate: 'Apr 3', studio: 'Tasks', studioColor: '#F59E0B' },
  ],
  qa: [
    { id: '1', title: 'Run regression suite for v2.1', priority: 'high', dueDate: 'Today', studio: 'Testing', studioColor: '#F59E0B' },
    { id: '2', title: 'Write E2E tests for checkout flow', priority: 'high', dueDate: 'Mar 30', studio: 'Testing', studioColor: '#F59E0B' },
    { id: '3', title: 'Verify bug fixes from sprint 14', priority: 'medium', dueDate: 'Mar 31', studio: 'Tasks', studioColor: '#F59E0B' },
    { id: '4', title: 'Update test plan for mobile release', priority: 'medium', dueDate: 'Apr 1', studio: 'Releases', studioColor: '#10B981' },
    { id: '5', title: 'Log performance benchmarks', priority: 'low', dueDate: 'Apr 3', studio: 'Testing', studioColor: '#F59E0B' },
  ],
  viewer: [],
}

const priorityColors: Record<string, string> = {
  high: '#F43F5E',
  medium: '#F59E0B',
  low: '#64748B',
}

export default function RoleTaskSummary({ role }: { role: OrgRole }) {
  const tasks = tasksByRole[role] || []

  if (tasks.length === 0) {
    return (
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">My Tasks</h2>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4A5568]" />
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="w-8 h-8 text-[#1E293B] mb-2" />
          <p className="text-sm text-[#4A5568]">No tasks assigned yet</p>
          <p className="text-xs text-[#334155] mt-1">Tasks will appear here when assigned to you</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">My Tasks</h2>
        <a
          href="#"
          className="text-xs text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1 transition"
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
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityColors[task.priority] }}
            />
            {/* Title */}
            <span className="flex-1 text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition truncate">
              {task.title}
            </span>
            {/* Due date */}
            <div className="flex items-center gap-1 text-xs text-[#4A5568] flex-shrink-0">
              <Clock className="w-3 h-3" />
              {task.dueDate}
            </div>
            {/* Studio badge */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
              style={{
                backgroundColor: `${task.studioColor}12`,
                color: task.studioColor,
              }}
            >
              {task.studio}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
