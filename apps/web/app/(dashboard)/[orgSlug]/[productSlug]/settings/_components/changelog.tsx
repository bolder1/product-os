'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  Filter,
  ChevronDown,
  Rocket,
  Bug,
  Settings,
  Users,
  Layers,
  Code,
} from 'lucide-react'

type Category = 'Feature' | 'Bug Fix' | 'Configuration' | 'Team' | 'Deployment' | 'Architecture'

interface ChangelogEntry {
  id: string
  timestamp: string
  actor: { name: string; initials: string; color: string }
  action: string
  category: Category
  description: string
  phase: number
}

const CATEGORY_CONFIG: Record<Category, { color: string; icon: typeof Rocket }> = {
  Feature:       { color: '#3B82F6', icon: Rocket },
  'Bug Fix':     { color: '#F43F5E', icon: Bug },
  Configuration: { color: '#F59E0B', icon: Settings },
  Team:          { color: '#8B5CF6', icon: Users },
  Deployment:    { color: '#10B981', icon: Layers },
  Architecture:  { color: '#06B6D4', icon: Code },
}

const PHASE_CONFIG: Record<number, { label: string; gradient: string }> = {
  1: { label: 'Phase 1 -- Foundation', gradient: 'from-[#3B82F6]/20 to-transparent' },
  2: { label: 'Phase 2 -- Core Studios', gradient: 'from-[#8B5CF6]/20 to-transparent' },
  3: { label: 'Phase 3 -- Advanced Studios', gradient: 'from-[#10B981]/20 to-transparent' },
}

