'use client'

/**
 * ScaffoldPanel
 *
 * Right-side panel in Code Studio that:
 * 1. Lists graph nodes (components, pages, features, tokens) for this product
 * 2. Lets you generate TypeScript stubs for each node
 * 3. Shows "generated" state per node
 * 4. Has a "Scaffold All" one-click action
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Code2,
  Layers,
  FileText,
  Palette,
  Workflow,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Zap,
} from 'lucide-react'
import { useGraphStore, type GraphNode, type NodeKind } from '../../../../../lib/graph-store'

// ---------------------------------------------------------------------------
// Code generation templates
// ---------------------------------------------------------------------------

function generateComponentStub(node: GraphNode): string {
  const name = toPascalCase(node.label)
  return `import React from 'react'

interface ${name}Props {
  className?: string
  children?: React.ReactNode
}

/**
 * ${node.label}
 * Auto-generated stub from Product OS graph.
 * Node ID: ${node.id}
 */
export function ${name}({ className, children }: ${name}Props) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default ${name}
`
}

function generatePageStub(node: GraphNode): string {
  const name = toPascalCase(node.label)
  return `import type { NextPage } from 'next'
import Head from 'next/head'

/**
 * ${node.label} — Page
 * Auto-generated stub from Product OS graph.
 * Node ID: ${node.id}
 */
const ${name}Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>${node.label}</title>
      </Head>
      <main>
        <h1>${node.label}</h1>
      </main>
    </>
  )
}

export default ${name}Page
`
}

function generateFeatureStub(node: GraphNode): string {
  const name = toCamelCase(node.label)
  return `/**
 * ${node.label} — Feature Module
 * Auto-generated stub from Product OS graph.
 * Node ID: ${node.id}
 */

export interface ${toPascalCase(node.label)}State {
  isLoading: boolean
  error: string | null
  data: unknown | null
}

export const initial${toPascalCase(node.label)}State: ${toPascalCase(node.label)}State = {
  isLoading: false,
  error: null,
  data: null,
}

export async function fetch${toPascalCase(node.label)}(): Promise<unknown> {
  // TODO: implement ${node.label} data fetching
  throw new Error('Not implemented')
}
`
}

function generateTokenStub(node: GraphNode): string {
  const key = toKebabCase(node.label)
  return `/* ${node.label} — Design Token
 * Auto-generated from Product OS Brand Builder.
 * Node ID: ${node.id}
 */

:root {
  --${key}: /* TODO: set value */;
  --${key}-muted: /* TODO: set muted value */;
  --${key}-strong: /* TODO: set strong value */;
}

/* Tailwind extension (add to tailwind.config.js) */
/* '${key}': 'var(--${key})', */
`
}

function generateWorkflowStub(node: GraphNode): string {
  const name = toPascalCase(node.label)
  return `/**
 * ${node.label} — Workflow State Machine
 * Auto-generated stub from Product OS graph.
 * Node ID: ${node.id}
 */

export type ${name}State =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'

export type ${name}Event =
  | { type: 'START' }
  | { type: 'COMPLETE'; result: unknown }
  | { type: 'FAIL'; error: string }
  | { type: 'RESET' }

export function ${toCamelCase(node.label)}Reducer(
  state: ${name}State,
  event: ${name}Event,
): ${name}State {
  switch (state) {
    case 'idle':
      if (event.type === 'START') return 'running'
      return state
    case 'running':
      if (event.type === 'COMPLETE') return 'completed'
      if (event.type === 'FAIL') return 'failed'
      return state
    case 'completed':
    case 'failed':
      if (event.type === 'RESET') return 'idle'
      return state
    default:
      return state
  }
}
`
}

function stubFor(node: GraphNode): string {
  switch (node.kind) {
    case 'component': case 'variant': return generateComponentStub(node)
    case 'page': case 'screen': case 'route': return generatePageStub(node)
    case 'feature': case 'module': return generateFeatureStub(node)
    case 'token': case 'asset': return generateTokenStub(node)
    case 'workflow': case 'entity': return generateWorkflowStub(node)
    default: return `// ${node.label} (${node.kind})\n// TODO: implement\n`
  }
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function toKebabCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join('-')
}

