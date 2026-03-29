'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  Clock,
  Zap,
  Package,
  CheckSquare,
  LayoutGrid,
  // Studio icons
  Lightbulb,
  FileText,
  PenTool,
  Palette,
  Component,
  Paintbrush,
  GitBranch,
  Layers,
  Image,
  Code2,
  ArrowRightLeft,
  Rocket,
  Bug,
  ListTodo,
  ShieldCheck,
  Bell,
  BarChart3,
  Radio,
  Share2,
  Plus,
  Settings,
  Map,
} from 'lucide-react'
import {
  CommandPalette,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@product-os/ui'

import { useCommandPaletteStore, type RecentItem } from '../../lib/command-palette-store'
import { useProductStore } from '../../lib/product-store'
import { useTaskStore } from '../../lib/task-store'

// ---------------------------------------------------------------------------
// Studio definitions (19 studios)
// ---------------------------------------------------------------------------

interface StudioDef {
  key: string
  label: string
  description: string
  icon: React.ElementType
  href: string
}

const STUDIOS: StudioDef[] = [
  { key: 'planner', label: 'Product Planner', description: 'Define vision, goals, and journeys', icon: Lightbulb, href: '/planner' },
  { key: 'templates', label: 'Template Gallery', description: 'Browse and apply templates', icon: FileText, href: '/templates' },
  { key: 'canvas', label: 'Canvas', description: 'Business model and lean canvases', icon: PenTool, href: '/canvas' },
  { key: 'brand', label: 'Brand', description: 'Brand identity, colors, and typography', icon: Palette, href: '/brand' },
  { key: 'components', label: 'Components', description: 'Design system components', icon: Component, href: '/components' },
  { key: 'design', label: 'Design', description: 'UI/UX design and prototyping', icon: Paintbrush, href: '/design' },
  { key: 'workflow', label: 'Workflow', description: 'Business logic and data flows', icon: GitBranch, href: '/workflow' },
  { key: 'pages', label: 'Pages', description: 'Page layouts and routing', icon: Layers, href: '/pages' },
  { key: 'graphics', label: 'Graphics', description: 'Illustrations and visual assets', icon: Image, href: '/graphics' },
  { key: 'code', label: 'Code', description: 'Code generation and editing', icon: Code2, href: '/code' },
  { key: 'handoff', label: 'Handoff', description: 'Developer handoff specs', icon: ArrowRightLeft, href: '/handoff' },
  { key: 'releases', label: 'Releases', description: 'Release management and changelog', icon: Rocket, href: '/releases' },
  { key: 'testing', label: 'Testing', description: 'Test suites and QA tracking', icon: Bug, href: '/testing' },
  { key: 'tasks', label: 'Tasks', description: 'Task board and assignments', icon: ListTodo, href: '/tasks' },
  { key: 'approvals', label: 'Approvals', description: 'Review and approval workflows', icon: ShieldCheck, href: '/approvals' },
  { key: 'notifications', label: 'Notifications', description: 'Alerts and notification center', icon: Bell, href: '/notifications' },
  { key: 'analytics', label: 'Analytics', description: 'Metrics, dashboards, and insights', icon: BarChart3, href: '/analytics' },
  { key: 'control-tower', label: 'Control Tower', description: 'Cross-product oversight', icon: Radio, href: '/control-tower' },
  { key: 'graph-explorer', label: 'Graph Explorer', description: 'Explore the product graph', icon: Share2, href: '/graph-explorer' },
]

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

interface ActionDef {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href?: string
  action?: string
}

const ACTIONS: ActionDef[] = [
  { id: 'create-product', label: 'Create Product', description: 'Start a new product', icon: Plus, href: '/' },
  { id: 'open-planner', label: 'Open Planner', description: 'Launch the product planner wizard', icon: Map, href: '/planner' },
  { id: 'go-settings', label: 'Go to Settings', description: 'Manage organization settings', icon: Settings, href: '/settings' },
  { id: 'view-tasks', label: 'View All Tasks', description: 'See your task board', icon: ListTodo, href: '/tasks' },
  { id: 'view-analytics', label: 'View Analytics', description: 'Open analytics dashboard', icon: BarChart3, href: '/analytics' },
]

// ---------------------------------------------------------------------------
// Status badge colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748B',
  in_progress: '#3B82F6',
  in_review: '#F59E0B',
  done: '#10B981',
  blocked: '#F43F5E',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPaletteGlobal() {
  const router = useRouter()
  const isOpen = useCommandPaletteStore((s) => s.isOpen)
  const close = useCommandPaletteStore((s) => s.close)
  const toggle = useCommandPaletteStore((s) => s.toggle)
  const recentItems = useCommandPaletteStore((s) => s.recentItems)
  const addRecentItem = useCommandPaletteStore((s) => s.addRecentItem)
  const loadRecentItems = useCommandPaletteStore((s) => s.loadRecentItems)

  const products = useProductStore((s) => s.products)
  const tasks = useTaskStore((s) => s.tasks)

  // Load recent items from localStorage on mount
  useEffect(() => {
    loadRecentItems()
  }, [loadRecentItems])

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggle])

  // Navigate helper
  const navigate = useCallback(
    (href: string, item?: { id: string; label: string; description?: string; icon?: string }) => {
      if (item) {
        addRecentItem({ id: item.id, label: item.label, description: item.description, href, icon: item.icon })
      }
      close()
      router.push(href)
    },
    [router, close, addRecentItem],
  )

  // Memoize the first 20 tasks to keep the list manageable
  const displayTasks = useMemo(() => tasks.slice(0, 20), [tasks])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-[#060918]/80 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            key="cp-dialog"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[15%] z-[100] w-full max-w-xl -translate-x-1/2 px-4"
          >
            <CommandPalette
              open={true}
              onOpenChange={(open) => { if (!open) close() }}
              placeholder="Search products, studios, tasks, actions..."
            >
              {/* ── Recent ── */}
              {recentItems.length > 0 && (
                <>
                  <CommandGroup heading="Recent">
                    {recentItems.map((item: RecentItem) => (
                      <CommandItem
                        key={`recent-${item.id}`}
                        value={`recent ${item.label}`}
                        onSelect={() => navigate(item.href, item)}
                      >
                        <Clock size={16} className="shrink-0 text-[#64748B]" />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.description && (
                            <span className="text-xs text-[#64748B] truncate">{item.description}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* ── Studios ── */}
              <CommandGroup heading="Studios">
                {STUDIOS.map((studio) => {
                  const Icon = studio.icon
                  return (
                    <CommandItem
                      key={`studio-${studio.key}`}
                      value={`studio ${studio.label} ${studio.description}`}
                      onSelect={() =>
                        navigate(studio.href, {
                          id: `studio-${studio.key}`,
                          label: studio.label,
                          description: studio.description,
                        })
                      }
                    >
                      <Icon size={16} className="shrink-0 text-[#6366F1]" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{studio.label}</span>
                        <span className="text-xs text-[#64748B] truncate">{studio.description}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              <CommandSeparator />

              {/* ── Products ── */}
              {products.length > 0 && (
                <>
                  <CommandGroup heading="Products">
                    {products.map((p) => (
                      <CommandItem
                        key={`product-${p.id}`}
                        value={`product ${p.name} ${p.description}`}
                        onSelect={() =>
                          navigate(`/${p.orgSlug}/${p.slug}`, {
                            id: `product-${p.id}`,
                            label: p.name,
                            description: p.description,
                          })
                        }
                      >
                        <Package size={16} className="shrink-0" style={{ color: p.color }} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{p.icon} {p.name}</span>
                            <span
                              className="text-[0.625rem] px-1.5 py-0.5 rounded-full capitalize"
                              style={{
                                backgroundColor: p.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
                                color: p.status === 'active' ? '#10B981' : '#64748B',
                              }}
                            >
                              {p.status}
                            </span>
                          </div>
                          <span className="text-xs text-[#64748B] truncate">{p.description}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* ── Tasks ── */}
              {displayTasks.length > 0 && (
                <>
                  <CommandGroup heading="Tasks">
                    {displayTasks.map((t) => (
                      <CommandItem
                        key={`task-${t.id}`}
                        value={`task ${t.title} ${t.assignee.name} ${t.status} ${t.studio}`}
                        onSelect={() =>
                          navigate(`/tasks`, {
                            id: `task-${t.id}`,
                            label: t.title,
                            description: `${t.status} — ${t.assignee.name}`,
                          })
                        }
                      >
                        <CheckSquare size={16} className="shrink-0" style={{ color: STATUS_COLORS[t.status] ?? '#64748B' }} />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{t.title}</span>
                            <span
                              className="text-[0.625rem] px-1.5 py-0.5 rounded-full capitalize whitespace-nowrap"
                              style={{
                                backgroundColor: `${STATUS_COLORS[t.status] ?? '#64748B'}20`,
                                color: STATUS_COLORS[t.status] ?? '#64748B',
                              }}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-xs text-[#64748B] truncate">
                            {t.assignee.name} &middot; {t.studio}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* ── Actions ── */}
              <CommandGroup heading="Actions">
                {ACTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={`action-${action.id}`}
                      value={`action ${action.label} ${action.description}`}
                      onSelect={() => {
                        if (action.href) {
                          navigate(action.href, {
                            id: `action-${action.id}`,
                            label: action.label,
                            description: action.description,
                          })
                        }
                      }}
                    >
                      <Icon size={16} className="shrink-0 text-[#F59E0B]" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{action.label}</span>
                        <span className="text-xs text-[#64748B] truncate">{action.description}</span>
                      </div>
                      {action.id === 'create-product' && (
                        <CommandShortcut>Ctrl+N</CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandPalette>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
