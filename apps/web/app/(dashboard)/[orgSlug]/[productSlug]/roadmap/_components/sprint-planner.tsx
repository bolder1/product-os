'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  User,
  Zap,
  Flag,
  GripVertical,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus   = 'backlog' | 'todo' | 'in-progress' | 'done'

export interface SprintTask {
  id: string
  title: string
  estimate: number // hours
  priority: TaskPriority
  status: TaskStatus
  assignee?: string
  tags: string[]
  sprintId?: string
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  capacity: number // total hours
  committed: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ASSIGNEES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan']

const INITIAL_TASKS: SprintTask[] = [
  { id: 't1', title: 'Auth flow — login + signup screens', estimate: 8,  priority: 'high',     status: 'backlog', assignee: 'Alex',   tags: ['design', 'auth'] },
  { id: 't2', title: 'Brand token system — colors + typography', estimate: 5,  priority: 'high',     status: 'backlog', assignee: 'Sam',    tags: ['brand'] },
  { id: 't3', title: 'Button component — all states', estimate: 4,  priority: 'medium',   status: 'backlog', assignee: 'Jordan', tags: ['component'] },
  { id: 't4', title: 'Dashboard layout — grid + cards', estimate: 6,  priority: 'high',     status: 'backlog', assignee: 'Taylor', tags: ['design'] },
  { id: 't5', title: 'API — user authentication endpoints', estimate: 10, priority: 'critical', status: 'backlog', assignee: 'Morgan', tags: ['backend'] },
  { id: 't6', title: 'E2E test suite — smoke tests', estimate: 6,  priority: 'medium',   status: 'backlog', assignee: 'Alex',   tags: ['qa'] },
  { id: 't7', title: 'Payments integration — Stripe', estimate: 12, priority: 'medium',   status: 'backlog', tags: ['backend'] },
  { id: 't8', title: 'Form Kit component', estimate: 5,  priority: 'medium',   status: 'backlog', assignee: 'Sam',    tags: ['component'] },
  // Sprint 1 tasks
  { id: 't9',  title: 'Project setup + CI/CD pipeline',  estimate: 4,  priority: 'high',   status: 'done',        assignee: 'Morgan', tags: ['infra'],      sprintId: 'sp1' },
  { id: 't10', title: 'DB schema — users + sessions',    estimate: 6,  priority: 'high',   status: 'done',        assignee: 'Morgan', tags: ['backend'],    sprintId: 'sp1' },
  { id: 't11', title: 'Design system foundations',       estimate: 8,  priority: 'high',   status: 'in-progress', assignee: 'Sam',    tags: ['brand'],      sprintId: 'sp1' },
  { id: 't12', title: 'Landing page v1',                 estimate: 6,  priority: 'medium', status: 'in-progress', assignee: 'Taylor', tags: ['design'],     sprintId: 'sp1' },
  { id: 't13', title: 'Navigation shell component',      estimate: 4,  priority: 'medium', status: 'todo',        assignee: 'Jordan', tags: ['component'],  sprintId: 'sp1' },
]

const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sp1',
    name: 'Sprint 1 — Foundation',
    startDate: '2026-04-14',
    endDate: '2026-04-25',
    capacity: 40,
    committed: true,
    approvalStatus: 'approved',
  },
  {
    id: 'sp2',
    name: 'Sprint 2 — Auth & Brand',
    startDate: '2026-04-28',
    endDate: '2026-05-09',
    capacity: 40,
    committed: false,
    approvalStatus: null,
  },
]

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high:     { label: 'High',     color: '#F59E0B' },
  medium:   { label: 'Medium',   color: '#3B82F6' },
  low:      { label: 'Low',      color: '#64748B' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  backlog:     { label: 'Backlog',     color: '#64748B', icon: <Circle size={12} /> },
  todo:        { label: 'To Do',       color: '#94A3B8', icon: <Circle size={12} /> },
  'in-progress': { label: 'In Progress', color: '#3B82F6', icon: <Zap size={12} /> },
  done:        { label: 'Done',        color: '#10B981', icon: <CheckCircle2 size={12} /> },
}