const changelogData: ChangelogEntry[] = [
  // Phase 1
  { id: 'cl-01', timestamp: '2026-02-01T09:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Created initial monorepo scaffold', category: 'Architecture', description: 'Set up Turborepo with apps/web, packages/db, packages/ui, and shared config. Configured TypeScript paths, ESLint, and Tailwind CSS v4.', phase: 1 },
  { id: 'cl-02', timestamp: '2026-02-03T14:30:00Z', actor: { name: 'Charlie Kim', initials: 'CK', color: '#14B8A6' }, action: 'Database schema created', category: 'Architecture', description: 'Defined Drizzle ORM schema with organizations, products, users, nodes, edges, and events tables. Added migration scripts.', phase: 1 },
  { id: 'cl-03', timestamp: '2026-02-05T11:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Auth system configured', category: 'Configuration', description: 'Integrated authentication with session management, OAuth providers (GitHub, Google), and role-based access control middleware.', phase: 1 },
  { id: 'cl-04', timestamp: '2026-02-08T16:00:00Z', actor: { name: 'Charlie Kim', initials: 'CK', color: '#14B8A6' }, action: 'Graph package built', category: 'Architecture', description: 'Created @product-os/graph with typed node/edge operations, traversal queries, and cascade delete logic for the product graph.', phase: 1 },
  { id: 'cl-05', timestamp: '2026-02-10T10:30:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Event bus configured', category: 'Configuration', description: 'Set up @product-os/events with typed publish/subscribe, event history logging, and cross-studio notification routing.', phase: 1 },

  // Phase 2
  { id: 'cl-06', timestamp: '2026-02-15T09:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Product Planner built', category: 'Feature', description: 'Launched the Product Planner wizard with vision statement, audience definition, feature backlog, and milestone planning steps.', phase: 2 },
  { id: 'cl-07', timestamp: '2026-02-18T13:00:00Z', actor: { name: 'Bob Rivera', initials: 'BR', color: '#EC4899' }, action: 'Template Gallery launched', category: 'Feature', description: 'Built the template gallery with search, category filtering, preview cards, and one-click template instantiation into any studio.', phase: 2 },
  { id: 'cl-08', timestamp: '2026-02-22T15:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Control Tower dashboard', category: 'Feature', description: 'Created the Control Tower with health score ring, sprint burndown, activity feed, studio metrics grid, and team velocity chart.', phase: 2 },
  { id: 'cl-09', timestamp: '2026-02-26T10:00:00Z', actor: { name: 'Eve Santos', initials: 'ES', color: '#06B6D4' }, action: 'Task system with kanban board', category: 'Feature', description: 'Implemented tasks studio with drag-and-drop kanban board, list view, filters, priority badges, and AI task suggestions placeholder.', phase: 2 },
  { id: 'cl-10', timestamp: '2026-03-01T11:00:00Z', actor: { name: 'Bob Rivera', initials: 'BR', color: '#EC4899' }, action: 'Brand Builder with AI panel', category: 'Feature', description: 'Built Brand studio with color palette editor, typography management, logo upload, and AI brand copilot panel for suggestions.', phase: 2 },
  { id: 'cl-11', timestamp: '2026-03-03T14:00:00Z', actor: { name: 'Dana Patel', initials: 'DP', color: '#F97316' }, action: 'Fixed kanban drag offset bug', category: 'Bug Fix', description: 'Resolved issue where task cards would snap to incorrect positions when dragged across columns in Firefox and Safari.', phase: 2 },
  { id: 'cl-12', timestamp: '2026-03-04T09:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Added Eve Santos to team', category: 'Team', description: 'Invited Eve Santos as FE Developer with access to Components, Design, Pages, Code, Tasks, and Workflows studios.', phase: 2 },

  // Phase 3
  { id: 'cl-13', timestamp: '2026-03-10T09:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Workflow Builder with state machines', category: 'Feature', description: 'Launched Workflow studio with visual state machine editor powered by React Flow, transition rules, guard conditions, and action triggers.', phase: 3 },
  { id: 'cl-14', timestamp: '2026-03-14T11:00:00Z', actor: { name: 'Eve Santos', initials: 'ES', color: '#06B6D4' }, action: 'Component Builder with variants', category: 'Feature', description: 'Built Component studio with variant management, prop editor, live preview panel, code generation, and design token binding.', phase: 3 },
  { id: 'cl-15', timestamp: '2026-03-17T14:00:00Z', actor: { name: 'Bob Rivera', initials: 'BR', color: '#EC4899' }, action: 'Page Builder with sections', category: 'Feature', description: 'Created Page studio with drag-and-drop section ordering, responsive preview, SEO metadata editor, and component slot mapping.', phase: 3 },
  { id: 'cl-16', timestamp: '2026-03-20T10:00:00Z', actor: { name: 'Bob Rivera', initials: 'BR', color: '#EC4899' }, action: 'Design Studio with inspect mode', category: 'Feature', description: 'Launched Design studio with layer panel, property inspector, spacing overlay, Figma import bridge, and annotation tools.', phase: 3 },
  { id: 'cl-17', timestamp: '2026-03-23T15:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Approvals system with timeline', category: 'Feature', description: 'Built Approvals studio with multi-step approval workflows, timeline visualization, comment threads, and status tracking across studios.', phase: 3 },
  { id: 'cl-18', timestamp: '2026-03-25T09:00:00Z', actor: { name: 'Charlie Kim', initials: 'CK', color: '#14B8A6' }, action: 'Deployed v0.2-rc to staging', category: 'Deployment', description: 'Provisioned staging environment and deployed release candidate v0.2 with all Phase 3 studios, seed data, and monitoring dashboards.', phase: 3 },
  { id: 'cl-19', timestamp: '2026-03-27T12:00:00Z', actor: { name: 'Dana Patel', initials: 'DP', color: '#F97316' }, action: 'Fixed sidebar collapse on route change', category: 'Bug Fix', description: 'Resolved sidebar unexpectedly collapsing in Firefox when navigating between studios due to stale animation state.', phase: 3 },
  { id: 'cl-20', timestamp: '2026-03-28T16:00:00Z', actor: { name: 'Alice Chen', initials: 'AC', color: '#8B5CF6' }, action: 'Configured Figma + GitHub integrations', category: 'Configuration', description: 'Connected Figma design sync and GitHub repository webhooks for automated code change tracking and design handoff.', phase: 3 },
]

const ALL_CATEGORIES: Category[] = ['Feature', 'Bug Fix', 'Configuration', 'Team', 'Deployment', 'Architecture']

