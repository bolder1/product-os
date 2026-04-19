'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import {
  Search,
  Compass,
  Cpu,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Hash,
  LayoutGrid,
  Wand2,
  BarChart3,
  Lightbulb,
  GitBranch,
  Bell,
  MessageSquare,
  Settings,
  FlaskConical,
} from 'lucide-react'
import { useTaskStore } from '../../lib/task-store'
import { useComputerModeStore } from '../../lib/computer-mode-store'
import { useGraphStore } from '../../lib/graph-store'
import type { NodeKind } from '../../lib/graph-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CommandCategory = 'studio' | 'task' | 'ai_skill' | 'action' | 'recent' | 'graph'

interface Command {
  id: string
  label: string
  description?: string
  category: CommandCategory
  icon: typeof Search
  color?: string
  shortcut?: string
  action: () => void
}

/* ------------------------------------------------------------------ */
/*  Studio nav items                                                   */
/* ------------------------------------------------------------------ */

const STUDIOS = [
  { key: 'planner',    label: 'Product Planner',     icon: Compass,      section: 'plan'    },
  { key: 'templates',  label: 'Template Gallery',     icon: LayoutGrid,   section: 'plan'    },
  { key: 'canvas',     label: 'Canvas Planner',       icon: Hash,         section: 'plan'    },
  { key: 'brand',      label: 'Brand Builder',        icon: Sparkles,     section: 'build'   },
  { key: 'components', label: 'Component Builder',    icon: LayoutGrid,   section: 'build'   },
  { key: 'design',     label: 'Design Studio',        icon: Wand2,        section: 'build'   },
  { key: 'workflows',  label: 'Workflow Builder',     icon: GitBranch,    section: 'build'   },
  { key: 'pages',      label: 'Page Builder',         icon: Hash,         section: 'build'   },
  { key: 'graphics',   label: 'Graphics Studio',      icon: Sparkles,     section: 'build'   },
  { key: 'code',       label: 'Code Studio',          icon: GitBranch,    section: 'ship'    },
  { key: 'handoff',    label: 'Dev Handoff',          icon: ArrowRight,   section: 'ship'    },
  { key: 'releases',   label: 'Release Center',       icon: FlaskConical, section: 'ship'    },
  { key: 'testing',    label: 'Test Center',          icon: FlaskConical, section: 'ship'    },
  { key: 'analytics',  label: 'Analytics Builder',    icon: BarChart3,    section: 'operate' },
  { key: 'control-tower', label: 'Control Tower',     icon: Compass,      section: 'operate' },
  { key: 'tasks',      label: 'Tasks',                icon: CheckSquare,  section: 'operate' },
  { key: 'approvals',  label: 'Approvals',            icon: CheckSquare,  section: 'operate' },
  { key: 'notifications', label: 'Notifications',     icon: Bell,         section: 'operate' },
  { key: 'decisions',  label: 'Decision Log',         icon: MessageSquare,section: 'operate' },
  { key: 'graph-explorer', label: 'Graph Explorer',   icon: Hash,         section: 'operate' },
  { key: 'settings',   label: 'Settings',             icon: Settings,     section: 'operate' },
]

/* ------------------------------------------------------------------ */
/*  AI Skills                                                           */
/* ------------------------------------------------------------------ */

const AI_SKILLS = [
  { id: 'suggest', label: 'AI Suggest', description: 'Surface improvement ideas for this studio', icon: Lightbulb, color: '#F59E0B' },
  { id: 'scaffold', label: 'AI Scaffold', description: 'Generate draft artifacts from product graph', icon: Wand2, color: 'var(--accent-text)' },
  { id: 'analyze', label: 'AI Analyze', description: 'Deep analysis of gaps and dependencies', icon: BarChart3, color: '#06B6D4' },
  { id: 'computer-mode', label: 'Open Computer Mode', description: 'Multi-step AI execution with action log', icon: Cpu, color: '#10B981' },
]

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t.includes(q)) return true
  // Simple fuzzy: all chars must appear in order
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

function score(query: string, target: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 90
  if (t.includes(q)) return 70
  return 30
}

