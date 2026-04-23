'use client'

/**
 * R4 — Solo-Builder Living Workspace.
 *
 * Replaces the "Home" concept as the default landing for a product. A single
 * editorial surface tuned for one founder + AI:
 *
 *   1. What I'm building     — top active objects, Copilot-drafted next steps
 *   2. What AI proposes      — pending Computer Mode drafts (awaiting approval)
 *   3. What changed          — since-last-visit activity feed
 *   4. What's blocked        — validation / readiness gaps from the graph
 *   5. Ask Product OS        — always-visible Copilot prompt field
 *
 * Data sources are real stores where possible (tasks, approvals, notifications).
 * Copilot / Computer Mode surfaces render graceful empty states today and will
 * light up when R9 / R10 wire them in.
 */

import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Clock,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  MessageCircle,
  Sparkles,
  Send,
  FileCheck,
} from 'lucide-react'
import { PageHeader } from '@product-os/ui'
import { useProduct } from '../layout'
import { useAuth } from '../../../../lib/auth-context'
import { roleConfigs } from '../../../../lib/role-config'
import { useTaskStore } from '../../../../lib/task-store'
import { useApprovalStore } from '../../../../lib/approval-store'
import { useNotificationStore } from '../../../../lib/notification-store'

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function WorkspacePage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const { user } = useAuth()
  const basePath = `/${params.orgSlug}/${params.productSlug}`

  const tasks = useTaskStore((s) => s.tasks)
  const approvals = useApprovalStore((s) => s.requests)
  const notifications = useNotificationStore((s) => s.notifications)

  // Derived: what I'm building right now — most-recent in-progress tasks
  const activeWork = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done')
      .slice(0, 3)
  }, [tasks])

  const blockedItems = useMemo(() => {
    return [
      ...approvals.filter((r) => r.status === 'pending').slice(0, 3).map((r) => ({
        id: r.id,
        kind: 'approval' as const,
        title: r.title,
        studio: 'approvals',
        since: r.createdAt,
      })),
      ...tasks
        .filter((t) => t.status === 'in_review' || t.status === 'blocked')
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          kind: 'task' as const,
          title: t.title,
          studio: 'tasks',
          since: t.updatedAt ?? t.createdAt ?? new Date().toISOString(),
        })),
    ].slice(0, 5)
  }, [approvals, tasks])

  const recentChanges = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [notifications])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return 'Still here'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 21) return 'Good evening'
    return 'Good night'
  }, [])

  const firstName = (user?.name ?? 'there').split(' ')[0]
  const roleCfg = user ? roleConfigs[user.role] : null

  const [promptValue, setPromptValue] = useState('')
  const [promptSubmitting, setPromptSubmitting] = useState(false)
  async function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!promptValue.trim()) return
    setPromptSubmitting(true)
    setTimeout(() => {
      setPromptSubmitting(false)
      setPromptValue('')
    }, 800)
  }

  return (
    <div className="tool-workspace">
      <PageHeader
        eyebrow={roleCfg ? `${roleCfg.label} · Solo Builder` : 'Workspace'}
        title={`${greeting}, ${firstName}`}
        subtitle={
          product
            ? `You are inside ${product.name}. The graph is ready. Pick the thread you want to pull.`
            : 'Pick a product or create one to begin.'
        }
      />

      <div className="studio-body">
        {/* What I'm building */}
        <section className="studio-section">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={16} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
              <h2 className="t-h3 font-medium text-[var(--text-primary)]">What you are building</h2>
            </div>
            <Link
              href={`${basePath}/planner`}
              className="text-[var(--font-size-label)] text-[var(--accent-text)] hover:text-[var(--accent-hover)] inline-flex items-center gap-1 transition-colors duration-[var(--duration-fast)]"
            >
              Open Planner <ArrowRight size={12} />
            </Link>
          </div>

          {activeWork.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
              <CircleDashed size={24} strokeWidth={1.5} className="mx-auto text-[var(--text-tertiary)] mb-3" />
              <p className="t-body text-[var(--text-secondary)]">Nothing active yet. Start in the Planner to shape your first intent.</p>
              <Link
                href={`${basePath}/planner`}
                className="tool-btn tool-btn-primary mt-5 inline-flex"
              >
                Open Planner
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeWork.map((task) => (
                <Link
                  key={task.id}
                  href={`${basePath}/tasks`}
                  className="block rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 hover:border-[var(--border-strong)] transition-[border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:-translate-y-[1px]"
                >
                  <div className="flex items-center gap-2 mb-3 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    <CircleDashed size={12} />
                    <span>{task.status.replace('_', ' ')}</span>
                  </div>
                  <p className="t-body text-[var(--text-primary)] line-clamp-2 font-medium">{task.title}</p>
                  {task.description && (
                    <p className="mt-2 t-caption text-[var(--text-secondary)] line-clamp-2">{task.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-[var(--font-size-caption)] text-[var(--text-tertiary)]">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={11} className="text-[var(--accent-text)]" />
                      Next: Copilot draft
                    </span>
                    <span>{task.priority ?? 'normal'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* What AI proposes */}
        <section className="studio-section">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} strokeWidth={1.75} className="text-[var(--accent-text)]" />
              <h2 className="t-h3 font-medium text-[var(--text-primary)]">What AI is proposing</h2>
            </div>
            <span className="text-[var(--font-size-caption)] text-[var(--text-tertiary)] inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] inline-block" />
              Computer Mode · Suggest
            </span>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] text-[var(--accent-text)] shrink-0">
                <Lightbulb size={18} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="t-body text-[var(--text-primary)]">
                  No pending drafts. When Copilot proposes a change — a new page, a workflow
                  edit, a brand token tweak — it will appear here for you to preview and approve.
                </p>
                <p className="t-caption text-[var(--text-tertiary)] mt-2">
                  Computer Mode previews every destructive AI action before commit.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`${basePath}/cortex`}
                    className="tool-btn tool-btn-secondary inline-flex"
                  >
                    Open Cortex
                  </Link>
                  <Link
                    href={`${basePath}/ai-skills`}
                    className="tool-btn tool-btn-ghost inline-flex"
                  >
                    Browse Skills
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Two-column: What's blocked + What changed */}
        <section className="studio-section grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CircleAlert size={16} strokeWidth={1.75} className="text-[var(--color-warning)]" />
              <h2 className="t-h3 font-medium text-[var(--text-primary)]">What's blocked</h2>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
              {blockedItems.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle2 size={20} strokeWidth={1.5} className="mx-auto text-[var(--color-success)] mb-2" />
                  <p className="t-body text-[var(--text-secondary)]">Nothing blocked. You are flowing.</p>
                </div>
              ) : (
                blockedItems.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={`${basePath}/${item.studio}`}
                    className="flex items-start gap-3 p-4 hover:bg-[var(--surface-hover)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.kind === 'approval' ? (
                        <FileCheck size={14} className="text-[var(--color-warning)]" />
                      ) : (
                        <ListTodo size={14} className="text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="t-body text-[var(--text-primary)] line-clamp-1">{item.title}</p>
                      <p className="t-caption text-[var(--text-tertiary)] mt-0.5">
                        {item.kind === 'approval' ? 'Awaiting approval' : 'Needs attention'} · {timeAgo(item.since)}
                      </p>
                    </div>
                    <ArrowRight size={12} className="text-[var(--text-tertiary)] mt-1 shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} strokeWidth={1.75} className="text-[var(--text-secondary)]" />
              <h2 className="t-h3 font-medium text-[var(--text-primary)]">What changed</h2>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
              {recentChanges.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock size={20} strokeWidth={1.5} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="t-body text-[var(--text-secondary)]">Quiet. No recent activity.</p>
                </div>
              ) : (
                recentChanges.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-4">
                    <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${n.read ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--accent)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="t-body text-[var(--text-primary)] line-clamp-1">{n.title}</p>
                      {n.body && (
                        <p className="t-caption text-[var(--text-secondary)] mt-0.5 line-clamp-1">{n.body}</p>
                      )}
                      <p className="t-caption text-[var(--text-tertiary)] mt-0.5">{timeAgo(n.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Ask Product OS */}
        <section className="studio-section">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} strokeWidth={1.75} className="text-[var(--accent-text)]" />
            <h2 className="t-h3 font-medium text-[var(--text-primary)]">Ask Product OS</h2>
          </div>
          <form
            onSubmit={handlePromptSubmit}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] focus-within:border-[var(--border-strong)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]"
          >
            <textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder="What do you want to build next? Describe in one sentence. Copilot will draft a plan."
              rows={3}
              className="w-full resize-none bg-transparent px-5 py-4 text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-2.5">
              <div className="flex items-center gap-2 text-[var(--font-size-caption)] text-[var(--text-tertiary)]">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  Graph-aware
                </span>
                <span>·</span>
                <span>Memory grounded</span>
              </div>
              <button
                type="submit"
                disabled={!promptValue.trim() || promptSubmitting}
                className="tool-btn tool-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promptSubmitting ? 'Drafting…' : (
                  <>
                    Ask <Send size={12} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
