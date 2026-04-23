'use client'

/**
 * R8 — Graph Inspector right rail.
 *
 * A persistent right-edge panel that surfaces graph context for the
 * currently-selected node. Shows:
 *   · Overview    — kind, label, status, timestamps, raw data
 *   · Connections — incoming and outgoing edges, clickable
 *   · History     — version entries from living-graph-store
 *   · Impact      — "what would break if this changed" (edges out × depth 1)
 *
 * Toggle state lives in useInspectorStore so any studio can call
 * `inspect(nodeId)` or `inspectEntity(kind, id)`.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { X, ExternalLink, GitBranch, History, AlertTriangle, Network, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useInspectorStore, type InspectorTab } from '../../lib/inspector-store'
import { useGraphStore, type GraphNode } from '../../lib/graph-store'
import { useLivingGraphStore } from '../../lib/living-graph-store'

interface GraphInspectorProps {
  productId: string
  orgSlug: string
  productSlug: string
}

const TABS: { id: InspectorTab; label: string; icon: typeof Network }[] = [
  { id: 'overview',    label: 'Overview',    icon: Network    },
  { id: 'connections', label: 'Connections', icon: GitBranch  },
  { id: 'history',     label: 'History',     icon: History    },
  { id: 'impact',      label: 'Impact',      icon: AlertTriangle },
]

export function GraphInspector({ productId, orgSlug, productSlug }: GraphInspectorProps) {
  const open = useInspectorStore((s) => s.open)
  const selectedNodeId = useInspectorStore((s) => s.selectedNodeId)
  const selectedEntity = useInspectorStore((s) => s.selectedEntity)
  const tab = useInspectorStore((s) => s.tab)
  const closeInspector = useInspectorStore((s) => s.closeInspector)
  const setTab = useInspectorStore((s) => s.setTab)

  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const versionsByNode = useLivingGraphStore((s) => s.versionsByNode)

  const node: GraphNode | null = useMemo(() => {
    if (selectedNodeId) return nodes.find((n) => n.id === selectedNodeId) ?? null
    if (selectedEntity) {
      // Loose match: kind stored as either GraphNode.kind OR in data
      return (
        nodes.find(
          (n) =>
            n.productId === productId &&
            (n.kind === selectedEntity.kind || (n.data as { externalId?: string })?.externalId === selectedEntity.id),
        ) ?? null
      )
    }
    return null
  }, [nodes, selectedNodeId, selectedEntity, productId])

  const outgoing = useMemo(
    () => (node ? edges.filter((e) => e.sourceId === node.id) : []),
    [edges, node],
  )
  const incoming = useMemo(
    () => (node ? edges.filter((e) => e.targetId === node.id) : []),
    [edges, node],
  )

  if (!open) return null

  return (
    <aside
      className="fixed top-0 right-0 z-40 h-screen w-[360px] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col shadow-[var(--shadow-lg)]"
      role="complementary"
      aria-label="Graph inspector"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <Network size={16} className="text-[var(--accent-text)] shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Inspector</div>
            <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">
              {node?.label ?? (selectedEntity ? `${selectedEntity.kind}:${selectedEntity.id}` : 'No selection')}
            </div>
          </div>
        </div>
        <button
          onClick={closeInspector}
          className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
          aria-label="Close inspector"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-px px-2 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex items-center gap-1.5 px-3 h-10 text-[12px] transition-colors"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              <Icon size={13} />
              <span className="font-medium">{t.label}</span>
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                style={{ background: active ? 'var(--accent-text)' : 'transparent' }}
              />
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!node && (
          <div className="p-6 text-center">
            <Network size={24} className="mx-auto text-[var(--text-tertiary)] opacity-50" />
            <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
              Select an object in any studio to see its graph context here.
            </p>
          </div>
        )}

        {node && tab === 'overview' && <OverviewTab node={node} />}
        {node && tab === 'connections' && (
          <ConnectionsTab outgoing={outgoing} incoming={incoming} nodesById={nodes} />
        )}
        {node && tab === 'history' && (
          <HistoryTab versions={versionsByNode[node.id] ?? []} />
        )}
        {node && tab === 'impact' && (
          <ImpactTab outgoing={outgoing} nodesById={nodes} />
        )}
      </div>

      {/* Footer — Open in Graph */}
      {node && (
        <div className="border-t border-[var(--border-subtle)] p-3 flex items-center gap-2">
          <Link
            href={`/${orgSlug}/${productSlug}/graph?node=${encodeURIComponent(node.id)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-md bg-[var(--accent-muted)] text-[var(--accent-text)] hover:opacity-90 transition"
          >
            <ExternalLink size={12} />
            <span className="font-medium">Open in Graph</span>
          </Link>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {outgoing.length} out · {incoming.length} in
          </span>
        </div>
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Tab contents
// ---------------------------------------------------------------------------

function OverviewTab({ node }: { node: GraphNode }) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Kind</div>
        <div className="inline-flex items-center text-[12px] px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium">
          {node.kind}
        </div>
      </div>
      {node.status && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Status</div>
          <div className="text-[12px] text-[var(--text-primary)]">{node.status}</div>
        </div>
      )}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Created</div>
        <div className="text-[12px] text-[var(--text-secondary)]">{new Date(node.createdAt).toLocaleString()}</div>
      </div>
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">Updated</div>
        <div className="text-[12px] text-[var(--text-secondary)]">{new Date(node.updatedAt).toLocaleString()}</div>
      </div>
      {Object.keys(node.data ?? {}).length > 0 && (
        <details className="space-y-1">
          <summary className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium cursor-pointer">
            Data
          </summary>
          <pre className="mt-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md p-2 overflow-auto max-h-48">
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

function ConnectionsTab({
  outgoing,
  incoming,
  nodesById,
}: {
  outgoing: ReturnType<typeof useGraphStore.getState>['edges']
  incoming: ReturnType<typeof useGraphStore.getState>['edges']
  nodesById: GraphNode[]
}) {
  const getLabel = (id: string) => nodesById.find((n) => n.id === id)?.label ?? id
  return (
    <div className="p-4 space-y-5">
      <Section title="Outgoing" icon={ArrowUpRight} count={outgoing.length}>
        {outgoing.map((e) => (
          <ConnRow key={e.id} kind={e.kind} label={getLabel(e.targetId)} />
        ))}
        {outgoing.length === 0 && <Empty label="No outgoing edges" />}
      </Section>
      <Section title="Incoming" icon={ArrowDownLeft} count={incoming.length}>
        {incoming.map((e) => (
          <ConnRow key={e.id} kind={e.kind} label={getLabel(e.sourceId)} />
        ))}
        {incoming.length === 0 && <Empty label="No incoming edges" />}
      </Section>
    </div>
  )
}

function HistoryTab({ versions }: { versions: Array<{ version: number; changedAt: string; changedBy?: string; diff: Record<string, unknown> }> }) {
  if (versions.length === 0) return <Empty label="No recorded versions" className="p-6" />
  return (
    <div className="p-4 space-y-3">
      {versions.map((v) => (
        <div key={v.version} className="p-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <span className="font-medium text-[var(--text-primary)]">v{v.version}</span>
            <span>{new Date(v.changedAt).toLocaleString()}</span>
          </div>
          {v.changedBy && (
            <div className="mt-1 text-[11px] text-[var(--text-secondary)]">by {v.changedBy}</div>
          )}
          <pre className="mt-2 text-[10px] text-[var(--text-secondary)] overflow-auto max-h-24">
            {JSON.stringify(v.diff, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  )
}

function ImpactTab({
  outgoing,
  nodesById,
}: {
  outgoing: ReturnType<typeof useGraphStore.getState>['edges']
  nodesById: GraphNode[]
}) {
  const affected = useMemo(() => {
    const ids = new Set(outgoing.map((e) => e.targetId))
    return nodesById.filter((n) => ids.has(n.id))
  }, [outgoing, nodesById])

  if (affected.length === 0) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={24} className="mx-auto text-[var(--text-tertiary)] opacity-50" />
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
          No downstream impact. Changes here affect nothing else directly.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-[11px] text-[var(--text-secondary)]">
        Changing this object could affect {affected.length} connected {affected.length === 1 ? 'node' : 'nodes'}.
      </p>
      <ul className="space-y-1">
        {affected.map((n) => (
          <li key={n.id} className="flex items-center justify-between p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
            <span className="text-[12px] text-[var(--text-primary)] truncate">{n.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] ml-2 shrink-0">
              {n.kind}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal bits
// ---------------------------------------------------------------------------

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: typeof Network
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} className="text-[var(--text-tertiary)]" />
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] font-medium">
          {title}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums ml-auto">{count}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ConnRow({ kind, label }: { kind: string; label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-wide">{kind}</span>
      <span className="text-[12px] text-[var(--text-primary)] truncate">{label}</span>
    </div>
  )
}

function Empty({ label, className = '' }: { label: string; className?: string }) {
  return <div className={`text-[11px] text-[var(--text-tertiary)] italic ${className}`}>{label}</div>
}