/* ------------------------------------------------------------------ */
/*  CategoryBadge                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_STYLES: Record<CommandCategory, { label: string; bg: string; color: string }> = {
  studio:    { label: 'Studio',    bg: 'bg-blue-500/10',    color: 'text-blue-400'    },
  task:      { label: 'Task',      bg: 'bg-amber-500/10',   color: 'text-amber-400'   },
  ai_skill:  { label: 'AI',        bg: 'bg-purple-500/10',  color: 'text-purple-400'  },
  action:    { label: 'Action',    bg: 'bg-emerald-500/10', color: 'text-emerald-400' },
  recent:    { label: 'Recent',    bg: 'bg-white/[0.06]',   color: 'text-[#94A3B8]'   },
  graph:     { label: 'Graph',     bg: 'bg-cyan-500/10',    color: 'text-cyan-400'    },
}

/** Map a graph node kind to the product studio route that owns it */
function kindToStudio(kind: NodeKind): string {
  switch (kind) {
    case 'feature': case 'plan': case 'module': return 'features'
    case 'page': case 'route': return 'pages'
    case 'screen': return 'design'
    case 'component': case 'variant': return 'components'
    case 'token': case 'asset': return 'brand'
    case 'workflow': case 'entity': case 'field': return 'workflows'
    case 'task': case 'approval': return 'tasks'
    case 'analytics_dashboard': case 'analytics_event': case 'insight': case 'experiment': return 'analytics'
    case 'release': return 'releases'
    case 'handoff_item': return 'handoff'
    case 'test_suite': case 'test_run': case 'test_coverage': return 'testing'
    case 'connector_binding': case 'mcp_binding': return 'connectors'
    case 'skill_action': case 'computer_action': return 'ai-skills'
    default: return 'graph-explorer'
  }
}

/** Human label for a node kind */
function kindLabel(kind: NodeKind): string {
  const map: Partial<Record<NodeKind, string>> = {
    feature: 'Feature', plan: 'Plan', module: 'Module',
    page: 'Page', route: 'Route', screen: 'Screen',
    component: 'Component', variant: 'Variant',
    token: 'Token', asset: 'Asset',
    workflow: 'Workflow', entity: 'Entity', field: 'Field',
    task: 'Task', approval: 'Approval',
    insight: 'Insight', release: 'Release',
    handoff_item: 'Handoff', connector_binding: 'Connector',
    skill_action: 'AI Skill', test_suite: 'Test Suite',
  }
  return map[kind] ?? kind
}

/** Pick an accent color per node kind */
function kindColor(kind: NodeKind): string {
  if (['feature', 'plan', 'module'].includes(kind)) return '#3B82F6'
  if (['page', 'route', 'screen'].includes(kind)) return '#8B5CF6'
  if (['component', 'variant'].includes(kind)) return '#EC4899'
  if (['token', 'asset'].includes(kind)) return '#F59E0B'
  if (['workflow', 'entity', 'field'].includes(kind)) return '#10B981'
  if (['task', 'approval'].includes(kind)) return '#F97316'
  if (['insight', 'analytics_dashboard'].includes(kind)) return '#06B6D4'
  return '#6398FF'
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  productSlug: string
  currentStudio: string
  productId?: string
}

