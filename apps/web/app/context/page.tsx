import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import {
  db,
  entries,
  agentQueries,
  agentReads,
  KINDS,
  stateOf,
  ageLabel,
  timeAgo,
  type Entry,
} from '@ground/core/server'
import { Badge, Button, Empty, StrataRule, Wordmark, FieldRow } from '@product-os/ui'
import { requireWorkspace } from '../_lib/session'
import { signOut } from '../actions/auth'
import { confirmEntry, deleteEntry } from '../actions/entries'
import { AddEntry } from './_components/add-entry'
import { ConnectPanel } from './_components/connect-panel'

export const dynamic = 'force-dynamic'

// The agent keeps this URL in its own config, so it has to outlive the
// deployment that printed it. VERCEL_URL is per-deployment and would freeze the
// command to one build; VERCEL_PROJECT_PRODUCTION_URL is the stable domain.
function baseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3005'
}

interface ReadStat {
  count: number
  lastAt: Date
}

function EntryCard({
  entry,
  staleAfterDays,
  read,
  anyAgentActivity,
}: {
  entry: Entry
  staleAfterDays: number
  read?: ReadStat
  anyAgentActivity: boolean
}) {
  const spec = KINDS[entry.kind]
  const state = stateOf(entry, staleAfterDays)
  const fields = (entry.fields ?? {}) as Record<string, string>

  return (
    <article className="g-card g-entrycard" data-state={state}>
      <header className="g-entrycard-head">
        <span aria-hidden="true" className="g-entry-dot" data-state={state} />
        <h3 className="g-entrycard-title">{entry.title}</h3>
        <span className="g-entry-kind">{spec.kind}</span>
        <span className="g-entry-age" data-state={state}>
          {ageLabel(entry, staleAfterDays)}
        </span>
      </header>

      <div className="g-entrycard-fields">
        {spec.fields.map((field) => (
          <FieldRow key={field.key} label={field.label} value={fields[field.key]} />
        ))}
      </div>

      {entry.body ? <p className="g-entrycard-body">{entry.body}</p> : null}

      <footer className="g-entrycard-foot">
        {state === 'drifted' ? (
          <p className="g-entrycard-drift">
            Not confirmed in over {staleAfterDays} days. Your agents are told to treat it as possibly
            out of date.
          </p>
        ) : read ? (
          <p className="g-entrycard-read">
            Read by an agent {timeAgo(read.lastAt)}
            {read.count > 1 ? ` · ${read.count} times` : ''}
          </p>
        ) : anyAgentActivity ? (
          // Only meaningful once something has asked at least once. Before that,
          // every entry is unread and saying so would be noise.
          <p className="g-entrycard-read" data-unread="true">
            No agent has read this yet
          </p>
        ) : (
          <span />
        )}
        <div className="g-entrycard-actions">
          <form action={confirmEntry}>
            <input type="hidden" name="id" value={entry.id} />
            <Button type="submit" variant={state === 'drifted' ? 'primary' : 'ghost'} size="sm">
              Still true
            </Button>
          </form>
          <form action={deleteEntry}>
            <input type="hidden" name="id" value={entry.id} />
            <Button type="submit" variant="ghost" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </footer>
    </article>
  )
}

