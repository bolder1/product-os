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
// Constants — tone-based (R20 palette consolidation)
// Icons + labels carry identity; tone carries meaning.
// ---------------------------------------------------------------------------

type Tone = 'error' | 'warning' | 'info' | 'success' | 'neutral'

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; tone: Tone }> = {
  critical: { label: 'Critical', tone: 'error' },
  high:     { label: 'High',     tone: 'warning' },
  medium:   { label: 'Medium',   tone: 'info' },
  low:      { label: 'Low',      tone: 'neutral' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; tone: Tone; icon: React.ReactNode }> = {
  backlog:       { label: 'Backlog',     tone: 'neutral', icon: <Circle size={12} /> },
  todo:          { label: 'To Do',       tone: 'neutral', icon: <Circle size={12} /> },
  'in-progress': { label: 'In Progress', tone: 'info',    icon: <Zap size={12} /> },
  done:          { label: 'Done',        tone: 'success', icon: <CheckCircle2 size={12} /> },
}

const APPROVAL_CONFIG: Record<'pending' | 'approved' | 'rejected', { label: string; tone: Tone; icon: React.ReactNode }> = {
  pending:  { label: 'Pending approval',  tone: 'warning', icon: <Clock size={12} /> },
  approved: { label: 'Approved',          tone: 'success', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Changes requested', tone: 'error',   icon: <AlertTriangle size={12} /> },
}

// Pre-composed tone → classname pairs. CSS vars don't survive template concat,
// so we keep the pairings explicit here.
const toneText: Record<Tone, string> = {
  error: 'text-[var(--color-error)]',
  warning: 'text-[var(--color-warning)]',
  info: 'text-[var(--accent)]',
  success: 'text-[var(--color-success)]',
  neutral: 'text-[var(--text-tertiary)]',
}
const toneBgSoft: Record<Tone, string> = {
  error: 'bg-[var(--color-error-muted)]',
  warning: 'bg-[var(--color-warning-muted)]',
  info: 'bg-[var(--accent-subtle)]',
  success: 'bg-[var(--color-success-muted)]',
  neutral: 'bg-[var(--bg-inset)]',
}
const toneBgSolid: Record<Tone, string> = {
  error: 'bg-[var(--color-error)]',
  warning: 'bg-[var(--color-warning)]',
  info: 'bg-[var(--accent)]',
  success: 'bg-[var(--color-success)]',
  neutral: 'bg-[var(--text-tertiary)]',
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group flex cursor-grab items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-3 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)]"
    >
      <GripVertical size={13} className="mt-0.5 shrink-0 text-[var(--border-default)] transition-colors group-hover:text-[var(--text-tertiary)]" />

      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-xs font-medium leading-relaxed text-[var(--text-primary)]">{task.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority */}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${toneBgSoft[priority.tone]} ${toneText[priority.tone]}`}>
            {priority.label}
          </span>
          {/* Estimate */}
          <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
            <Clock size={9} />
            {task.estimate}h
          </span>
          {/* Assignee */}
          {task.assignee && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
              <User size={9} />
              {task.assignee}
            </span>
          )}
          {/* Tags */}
          {task.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded bg-[var(--bg-inset)] px-1.5 py-0.5 text-[9px] text-[var(--text-tertiary)]">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onMove && (
          <button
            onClick={() => onMove(task.sprintId)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
            title={task.sprintId ? 'Move to backlog' : 'Add to sprint'}
          >
            {task.sprintId ? <ChevronRight size={11} className="rotate-180" /> : <ChevronRight size={11} />}
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--color-error-muted)] hover:text-[var(--color-error)]"
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
  const tone: Tone = over ? 'error' : pct > 80 ? 'warning' : 'success'

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-primary)]">Sprint Capacity</span>
        <span className={`font-mono text-xs ${toneText[tone]}`}>
          {used}h / {total}h {over && '⚠ Over capacity'}
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--bg-base)]">
        <motion.div
          className={`h-full rounded-full ${toneBgSolid[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {/* Per-assignee bars */}
      <div className="flex flex-col gap-1.5">
        {Object.entries(assignees).map(([name, hours]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-[var(--text-tertiary)]">{name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-base)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.min((hours / (total / Object.keys(assignees).length)) * 100, 100)}%` }}
              />
            </div>
            <span className="w-6 text-right text-[10px] text-[var(--text-tertiary)]">{hours}h</span>
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
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-success-border)] bg-[var(--color-success-muted)] px-3 py-2">
        <CheckCircle2 size={14} className="text-[var(--color-success)]" />
        <span className="text-xs font-medium text-[var(--color-success)]">Sprint approved — committed to delivery</span>
      </div>
    )
  }

  if (sprint.approvalStatus === 'pending') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-muted)] px-3 py-2">
        <Clock size={14} className="text-[var(--color-warning)]" />
        <span className="text-xs font-medium text-[var(--color-warning)]">Awaiting manager approval…</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={15} className="text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">Commit Sprint for Approval</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
        Once you commit this sprint, it will be sent to your manager for approval before tasks move to &quot;In Progress&quot;.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a note for your manager (optional)…"
        rows={2}
        className="mb-2 w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition focus:border-[var(--accent)] focus:outline-none"
      />
      <button
        onClick={submitRequest}
        disabled={requesting}
        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors ${
          requesting
            ? 'cursor-not-allowed bg-[var(--bg-inset)] text-[var(--text-tertiary)]'
            : 'bg-[var(--accent)] text-[var(--color-white)] hover:bg-[var(--accent-hover)]'
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
    <div className="flex w-[340px] min-w-[340px] flex-col gap-3">
      {/* Sprint header */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-inset)] p-4">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{sprint.name}</p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{dateLabel}</p>
          </div>
          {approvalMeta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${toneBgSoft[approvalMeta.tone]} ${toneText[approvalMeta.tone]}`}>
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
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <span className={toneText[cfg.tone]}>{cfg.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{cfg.label}</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">({group.length})</span>
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
                <div className="flex h-10 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--border-default)]">Drop tasks here</span>
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
      <div className="flex w-[300px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-[var(--text-tertiary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Backlog</span>
              <span className="rounded-full bg-[var(--bg-inset)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">{backlogTasks.length}</span>
            </div>
            <button
              onClick={generateAITasks}
              disabled={generating}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                generating
                  ? 'cursor-not-allowed bg-[var(--bg-inset)] text-[var(--text-tertiary)]'
                  : 'bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent-muted)]'
              }`}
            >
              {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {generating ? 'Generating…' : 'AI suggest'}
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">Drag tasks into sprints or click → to move them</p>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
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
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-xs text-[var(--text-tertiary)]">All tasks are in sprints</p>
            </div>
          )}
        </div>
      </div>

      {/* Sprint columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max gap-5 p-5">
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
          <div className="flex w-[220px] min-w-[220px] flex-col gap-3">
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-default)] p-4 text-sm text-[var(--text-tertiary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-secondary)]">
              <Plus size={15} />
              New Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
