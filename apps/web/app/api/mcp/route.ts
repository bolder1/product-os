import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import {
  db,
  entries,
  workspaces,
  agentQueries,
  agentReads,
  KINDS,
  stateOf,
  ageLabel,
  daysSince,
  type Entry,
  type Workspace,
} from '@ground/core/server'

/**
 * Ground's MCP server.
 *
 * Streamable HTTP, JSON-RPC 2.0. A workspace authenticates with its own bearer
 * token, so pointing an agent at it is one command and no OAuth dance.
 */

const PROTOCOL_VERSION = '2025-06-18'

type Json = Record<string, unknown>

function rpcResult(id: unknown, result: Json) {
  return Response.json({ jsonrpc: '2.0', id, result })
}

function rpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } }, { status })
}

async function resolveWorkspace(req: Request): Promise<Workspace | null> {
  const header = req.headers.get('authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.mcpToken, token))
    .limit(1)

  return workspace ?? null
}

function renderEntry(entry: Entry, staleAfterDays: number) {
  const fields = (entry.fields ?? {}) as Record<string, string>
  const spec = KINDS[entry.kind]
  const lines = spec.fields
    .filter((f) => fields[f.key])
    .map((f) => `${f.label}: ${fields[f.key]}`)

  const state = stateOf(entry, staleAfterDays)
  const parts = [
    `## ${entry.title}`,
    `Type: ${spec.label}`,
    ...lines,
    entry.body ? `\n${entry.body}` : '',
    `\nStatus: ${state === 'drifted' ? 'DRIFTED' : 'current'} — ${ageLabel(entry, staleAfterDays)}` +
      (state === 'drifted'
        ? `. This has not been confirmed in ${daysSince(new Date(entry.lastConfirmedAt))} days; treat it as possibly out of date and say so.`
        : '.'),
  ]
  return parts.filter(Boolean).join('\n')
}

/**
 * Log the question and what was handed back for it.
 *
 * Both rows are written after the reply has been assembled, so a logging
 * failure can never cost the agent its answer — the read is a record of what
 * happened, not part of making it happen.
 */
async function logRead(
  workspace: Workspace,
  tool: string,
  query: string | null,
  rows: Entry[],
) {
  const [logged] = await db
    .insert(agentQueries)
    .values({ workspaceId: workspace.id, tool, query, resultCount: rows.length })
    .returning({ id: agentQueries.id })

  if (!logged || rows.length === 0) return

  await db
    .insert(agentReads)
    .values(rows.map((r) => ({ queryId: logged.id, entryId: r.id })))
}

const TOOLS = [
  {
    name: 'search_context',
    description:
      "Search this product's recorded context — decisions, constraints, conventions, glossary and non-goals. Call this BEFORE proposing architecture, choosing a library, or making a change that assumes product intent.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words to match against titles and bodies.' },
        kind: {
          type: 'string',
          enum: Object.keys(KINDS),
          description: 'Optionally restrict to one kind of entry.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_product_brief',
    description:
      "Return the whole of this product's recorded context as one brief. Use at the start of a task to understand what the product is and what has already been settled.",
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
] as const

async function callTool(workspace: Workspace, name: string, args: Json) {
  const staleAfter = workspace.staleAfterDays

  if (name === 'search_context') {
    const query = typeof args.query === 'string' ? args.query.trim() : ''
    const kind = typeof args.kind === 'string' ? args.kind : ''

    const conditions = [eq(entries.workspaceId, workspace.id)]
    if (query) {
      // Stemmed full-text match OR substring match. Without stemming, an agent
      // asking about "retry" would be told nothing is recorded about "retries"
      // — a confident false negative, which is worse than having no tool.
      // search_vector is a stored generated column with a GIN index, so this
      // is an index scan rather than a per-row computation.
      const needle = `%${query}%`
      conditions.push(
        or(
          sql`${entries.searchVector} @@ plainto_tsquery('english', ${query})`,
          ilike(entries.title, needle),
          ilike(entries.body, needle),
          sql`${entries.fields}::text ilike ${needle}`,
        )!,
      )
    }
    if (kind && kind in KINDS) {
      conditions.push(sql`${entries.kind}::text = ${kind}`)
    }

    const rows = await db
      .select()
      .from(entries)
      .where(and(...conditions))
      .orderBy(desc(entries.lastConfirmedAt))
      .limit(25)

    await logRead(workspace, name, query || null, rows)

    if (rows.length === 0) {
      return `No recorded context matches “${query || 'that'}” in ${workspace.name}. Nothing has been written down about this yet — do not assume; ask.`
    }

    return [
      `${rows.length} context ${rows.length === 1 ? 'entry' : 'entries'} for ${workspace.name}:`,
      '',
      ...rows.map((r) => renderEntry(r, staleAfter)),
    ].join('\n')
  }

  if (name === 'get_product_brief') {
    const rows = await db
      .select()
      .from(entries)
      .where(eq(entries.workspaceId, workspace.id))
      .orderBy(entries.kind, desc(entries.lastConfirmedAt))

    await logRead(workspace, name, null, rows)

    if (rows.length === 0) {
      return `${workspace.name} has no recorded context yet.`
    }

    const drifted = rows.filter((r) => stateOf(r, staleAfter) === 'drifted').length
    const header = [
      `# ${workspace.name} — product context`,
      `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}` +
        (drifted ? `, ${drifted} not confirmed in over ${staleAfter} days.` : '.'),
      '',
    ]
    return [...header, ...rows.map((r) => renderEntry(r, staleAfter))].join('\n')
  }

  throw new Error(`Unknown tool: ${name}`)
}

export async function POST(req: Request) {
  let body: Json
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error')
  }

  const { id, method, params } = body as { id?: unknown; method?: string; params?: Json }

  // initialize is answered before auth so a misconfigured token surfaces as a
  // tool error the agent can report, not a silent connection failure.
  if (method === 'initialize') {
    return rpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'ground', version: '0.1.0' },
    })
  }

  if (method === 'notifications/initialized') {
    return new Response(null, { status: 202 })
  }

  const workspace = await resolveWorkspace(req)
  if (!workspace) {
    return rpcError(id ?? null, -32001, 'Unauthorized: set a valid Ground workspace token.', 401)
  }

  if (method === 'tools/list') {
    return rpcResult(id, { tools: TOOLS })
  }

  if (method === 'tools/call') {
    const name = String((params as Json)?.name ?? '')
    const args = ((params as Json)?.arguments ?? {}) as Json
    try {
      const text = await callTool(workspace, name, args)
      return rpcResult(id, { content: [{ type: 'text', text }] })
    } catch (error) {
      return rpcResult(id, {
        content: [{ type: 'text', text: error instanceof Error ? error.message : 'Tool failed.' }],
        isError: true,
      })
    }
  }

  return rpcError(id ?? null, -32601, `Method not found: ${method}`)
}

export async function GET() {
  // No server-initiated stream; the agent drives every exchange over POST.
  return new Response('Ground MCP server. POST JSON-RPC here.', {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  })
}