export default async function ContextPage() {
  const { workspace } = await requireWorkspace()

  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.workspaceId, workspace.id))
    .orderBy(desc(entries.lastConfirmedAt))

  const [queryStat] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agentQueries)
    .where(eq(agentQueries.workspaceId, workspace.id))

  // How often each entry has actually been handed to an agent, and when last.
  const readRows = await db
    .select({
      entryId: agentReads.entryId,
      count: sql<number>`count(*)::int`,
      lastAt: sql<Date>`max(${agentReads.createdAt})`,
    })
    .from(agentReads)
    .innerJoin(entries, eq(entries.id, agentReads.entryId))
    .where(eq(entries.workspaceId, workspace.id))
    .groupBy(agentReads.entryId)

  const reads = new Map<string, ReadStat>(
    readRows.map((r) => [r.entryId, { count: r.count, lastAt: new Date(r.lastAt) }]),
  )

  // Questions Ground could not answer. This is the most directly actionable
  // thing in the product: a to-do list written by the agents themselves.
  const unanswered = await db
    .select({ query: agentQueries.query, at: agentQueries.createdAt })
    .from(agentQueries)
    .where(
      and(
        eq(agentQueries.workspaceId, workspace.id),
        eq(agentQueries.resultCount, 0),
        isNotNull(agentQueries.query),
      ),
    )
    .orderBy(desc(agentQueries.createdAt))
    .limit(30)

  // The same question asked five times is one gap, not five.
  const gaps: { query: string; at: Date; times: number }[] = []
  for (const row of unanswered) {
    const q = (row.query ?? '').trim()
    if (!q) continue
    const seen = gaps.find((g) => g.query.toLowerCase() === q.toLowerCase())
    if (seen) seen.times += 1
    else gaps.push({ query: q, at: new Date(row.at), times: 1 })
  }

  const agentReadCount = queryStat?.count ?? 0
  const drifted = rows.filter((r) => stateOf(r, workspace.staleAfterDays) === 'drifted')
  const current = rows.filter((r) => stateOf(r, workspace.staleAfterDays) !== 'drifted')

  const command = `claude mcp add ground --transport http ${baseUrl()}/api/mcp --header "Authorization: Bearer ${workspace.mcpToken}"`

  return (
    <div className="g-app">
      <header className="g-appbar">
        <div className="g-container g-appbar-inner">
          <Wordmark />
          <div className="g-appbar-right">
            <span className="g-appbar-workspace">{workspace.name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="g-container g-app-main">
        <ConnectPanel command={command} connected={agentReadCount > 0} />

        {gaps.length > 0 ? (
          <section className="g-gaps" aria-labelledby="gaps-heading">
            <div className="g-gaps-head">
              <h2 id="gaps-heading" className="g-gaps-title">
                Your agents asked, Ground could not answer
              </h2>
              <Badge tone="drift" dot>
                {gaps.length}
              </Badge>
            </div>
            <p className="g-gaps-lede">
              Searches that returned nothing. Each one is a question your agents needed answered and
              had to guess at instead.
            </p>
            <ul className="g-gaps-list">
              {gaps.map((gap) => (
                <li key={gap.query} className="g-gap">
                  <span className="g-gap-query">{gap.query}</span>
                  <span className="g-gap-meta">
                    {gap.times > 1 ? `asked ${gap.times}× · ` : ''}
                    {timeAgo(gap.at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="g-context" aria-labelledby="context-heading">
          <div className="g-context-head">
            <h1 id="context-heading" className="g-context-title">
              Context
            </h1>
            <div className="g-context-meta">
              <Badge tone="neutral" dot>
                {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </Badge>
              {drifted.length > 0 ? (
                <Badge tone="drift" dot>
                  {drifted.length} drifted
                </Badge>
              ) : null}
              {agentReadCount > 0 ? (
                <Badge tone="grounded" dot>
                  {agentReadCount} agent {agentReadCount === 1 ? 'read' : 'reads'}
                </Badge>
              ) : null}
            </div>
            <AddEntry />
          </div>

          {rows.length === 0 ? (
            <Empty
              icon={<StrataRule width={72} />}
              title="No context yet"
              description="Add one decision your agents keep getting wrong. That is enough to start."
            />
          ) : (
            <div className="g-context-groups">
              {drifted.length > 0 ? (
                <div className="g-group">
                  <h2 className="g-group-head">
                    Drifted <span>{drifted.length}</span>
                  </h2>
                  <div className="g-group-body">
                    {drifted.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        staleAfterDays={workspace.staleAfterDays}
                        read={reads.get(entry.id)}
                        anyAgentActivity={agentReadCount > 0}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {current.length > 0 ? (
                <div className="g-group">
                  <h2 className="g-group-head">
                    Current <span>{current.length}</span>
                  </h2>
                  <div className="g-group-body">
                    {current.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        staleAfterDays={workspace.staleAfterDays}
                        read={reads.get(entry.id)}
                        anyAgentActivity={agentReadCount > 0}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
