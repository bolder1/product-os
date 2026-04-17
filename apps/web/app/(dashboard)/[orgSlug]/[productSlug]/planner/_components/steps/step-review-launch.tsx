'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Target,
  Users,
  Layers,
  Database,
  LayoutGrid,
  Rocket,
  ChevronDown,
  ChevronUp,
  Edit3,
  Settings,
  UserPlus,
  Clock,
} from 'lucide-react'
import type { PlanData } from '../../page'
import {
  generateTasksFromPlan,
  getTasksByRole,
  ROLE_COLORS,
  type GeneratedTask,
  type OrgRole,
} from '../../_lib/task-generator'

/* ── Props ── */
interface StepReviewLaunchProps {
  planData: PlanData
  onEditStep: (step: number) => void
  onLaunch: () => void
  isLaunching?: boolean
  generatedTasks: GeneratedTask[]
  onTasksChange: (tasks: GeneratedTask[]) => void
}

/* ── Effort badge ── */
function EffortBadge({ effort }: { effort: 'S' | 'M' | 'L' }) {
  const config = {
    S: { label: 'S', color: '#10B981', bg: '#10B981' },
    M: { label: 'M', color: '#F59E0B', bg: '#F59E0B' },
    L: { label: 'L', color: '#F43F5E', bg: '#F43F5E' },
  }
  const c = config[effort]
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: c.bg + '15', color: c.color }}
    >
      {c.label}
    </span>
  )
}

/* ── Priority badge ── */
function PriorityBadge({ priority }: { priority: GeneratedTask['priority'] }) {
  const config: Record<string, { color: string }> = {
    critical: { color: '#F43F5E' },
    high: { color: '#F59E0B' },
    medium: { color: '#3B82F6' },
    low: { color: '#64748B' },
  }
  const c = config[priority] || config.medium
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
      style={{ backgroundColor: c.color + '15', color: c.color }}
    >
      {priority}
    </span>
  )
}