export function Changelog() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    return changelogData.filter((entry) => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          entry.action.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.actor.name.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, selectedCategory])

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ChangelogEntry[]> = {}
    for (const entry of filtered) {
      const date = entry.timestamp.slice(0, 10)
      if (!groups[date]) groups[date] = []
      groups[date].push(entry)
    }
    return groups
  }, [filtered])

  // Determine which phases have entries
  const phasesInView = useMemo(() => {
    const phases = new Set<number>()
    for (const entry of filtered) phases.add(entry.phase)
    return phases
  }, [filtered])

  // Build a flat render list: phase markers + date groups
  const renderList = useMemo(() => {
    const items: Array<
      | { type: 'phase'; phase: number }
      | { type: 'date'; date: string; entries: ChangelogEntry[] }
    > = []

    let lastPhase = 0
    const dates = Object.keys(groupedByDate).sort()
    for (const date of dates) {
      const entries = groupedByDate[date]
      const entryPhase = entries[0].phase
      if (entryPhase !== lastPhase && phasesInView.has(entryPhase)) {
        items.push({ type: 'phase', phase: entryPhase })
        lastPhase = entryPhase
      }
      items.push({ type: 'date', date, entries })
    }
    return items
  }, [groupedByDate, phasesInView])

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search changelog..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            showFilters || selectedCategory !== 'all'
              ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
              : 'text-[#64748B] hover:text-[#94A3B8] bg-white/[0.04] hover:bg-white/[0.06]'
          }`}
        >
          <Filter size={14} />
          Filter
          <ChevronDown size={12} />
        </button>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#94A3B8] bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
          <Download size={14} />
          Export Changelog
        </button>
      </div>

      {/* Category filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-wrap pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-white/[0.1] text-[#F1F5F9]'
                    : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]'
                }`}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'text-white'
                        : 'hover:bg-white/[0.04]'
                    }`}
                    style={{
                      color: selectedCategory === cat ? cfg.color : '#64748B',
                      backgroundColor:
                        selectedCategory === cat ? `${cfg.color}20` : undefined,
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/[0.06]" />

        <div className="space-y-2">
          {renderList.map((item, idx) => {
            if (item.type === 'phase') {
              const pcfg = PHASE_CONFIG[item.phase]
              return (
                <motion.div
                  key={`phase-${item.phase}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`relative ml-0 py-3 px-5 rounded-lg bg-gradient-to-r ${pcfg.gradient} border border-white/[0.06] mb-4`}
                >
                  <span className="text-sm font-bold text-[#E2E8F0]">
                    {pcfg.label}
                  </span>
                </motion.div>
              )
            }

            // Date group
            return (
              <div key={item.date} className="space-y-1">
                {/* Sticky date header */}
                <div className="sticky top-0 z-10 flex items-center gap-3 py-2 bg-[#0a0f1e]/80 backdrop-blur-sm">
                  <div className="w-[37px] flex justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] ring-4 ring-[#0a0f1e]" />
                  </div>
                  <span className="text-xs font-semibold text-[#94A3B8]">
                    {formatDate(item.date)}
                  </span>
                </div>

                {/* Entries */}
                {item.entries.map((entry, entryIdx) => {
                  const catCfg = CATEGORY_CONFIG[entry.category]
                  const Icon = catCfg.icon
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: entryIdx * 0.04 }}
                      className="flex gap-3 ml-[37px] px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Actor avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.625rem] font-medium shrink-0"
                        style={{ backgroundColor: entry.actor.color }}
                      >
                        {entry.actor.initials}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#E2E8F0]">
                            {entry.actor.name}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-medium"
                            style={{
                              color: catCfg.color,
                              backgroundColor: `${catCfg.color}15`,
                            }}
                          >
                            <Icon size={10} />
                            {entry.category}
                          </span>
                          <span className="text-[0.625rem] text-[#475569]">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-[0.8125rem] text-[#CBD5E1]">
                          {entry.action}
                        </p>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Search size={28} className="text-[#1E293B] mb-3" />
              <p className="text-sm text-[#64748B]">No changelog entries found</p>
              <p className="text-xs text-[#475569] mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
