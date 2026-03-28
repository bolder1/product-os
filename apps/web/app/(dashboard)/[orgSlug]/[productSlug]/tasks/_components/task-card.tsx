'use client'

import { motion } from 'framer-motion'
import { Calendar, Link2 } from 'lucide-react'
import { type Task, PRIORITY_CONFIG } from '../_data/mock-tasks'

interface TaskCardProps {
  task: Task
  index: number
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

export function TaskCard({ task, index, onDragStart }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority]

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

      {/* Linked node */}
      {task.linkedNode && (
        <div className="flex items-center gap-1.5 mb-3">
          <Link2 className="w-3 h-3 text-[#64748B]" />
          <span className="text-[10px] text-[#64748B] bg-white/[0.05] px-1.5 py-0.5 rounded">
            {task.linkedNode.kind}: {task.linkedNode.label}
          </span>
        </div>
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
