import { desc, eq, sql } from 'drizzle-orm'
import {
  db,
  entries,
  agentQueries,
  KINDS,
  stateOf,
  ageLabel,
  type Entry,
} from '@ground/core/server'
import { Badge, Button, Empty, StrataRule, Wordmark, FieldRow } from '@product-os/ui'
import { requireWorkspace } from '../_lib/session'
import { signOut } from '../actions/auth'
import { confirmEntry, deleteEntry } from '../actions/entries'
import { AddEntry } from './_components/add-entry'
import { ConnectPanel } from './_components/connect-panel'

export const dynamic = 'force-dynamic'

function baseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3005'
}

function EntryCard({ entry, staleAfterDays }: { entry: Entry; staleAfterDays: number }) {
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

  const agentReads = queryStat?.count ?? 0
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
        <ConnectPanel command={command} connected={agentReads > 0} />

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
              {agentReads > 0 ? (
                <Badge tone="grounded" dot>
                  {agentReads} agent {agentReads === 1 ? 'read' : 'reads'}
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
                      <EntryCard key={entry.id} entry={entry} staleAfterDays={workspace.staleAfterDays} />
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
                      <EntryCard key={entry.id} entry={entry} staleAfterDays={workspace.staleAfterDays} />
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