export function CommandPalette({ isOpen, onClose, orgSlug, productSlug, currentStudio, productId }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const openComputerMode = useComputerModeStore((s) => s.open)
  const setCommandInput = useComputerModeStore((s) => s.setCommandInput)

  const tasks = useTaskStore((s) => s.tasks)

  // Graph nodes for live search
  const graphNodes = useGraphStore((s) =>
    productId
      ? s.nodes.filter((n) => n.productId === productId && !['product', 'plan', 'connector_binding', 'mcp_binding', 'computer_action'].includes(n.kind))
      : []
  )

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const navigate = useCallback((path: string) => {
    router.push(`/${orgSlug}/${productSlug}/${path}`)
    onClose()
  }, [router, orgSlug, productSlug, onClose])

  /* ── Build command list ─────────────────────────────────────────── */
  const allCommands = useMemo((): Command[] => {
    const base: Command[] = []

    // Studio navigation
    STUDIOS.forEach((s) => {
      base.push({
        id: `studio-${s.key}`,
        label: s.label,
        description: `Navigate to ${s.section} › ${s.label}`,
        category: 'studio',
        icon: s.icon,
        color: s.key === currentStudio ? 'var(--accent-text)' : undefined,
        action: () => navigate(s.key),
      })
    })

    // AI Skills
    AI_SKILLS.forEach((skill) => {
      base.push({
        id: `skill-${skill.id}`,
        label: skill.label,
        description: skill.description,
        category: 'ai_skill',
        icon: skill.icon,
        color: skill.color,
        action: () => {
          if (skill.id === 'computer-mode') {
            openComputerMode()
          } else {
            openComputerMode()
            setCommandInput(`${skill.id === 'suggest' ? 'Suggest improvements for' : skill.id === 'scaffold' ? 'Scaffold' : 'Analyze'} ${currentStudio}`)
          }
          onClose()
        },
      })
    })

    // Recent open tasks (up to 5)
    tasks
      .filter((t) => t.status !== 'done')
      .slice(0, 5)
      .forEach((t) => {
        base.push({
          id: `task-${t.id}`,
          label: t.title,
          description: `${t.status} · ${t.studio ?? 'general'}`,
          category: 'task',
          icon: CheckSquare,
          action: () => {
            navigate('tasks')
          },
        })
      })

    // Graph nodes — only shown when there is a search query
    graphNodes.forEach((node) => {
      const studio = kindToStudio(node.kind)
      const color = kindColor(node.kind)
      base.push({
        id: `graph-${node.id}`,
        label: node.label,
        description: `${kindLabel(node.kind)} · ${studio}`,
        category: 'graph',
        icon: Hash,
        color,
        action: () => navigate(studio),
      })
    })

    // Quick actions
    base.push({
      id: 'action-new-task',
      label: 'Create new task',
      description: 'Add a task to the current product',
      category: 'action',
      icon: CheckSquare,
      shortcut: '⌘T',
      action: () => navigate('tasks'),
    })
    base.push({
      id: 'action-new-release',
      label: 'Start a release',
      description: 'Begin release readiness check',
      category: 'action',
      icon: FlaskConical,
      action: () => navigate('releases'),
    })
    base.push({
      id: 'action-settings',
      label: 'Product settings',
      description: 'Configure product, members, and changelog',
      category: 'action',
      icon: Settings,
      shortcut: '⌘,',
      action: () => navigate('settings'),
    })

    return base
  }, [currentStudio, tasks, graphNodes, navigate, openComputerMode, setCommandInput, onClose])

  /* ── Filter + rank ──────────────────────────────────────────────── */
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Default: show AI skills first, then studios, then actions — no graph nodes
      return allCommands
        .filter((c) => c.category !== 'graph' && (['ai_skill', 'action'].includes(c.category) || c.id === `studio-${currentStudio}`))
        .slice(0, 12)
    }

    return allCommands
      .filter((c) => fuzzyMatch(query, c.label) || fuzzyMatch(query, c.description ?? ''))
      .sort((a, b) => {
        // Exact graph node match should surface high
        const aScore = score(query, a.label) + (a.category === 'graph' && a.label.toLowerCase().includes(query.toLowerCase()) ? 5 : 0)
        const bScore = score(query, b.label) + (b.category === 'graph' && b.label.toLowerCase().includes(query.toLowerCase()) ? 5 : 0)
        return bScore - aScore
      })
      .slice(0, 14)
  }, [query, allCommands, currentStudio])

  /* ── Keyboard navigation ────────────────────────────────────────── */
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filteredCommands[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[61] w-full max-w-[560px] bg-[#0B1120] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
              <Search size={15} className="text-[#64748B] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search studios, graph nodes, tasks, AI skills…"
                className="flex-1 bg-transparent text-[14px] text-[#F1F5F9] placeholder-[#475569] outline-none"
              />
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {graphNodes.length > 0 && !query && (
                  <span className="text-[9px] text-[#475569] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                    {graphNodes.length} nodes
                  </span>
                )}
                <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-[#64748B] font-mono">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto py-1.5">
              {filteredCommands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Search size={18} className="text-[#475569] mb-2" />
                  <p className="text-[12px] text-[#64748B]">No results for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                filteredCommands.map((cmd, i) => {
                  const Icon = cmd.icon
                  const catStyle = CATEGORY_STYLES[cmd.category]
                  const isSelected = i === selectedIndex

                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: cmd.color ? `${cmd.color}20` : 'rgba(255,255,255,0.04)' }}
                      >
                        <Icon size={14} style={{ color: cmd.color ?? '#64748B' }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#F1F5F9] truncate">{cmd.label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.color} shrink-0`}>
                            {catStyle.label}
                          </span>
                        </div>
                        {cmd.description && (
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">{cmd.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cmd.shortcut && (
                          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-[#64748B] font-mono">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && <ArrowRight size={12} className="text-[#475569]" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-3 text-[10px] text-[#475569]">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> select</span>
                <span><kbd className="font-mono">esc</kbd> close</span>
              </div>
              <span className="text-[10px] text-[#475569]">
                {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
