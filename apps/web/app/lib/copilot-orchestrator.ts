'use client'

/**
 * R14 — Copilot orchestrator.
 *
 * Routes a user message from the Copilot panel through three tools:
 *   1. queryGraph       — read-only projections over useGraphStore
 *   2. recallMemory     — surfaces ready assets and cached retrievals
 *   3. draftComputerAction — pushes a pending entry onto the Computer Mode
 *                            store so the R10 strip can approve / reject.
 *
 * The orchestrator is intentionally local. It does not call a model yet —
 * that's the follow-up to wire `aiRuntime` end-to-end. What it does do is
 * close the loop between Copilot ↔ Graph ↔ Memory ↔ Computer Mode so the
 * surface behaves as a real AI pair instead of a stub.
 */

import { useGraphStore, type NodeKind } from './graph-store'
import { useProductMemoryStore } from './product-memory-store'
import { useComputerModeStore, type ActionKind } from './computer-mode-store'

export interface CopilotContext {
  productId: string
  orgSlug: string
  productSlug: string
  studio: string
  selectedNodeId?: string
}

export interface OrchestratorResult {
  reply: string
  refs?: Array<{ kind: 'node' | 'skill' | 'decision' | 'memory'; id: string; label?: string }>
  pendingAction?: boolean
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

function queryGraph(productId: string, kind?: NodeKind) {
  const s = useGraphStore.getState()
  const all = s.nodes.filter((n) => n.productId === productId)
  return kind ? all.filter((n) => n.kind === kind) : all
}

function recallMemory(query: string) {
  const s = useProductMemoryStore.getState()
  const cached = s.recentRetrievals[query] ?? []
  const assets = s.assets.filter((a) => a.status === 'ready')
  return { chunks: cached, readyCount: assets.length, assets: assets.slice(0, 3) }
}

function draftComputerAction(
  kind: ActionKind,
  label: string,
  detail: string,
  ctx: CopilotContext,
  input?: Record<string, unknown>,
): string {
  return useComputerModeStore.getState().addAction({
    kind,
    label,
    detail,
    status: 'pending',
    confirmRequired: true,
    studio: ctx.studio,
    productId: ctx.productId,
    input,
  })
}

// ---------------------------------------------------------------------------
// Intent routing
// ---------------------------------------------------------------------------

interface Intent {
  kind:
    | 'help'
    | 'query_graph'
    | 'recall_memory'
    | 'draft_task'
    | 'draft_scaffold'
    | 'draft_update'
    | 'small_talk'
  target?: NodeKind
  raw: string
}

function classify(text: string): Intent {
  const t = text.toLowerCase().trim()

  if (/^(hi|hello|hey|yo|thanks|thank you|ok|okay)\b/.test(t)) {
    return { kind: 'small_talk', raw: text }
  }

  // Mutation intents — keep these above read intents so "create a page" beats "page".
  if (/(create|add|make|draft)\s+.*\b(task|todo|action item)\b/.test(t)) {
    return { kind: 'draft_task', raw: text }
  }
  if (/(scaffold|build|generate|spin\s*up|stub)\b/.test(t)) {
    return { kind: 'draft_scaffold', raw: text }
  }
  if (/(rename|update|change|edit|fix|patch)\b/.test(t)) {
    return { kind: 'draft_update', raw: text }
  }

  // Read intents.
  const kindMap: Array<[RegExp, NodeKind]> = [
    [/\bpages?\b/, 'page'],
    [/\bcomponents?\b/, 'component'],
    [/\bworkflows?\b/, 'workflow'],
    [/\bfeatures?\b/, 'feature'],
    [/\btasks?\b/, 'task'],
    [/\bapprovals?\b/, 'approval'],
    [/\breleases?\b/, 'release'],
    [/\binsights?\b/, 'insight'],
    [/\bmodules?\b/, 'module'],
    [/\bjourneys?\b/, 'journey'],
    [/\btests?\b/, 'test_suite'],
  ]
  if (/\b(show|list|find|where|what|how many|count)\b/.test(t) || /\?$/.test(t)) {
    for (const [re, kind] of kindMap) {
      if (re.test(t)) return { kind: 'query_graph', target: kind, raw: text }
    }
    return { kind: 'query_graph', raw: text }
  }

  if (/\b(remember|recall|memory|docs?|brief|pdf)\b/.test(t)) {
    return { kind: 'recall_memory', raw: text }
  }

  if (/\bhelp\b|what can you do/i.test(t)) {
    return { kind: 'help', raw: text }
  }

  // Default: treat as a graph question.
  return { kind: 'query_graph', raw: text }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function runCopilotOrchestrator(
  text: string,
  ctx: CopilotContext,
): OrchestratorResult {
  const intent = classify(text)

  switch (intent.kind) {
    case 'small_talk':
      return {
        reply: `Happy to help. Try: "show unpublished pages", "create a task to polish onboarding", or "scaffold a checkout workflow".`,
      }

    case 'help':
      return {
        reply: [
          `I can do three things without leaving this panel:`,
          `• Query the graph — "show pages", "list open tasks", "how many components?"`,
          `• Recall Memory — "what does the brand brief say about tone?"`,
          `• Draft Computer Mode actions — "create a task to…", "scaffold a…", "update the checkout page".`,
          ``,
          `Draft actions appear in the Computer Mode strip for you to approve or reject.`,
        ].join('\n'),
      }

    case 'query_graph': {
      const nodes = queryGraph(ctx.productId, intent.target)
      const kindLabel = intent.target ?? 'nodes'
      if (nodes.length === 0) {
        return {
          reply: `No ${kindLabel} in this product's graph yet. You're in ${ctx.studio} — want me to draft a scaffold?`,
        }
      }
      const preview = nodes.slice(0, 5)
      const refs = preview.map((n) => ({
        kind: 'node' as const,
        id: n.id,
        label: n.label,
      }))
      const more = nodes.length - preview.length
      return {
        reply: [
          `Found ${nodes.length} ${kindLabel}${nodes.length === 1 ? '' : 's'} in the graph:`,
          ...preview.map((n) => `  · ${n.label}${n.status ? `  — ${n.status}` : ''}`),
          more > 0 ? `  …and ${more} more. Open the Inspector to browse.` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        refs,
      }
    }

    case 'recall_memory': {
      const { readyCount, assets } = recallMemory(text)
      if (readyCount === 0) {
        return {
          reply: `No Memory assets are ready yet. Upload docs under Plan → Memory and I'll be able to cite them here.`,
        }
      }
      const refs = assets.map((a) => ({
        kind: 'memory' as const,
        id: a.id,
        label: a.filename,
      }))
      return {
        reply: [
          `You have ${readyCount} document${readyCount === 1 ? '' : 's'} indexed in Memory. Top matches:`,
          ...assets.map((a) => `  · ${a.filename} — ${a.tags.join(', ') || 'untagged'}`),
          ``,
          `Ask me to draft something from these and I'll stage it in Computer Mode.`,
        ].join('\n'),
        refs,
      }
    }

    case 'draft_task': {
      const id = draftComputerAction(
        'create_task',
        extractLabel(text) ?? `Task from Copilot`,
        text,
        ctx,
        { fromStudio: ctx.studio, prompt: text },
      )
      return {
        reply: `Drafted a task for you. Check the Computer Mode strip at the top of the page to approve or reject — it's also logged under Intelligence → Computer Log.`,
        refs: [{ kind: 'skill', id, label: 'create_task' }],
        pendingAction: true,
      }
    }

    case 'draft_scaffold': {
      const id = draftComputerAction(
        'scaffold',
        extractLabel(text) ?? `Scaffold from Copilot`,
        text,
        ctx,
        { fromStudio: ctx.studio, prompt: text },
      )
      return {
        reply: `Staged a scaffold. Nothing has been written to the graph yet — approve it from the Computer Mode strip and I'll commit.`,
        refs: [{ kind: 'skill', id, label: 'scaffold' }],
        pendingAction: true,
      }
    }

    case 'draft_update': {
      const id = draftComputerAction(
        'update_node',
        extractLabel(text) ?? `Update from Copilot`,
        text,
        ctx,
        { fromStudio: ctx.studio, prompt: text, selectedNodeId: ctx.selectedNodeId },
      )
      return {
        reply: ctx.selectedNodeId
          ? `Staged an update to the selected node. Approve in the Computer Mode strip.`
          : `Staged an update proposal. Select a graph node first for a precise diff, or approve the generic version from the strip.`,
        refs: [{ kind: 'skill', id, label: 'update_node' }],
        pendingAction: true,
      }
    }
  }
}

function extractLabel(text: string): string | null {
  const m = text.match(/(?:to|for|that)\s+(.+)$/i)
  if (m && m[1].length < 80) return m[1].trim().replace(/\.$/, '')
  const trimmed = text.trim().replace(/\.$/, '')
  return trimmed.length < 80 ? trimmed : null
}
