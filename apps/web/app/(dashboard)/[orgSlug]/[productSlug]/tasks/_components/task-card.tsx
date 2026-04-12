'use client'

import { motion } from 'framer-motion'
import { Calendar, Link2, ExternalLink } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { type Task, PRIORITY_CONFIG } from '../_data/mock-tasks'

interface TaskCardProps {
  task: Task
  index: number
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

/** Map a node kind to the studio route where it lives */
const KIND_TO_STUDIO: Record<string, string> = {
  Feature: 'planner',
  feature: 'planner',
  Module: 'planner',
  module: 'planner',
  Plan: 'planner',
  plan: 'planner',
  Component: 'components',
  component: 'components',
  Page: 'pages',
  page: 'pages',
  Screen: 'design',
  screen: 'design',
  Workflow: 'workflows',
  workflow: 'workflows',
  Entity: 'workflows',
  entity: 'workflows',
  Token: 'brand',
  token: 'brand',
  Route: 'code',
  route: 'code',
  Journey: 'design',
  journey: 'design',
  Asset: 'graphics',
  asset: 'graphics',
  Release: 'releases',
  release: 'releases',
  Task: 'tasks',
  task: 'tasks',
  Approval: 'approvals',
  approval: 'approvals',
  Insight: 'analytics',
  insight: 'analytics',
}

export function TaskCard({ task, index, onDragStart }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority]
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  const productSlug = params?.productSlug as string

  const handleLinkedNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!task.linkedNode) return
    const studio = KIND_TO_STUDIO[task.linkedNode.kind] ?? 'planner'
    router.push(`/${orgSlug}/${productSlug}/${studio}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task.id)}
      className="group cursor-grab active:cursor-grabbing rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(59,130,246,0.06)] hover:-translate-y-0.5"
    >
      {/* Title */}
      <h4 className="text-sm font-semibold text-[#F1F5F9] leading-snug mb-1">
        {task.title}
      </h4>

      {/* Description preview */}
      <p className="text-xs text-[#64748B] leading-relaxed truncate mb-3">
        {task.description}
      </p>

      {/* Linked node — clickable to navigate to source studio */}
      {task.linkedNode && (
        <button
          onClick={handleLinkedNodeClick}
          className="flex items-center gap-1.5 mb-3 group/link hover:opacity-80 transition-opacity"
        >
          <Link2 className="w-3 h-3 text-[var(--accent)]" />
          <span className="text-[10px] text-[var(--accent-text)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">
            {task.linkedNode.kind}: {task.linkedNode.label}
          </span>
          <ExternalLink className="w-2.5 h-2.5 text-[var(--accent)] opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </button>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              color: priority.color,
              backgroundColor: `${priority.color}15`,
            }}
          >
            {priority.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Due date */}
          <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Assignee avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
            style={{ backgroundColor: task.assignee.color }}
            title={task.assignee.name}
          >
            {task.assignee.initials}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