export default function StepReviewLaunch({
  planData,
  onEditStep,
  onLaunch,
  isLaunching = false,
  generatedTasks,
  onTasksChange,
}: StepReviewLaunchProps) {
  const [expandedRoles, setExpandedRoles] = useState<Set<OrgRole>>(new Set())
  const [showCustomize, setShowCustomize] = useState(false)

  const tasksByRole = useMemo(() => getTasksByRole(generatedTasks), [generatedTasks])

  const toggleRole = (role: OrgRole) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return next
    })
  }

  const removeTask = (taskId: string) => {
    onTasksChange(generatedTasks.filter((t) => t.id !== taskId))
  }

  /* ── Summary cards ── */
  const summaryCards = [
    {
      step: 1,
      label: 'Vision',
      value: planData.problem ? planData.problem.slice(0, 80) + (planData.problem.length > 80 ? '...' : '') : 'Not set',
      icon: <Lightbulb className="w-4 h-4" />,
      empty: !planData.problem,
    },
    {
      step: 1,
      label: 'Goals',
      value: `${planData.goals.length} goal${planData.goals.length !== 1 ? 's' : ''}`,
      icon: <Target className="w-4 h-4" />,
      empty: planData.goals.length === 0,
    },
    {
      step: 2,
      label: 'Personas',
      value: `${planData.personas.length} persona${planData.personas.length !== 1 ? 's' : ''}`,
      icon: <Users className="w-4 h-4" />,
      empty: planData.personas.length === 0,
    },
    {
      step: 2,
      label: 'Features',
      value: `${planData.features.length} feature${planData.features.length !== 1 ? 's' : ''}`,
      icon: <Layers className="w-4 h-4" />,
      empty: planData.features.length === 0,
    },
    {
      step: 3,
      label: 'Entities',
      value: `${planData.entities.length} entit${planData.entities.length !== 1 ? 'ies' : 'y'}`,
      icon: <Database className="w-4 h-4" />,
      empty: planData.entities.length === 0,
    },
    {
      step: 3,
      label: 'Studios',
      value: `${planData.activeStudios.length} active`,
      icon: <LayoutGrid className="w-4 h-4" />,
      empty: planData.activeStudios.length === 0,
    },
  ]

  const roles: OrgRole[] = ['Manager', 'Business Analyst', 'Product Designer', 'Frontend Dev', 'Backend Dev', 'QA']

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Review & Launch</h2>
        <p className="text-[#94A3B8] text-sm">
          Review your product plan and the auto-generated task breakdown. Customize tasks, then launch.
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {summaryCards.map((card, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onEditStep(card.step)}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-left hover:border-[#8B5CF6]/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  card.empty ? 'bg-white/[0.05] text-[#64748B]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                }`}
              >
                {card.icon}
              </div>
              <Edit3 className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">{card.label}</p>
            <p className={`text-xs mt-0.5 ${card.empty ? 'text-[#64748B] italic' : 'text-[#F1F5F9]'}`}>
              {card.value}
            </p>
          </motion.button>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">
          Auto-Generated Tasks ({generatedTasks.length})
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* ── Task Breakdown by Role ── */}
      {generatedTasks.length === 0 ? (
        <div className="text-center py-8 text-[#64748B] text-sm">
          Add features in Step 2 to auto-generate tasks.
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role, roleIndex) => {
            const roleTasks = tasksByRole[role] || []
            if (roleTasks.length === 0) return null
            const isExpanded = expandedRoles.has(role)
            const roleColor = ROLE_COLORS[role]

            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: roleIndex * 0.06 }}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
              >
                {/* Role header */}
                <button
                  onClick={() => toggleRole(role)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Role badge */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: roleColor + '15', color: roleColor }}
                  >
                    {role}
                  </span>

                  <span className="text-xs text-[#64748B]">
                    {roleTasks.length} task{roleTasks.length !== 1 ? 's' : ''}
                  </span>

                  <div className="ml-auto">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#64748B]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    )}
                  </div>
                </button>

                {/* Expanded task list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/[0.06]"
                    >
                      <div className="px-4 py-2 space-y-1.5">
                        {roleTasks.map((task, taskIndex) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: taskIndex * 0.03 }}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
                          >
                            <p className="text-sm text-[#F1F5F9] flex-1 min-w-0">{task.title}</p>

                            {/* Feature link */}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B] flex-shrink-0 max-w-[120px] truncate">
                              {task.feature}
                            </span>

                            <PriorityBadge priority={task.priority} />
                            <EffortBadge effort={task.effort} />

                            {showCustomize && (
                              <button
                                onClick={() => removeTask(task.id)}
                                className="text-[10px] text-[#F43F5E]/60 hover:text-[#F43F5E] transition-colors flex-shrink-0"
                              >
                                Remove
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Actions Row ── */}
      {generatedTasks.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-[#94A3B8] hover:bg-white/[0.08] transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showCustomize ? 'Done Customizing' : 'Customize Tasks'}
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-[#94A3B8] hover:bg-white/[0.08] transition-colors">
            <UserPlus className="w-4 h-4" />
            Assign Team Members
          </button>
        </div>
      )}

      {/* ── Launch Button ── */}
      <motion.button
        whileHover={isLaunching ? {} : { scale: 1.02 }}
        whileTap={isLaunching ? {} : { scale: 0.98 }}
        onClick={isLaunching ? undefined : onLaunch}
        disabled={isLaunching}
        className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-sm text-white font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#8B5CF6]/90 hover:to-[#7C3AED]/90 transition-all shadow-lg shadow-[#8B5CF6]/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLaunching ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Launching…
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Launch Product
            {generatedTasks.length > 0 && (
              <span className="text-xs opacity-70 ml-1">
                with {generatedTasks.length} tasks
              </span>
            )}
          </>
        )}
      </motion.button>
    </div>
  )
}