const APPROVAL_CONFIG = {
  pending:  { label: 'Pending approval', color: '#F59E0B', icon: <Clock size={12} /> },
  approved: { label: 'Approved',         color: '#10B981', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Changes requested', color: '#EF4444', icon: <AlertTriangle size={12} /> },
}

// ---------------------------------------------------------------------------
// Task card
// ---------------------------------------------------------------------------

function TaskCard({
  task,
  onMove,
  onRemove,
}: {
  task: SprintTask
  onMove?: (sprintId: string | undefined) => void
  onRemove?: () => void
}) {
  const priority = PRIORITY_CONFIG[task.priority]
  const status = STATUS_CONFIG[task.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-grab"
    >
      <GripVertical size={13} className="text-[#334155] mt-0.5 shrink-0 group-hover:text-[#64748B] transition-colors" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#F1F5F9] mb-1.5 leading-relaxed">{task.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority */}
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${priority.color}18`, color: priority.color }}
          >
            {priority.label}
          </span>
          {/* Estimate */}
          <span className="text-[10px] text-[#64748B] flex items-center gap-0.5">
            <Clock size={9} />
            {task.estimate}h
          </span>
          {/* Assignee */}
          {task.assignee && (
            <span className="text-[10px] text-[#64748B] flex items-center gap-0.5">
              <User size={9} />
              {task.assignee}
            </span>
          )}
          {/* Tags */}
          {task.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#64748B]">{t}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onMove && (
          <button
            onClick={() => onMove(task.sprintId)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
            title={task.sprintId ? 'Move to backlog' : 'Add to sprint'}
          >
            {task.sprintId ? <ChevronRight size={11} className="rotate-180" /> : <ChevronRight size={11} />}
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Capacity bar
// ---------------------------------------------------------------------------

function CapacityBar({ used, total, assignees }: { used: number; total: number; assignees: Record<string, number> }) {
  const pct = Math.min((used / Math.max(total, 1)) * 100, 100)
  const over = used > total
  const color = over ? '#EF4444' : pct > 80 ? '#F59E0B' : '#10B981'

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#F1F5F9]">Sprint Capacity</span>
        <span className="text-xs font-mono" style={{ color }}>
          {used}h / {total}h {over && '⚠ Over capacity'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {/* Per-assignee bars */}
      <div className="flex flex-col gap-1.5">
        {Object.entries(assignees).map(([name, hours]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-[10px] text-[#64748B] w-14 shrink-0">{name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6398ff]"
                style={{ width: `${Math.min((hours / (total / Object.keys(assignees).length)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#64748B] w-6 text-right">{hours}h</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MVP Approval gate
// ---------------------------------------------------------------------------

function ApprovalGate({
  sprint,
  onApprove,
  onRequest,
}: {
  sprint: Sprint
  onApprove: () => void
  onRequest: () => void
}) {
  const [requesting, setRequesting] = useState(false)
  const [comment, setComment] = useState('')

  async function submitRequest() {
    setRequesting(true)
    await new Promise((r) => setTimeout(r, 1000))
    onRequest()
    setRequesting(false)
    setComment('')
  }

  if (sprint.approvalStatus === 'approved') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20">
        <CheckCircle2 size={14} className="text-[#10B981]" />
        <span className="text-xs font-medium text-[#10B981]">Sprint approved — committed to delivery</span>
      </div>
    )
  }

  if (sprint.approvalStatus === 'pending') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
        <Clock size={14} className="text-[#F59E0B]" />
        <span className="text-xs font-medium text-[#F59E0B]">Awaiting manager approval…</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={15} className="text-[#8B5CF6]" />
        <span className="text-sm font-medium text-[#F1F5F9]">Commit Sprint for Approval</span>
      </div>
      <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
        Once you commit this sprint, it will be sent to your manager for approval before tasks move to "In Progress".
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note for your manager (optional)…"
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder:text-[#475569] focus:border-[#8B5CF6]/50 focus:outline-none resize-none transition mb-2"
      />
      <button
        onClick={submitRequest}
        disabled={requesting}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
          requesting
            ? 'bg-white/[0.06] text-[#64748B] cursor-not-allowed'
            : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
        }`}
      >
        {requesting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        {requesting ? 'Sending…' : 'Submit for Approval'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sprint column
// ---------------------------------------------------------------------------

function SprintColumn({
  sprint,
  tasks,
  onMoveTask,
  onApprove,
  onRequest,
}: {
  sprint: Sprint
  tasks: SprintTask[]
  onMoveTask: (taskId: string, toBacklog: boolean) => void
  onApprove: () => void
  onRequest: () => void
}) {
  const totalHours = tasks.reduce((s, t) => s + t.estimate, 0)
  const approvalMeta = sprint.approvalStatus ? APPROVAL_CONFIG[sprint.approvalStatus] : null

  const assigneeHours = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.assignee) acc[t.assignee] = (acc[t.assignee] ?? 0) + t.estimate
    return acc
  }, {})

  const statusGroups: Record<TaskStatus, SprintTask[]> = {
    backlog: [],
    todo:    tasks.filter((t) => t.status === 'todo'),
    'in-progress': tasks.filter((t) => t.status === 'in-progress'),
    done:    tasks.filter((t) => t.status === 'done'),
  }

  const dateLabel = `${new Date(sprint.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${new Date(sprint.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`

  return (
    <div className="flex flex-col gap-3 min-w-[340px] w-[340px]">
      {/* Sprint header */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">{sprint.name}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{dateLabel}</p>
          </div>
          {approvalMeta && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${approvalMeta.color}18`, color: approvalMeta.color }}
            >
              {approvalMeta.icon}
              {approvalMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Capacity */}
      <CapacityBar used={totalHours} total={sprint.capacity} assignees={assigneeHours} />

      {/* Status columns — compact list */}
      {(['todo', 'in-progress', 'done'] as TaskStatus[]).map((status) => {
        const group = statusGroups[status]
        if (status === 'todo' && group.length === 0 && tasks.length === 0) return null
        const cfg = STATUS_CONFIG[status]
        return (
          <div key={status}>
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{cfg.label}</span>
              <span className="text-[10px] text-[#475569]">({group.length})</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <AnimatePresence>
                {group.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={() => onMoveTask(task.id, true)}
                  />
                ))}
              </AnimatePresence>
              {group.length === 0 && (
                <div className="h-10 rounded-xl border border-dashed border-white/[0.05] flex items-center justify-center">
                  <span className="text-[10px] text-[#334155]">Drop tasks here</span>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Approval gate */}
      {!sprint.committed && (
        <ApprovalGate sprint={sprint} onApprove={onApprove} onRequest={onRequest} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Sprint Planner
// ---------------------------------------------------------------------------

export function SprintPlanner() {
  const [tasks, setTasks] = useState<SprintTask[]>(INITIAL_TASKS)
  const [sprints, setSprints] = useState<Sprint[]>(INITIAL_SPRINTS)
  const [generating, setGenerating] = useState(false)

  const backlogTasks = tasks.filter((t) => !t.sprintId)
  const sprintTasks  = useCallback(
    (sprintId: string) => tasks.filter((t) => t.sprintId === sprintId),
    [tasks],
  )

  function moveToSprint(taskId: string, sprintId: string) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, sprintId, status: 'todo' } : t))
  }

  function moveToBacklog(taskId: string) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, sprintId: undefined, status: 'backlog' } : t))
  }

  function handleSprintMove(taskId: string, toBacklog: boolean) {
    if (toBacklog) {
      moveToBacklog(taskId)
    } else {
      const latestSprint = sprints[sprints.length - 1]
      if (latestSprint) moveToSprint(taskId, latestSprint.id)
    }
  }

  function handleApprove(sprintId: string) {
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, committed: true, approvalStatus: 'approved' } : s))
  }

  function handleRequest(sprintId: string) {
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, approvalStatus: 'pending' } : s))
  }

  async function generateAITasks() {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 1500))
    const newTasks: SprintTask[] = [
      { id: `ai-${Date.now()}-1`, title: 'Accessibility audit — WCAG 2.1 compliance', estimate: 6, priority: 'medium', status: 'backlog', tags: ['qa', 'a11y'] },
      { id: `ai-${Date.now()}-2`, title: 'Error boundary + loading states', estimate: 4, priority: 'medium', status: 'backlog', tags: ['frontend'] },
      { id: `ai-${Date.now()}-3`, title: 'Analytics event tracking setup', estimate: 5, priority: 'low', status: 'backlog', tags: ['analytics'] },
    ]
    setTasks((prev) => [...prev, ...newTasks])
    setGenerating(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Backlog */}
      <div className="w-[300px] shrink-0 border-r border-white/[0.06] flex flex-col bg-[#080C14]">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-[#64748B]" />
              <span className="text-sm font-semibold text-[#F1F5F9]">Backlog</span>
              <span className="text-xs text-[#64748B] px-1.5 py-0.5 rounded-full bg-white/[0.06]">{backlogTasks.length}</span>
            </div>
            <button
              onClick={generateAITasks}
              disabled={generating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                generating
                  ? 'bg-white/[0.04] text-[#64748B] cursor-not-allowed'
                  : 'bg-[#8B5CF6]/15 text-[#8B5CF6] hover:bg-[#8B5CF6]/25'
              }`}
            >
              {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {generating ? 'Generating…' : 'AI suggest'}
            </button>
          </div>
          <p className="text-[10px] text-[#475569]">Drag tasks into sprints or click → to move them</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
          <AnimatePresence>
            {backlogTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={() => {
                  const sp2 = sprints.find((s) => s.id === 'sp2')
                  if (sp2) moveToSprint(task.id, sp2.id)
                }}
              />
            ))}
          </AnimatePresence>
          {backlogTasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#475569] text-center">All tasks are in sprints</p>
            </div>
          )}
        </div>
      </div>

      {/* Sprint columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-5 p-5 h-full min-w-max">
          {sprints.map((sprint) => (
            <SprintColumn
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks(sprint.id)}
              onMoveTask={handleSprintMove}
              onApprove={() => handleApprove(sprint.id)}
              onRequest={() => handleRequest(sprint.id)}
            />
          ))}

          {/* Add sprint */}
          <div className="flex flex-col gap-3 min-w-[220px] w-[220px]">
            <button className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/[0.08] text-[#64748B] hover:border-white/[0.14] hover:text-[#94A3B8] hover:bg-white/[0.02] transition-all text-sm">
              <Plus size={15} />
              New Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