// ---------------------------------------------------------------------------
// Node kind config
// ---------------------------------------------------------------------------

interface KindConfig {
  label: string
  icon: React.ElementType
  color: string
  kinds: NodeKind[]
}

const KIND_GROUPS: KindConfig[] = [
  { label: 'Components',  icon: Layers,    color: '#EC4899', kinds: ['component', 'variant'] },
  { label: 'Pages',       icon: FileText,  color: '#8B5CF6', kinds: ['page', 'screen', 'route'] },
  { label: 'Features',    icon: Zap,       color: '#3B82F6', kinds: ['feature', 'module'] },
  { label: 'Tokens',      icon: Palette,   color: '#F59E0B', kinds: ['token', 'asset'] },
  { label: 'Workflows',   icon: Workflow,  color: '#10B981', kinds: ['workflow', 'entity'] },
]

// ---------------------------------------------------------------------------
// ScaffoldPanel
// ---------------------------------------------------------------------------

interface ScaffoldPanelProps {
  productId: string
  onGenerateFile?: (path: string, content: string) => void
}

interface NodeGenState {
  status: 'idle' | 'generating' | 'done'
  content?: string
}

export function ScaffoldPanel({ productId, onGenerateFile }: ScaffoldPanelProps) {
  const nodes = useGraphStore((s) =>
    s.nodes.filter(
      (n) =>
        n.productId === productId &&
        KIND_GROUPS.some((g) => g.kinds.includes(n.kind as NodeKind)),
    ),
  )

  const [genState, setGenState] = useState<Record<string, NodeGenState>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Components', 'Features']))
  const [scaffolding, setScaffolding] = useState(false)

  const nodesByGroup = useMemo(() => {
    return KIND_GROUPS.map((g) => ({
      ...g,
      nodes: nodes.filter((n) => g.kinds.includes(n.kind as NodeKind)),
    })).filter((g) => g.nodes.length > 0)
  }, [nodes])

  const totalNodes = nodes.length
  const doneCount = Object.values(genState).filter((s) => s.status === 'done').length

  const handleGenerate = useCallback(
    async (node: GraphNode) => {
      setGenState((prev) => ({ ...prev, [node.id]: { status: 'generating' } }))
      // Simulate async generation
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))
      const content = stubFor(node)
      const ext = ['component', 'variant', 'page', 'screen'].includes(node.kind) ? 'tsx' : 'ts'
      const subfolder =
        node.kind === 'component' || node.kind === 'variant' ? 'components'
          : node.kind === 'page' || node.kind === 'screen' ? 'pages'
          : node.kind === 'token' || node.kind === 'asset' ? 'styles'
          : node.kind === 'workflow' || node.kind === 'entity' ? 'lib'
          : 'features'
      const fileName = `${toKebabCase(node.label)}.${ext}`
      const path = `src/${subfolder}/${fileName}`
      setGenState((prev) => ({ ...prev, [node.id]: { status: 'done', content } }))
      onGenerateFile?.(path, content)
    },
    [onGenerateFile],
  )

  const handleScaffoldAll = useCallback(async () => {
    setScaffolding(true)
    for (const node of nodes) {
      if (genState[node.id]?.status === 'done') continue
      await handleGenerate(node)
    }
    setScaffolding(false)
  }, [nodes, genState, handleGenerate])

  const handleCopy = useCallback(async (nodeId: string, content: string) => {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopiedId(nodeId)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  if (totalNodes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-inset)' }}>
          <Code2 size={18} className="text-[var(--text-tertiary)]" />
        </div>
        <p className="text-[12px] font-semibold text-[var(--text-secondary)]">No graph nodes yet</p>
        <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed max-w-[180px]">
          Create features, components, and pages in the Planner to generate code stubs here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">Scaffold</p>
          <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">
            {doneCount}/{totalNodes} generated
          </p>
        </div>
        <button
          onClick={handleScaffoldAll}
          disabled={scaffolding || doneCount === totalNodes}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-40"
          style={{
            background: doneCount === totalNodes ? 'var(--bg-inset)' : 'var(--accent-text)',
            color: doneCount === totalNodes ? 'var(--text-tertiary)' : '#fff',
          }}
        >
          {scaffolding ? (
            <Loader2 size={10} className="animate-spin" />
          ) : doneCount === totalNodes ? (
            <CheckCircle2 size={10} />
          ) : (
            <Sparkles size={10} />
          )}
          {scaffolding ? 'Generating…' : doneCount === totalNodes ? 'All done' : 'Scaffold All'}
        </button>
      </div>

      {/* Progress bar */}
      {totalNodes > 0 && (
        <div className="px-3 py-1.5 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[var(--text-tertiary)]">Progress</span>
            <span className="text-[9px] font-medium text-[var(--accent-text)]">
              {totalNodes > 0 ? Math.round((doneCount / totalNodes) * 100) : 0}%
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalNodes > 0 ? (doneCount / totalNodes) * 100 : 0}%`,
                background: doneCount === totalNodes ? 'var(--color-success)' : 'var(--accent-text)',
              }}
            />
          </div>
        </div>
      )}

      {/* Node groups */}
      <div className="flex-1 overflow-y-auto">
        {nodesByGroup.map((group) => {
          const GroupIcon = group.icon
          const isOpen = expandedGroups.has(group.label)
          const groupDone = group.nodes.filter((n) => genState[n.id]?.status === 'done').length

          return (
            <div key={group.label} className="border-b border-[var(--border-default)]">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors"
              >
                {isOpen
                  ? <ChevronDown size={10} className="text-[var(--text-tertiary)] shrink-0" />
                  : <ChevronRight size={10} className="text-[var(--text-tertiary)] shrink-0" />
                }
                <GroupIcon size={11} style={{ color: group.color, flexShrink: 0 }} />
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] flex-1 text-left">
                  {group.label}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)]">
                  {groupDone}/{group.nodes.length}
                </span>
              </button>

              {/* Nodes */}
              {isOpen && (
                <div className="pb-1">
                  {group.nodes.map((node) => {
                    const state = genState[node.id] ?? { status: 'idle' }
                    const isDone = state.status === 'done'
                    const isGenerating = state.status === 'generating'
                    const isCopied = copiedId === node.id

                    return (
                      <div
                        key={node.id}
                        className="group px-3 py-1.5 hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {/* Status icon */}
                          {isGenerating ? (
                            <Loader2 size={10} className="animate-spin text-[var(--accent-text)] shrink-0" />
                          ) : isDone ? (
                            <CheckCircle2 size={10} className="shrink-0" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <Circle size={10} className="text-[var(--border-strong)] shrink-0" />
                          )}

                          {/* Node name */}
                          <span className="text-[10px] text-[var(--text-primary)] flex-1 truncate">
                            {node.label}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isDone && state.content && (
                              <button
                                onClick={() => handleCopy(node.id, state.content!)}
                                className="p-1 rounded hover:bg-[var(--bg-overlay)] transition-colors"
                                title="Copy code"
                              >
                                {isCopied
                                  ? <Check size={9} className="text-[var(--color-success)]" />
                                  : <Copy size={9} className="text-[var(--text-tertiary)]" />
                                }
                              </button>
                            )}
                            {!isDone && (
                              <button
                                onClick={() => handleGenerate(node)}
                                disabled={isGenerating}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors disabled:opacity-50"
                                style={{ background: `${group.color}18`, color: group.color }}
                              >
                                {isGenerating ? '…' : 'Gen'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Generated code preview */}
                        {isDone && state.content && (
                          <div
                            className="mt-1 px-2 py-1.5 rounded-lg text-[9px] font-mono text-[var(--text-tertiary)] overflow-hidden leading-relaxed"
                            style={{
                              background: 'var(--bg-inset)',
                              maxHeight: '60px',
                              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)',
                            }}
                          >
                            {state.content.split('\n').slice(0, 5).join('\n')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
