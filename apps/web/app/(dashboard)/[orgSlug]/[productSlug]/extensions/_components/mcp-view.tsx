'use client'

/**
 * R6 — Extensions · MCP view.
 *
 * Placeholder surface for Model Context Protocol servers. We list the servers
 * that could potentially be attached to Product OS (via the connector store's
 * registry of MCP-style integrations) and explain what MCP enables. A real MCP
 * management flow lands in a later phase.
 */

import { Cable, Server, Shield, Sparkles, ExternalLink } from 'lucide-react'

const MCP_KINDS = [
  {
    name: 'Local MCP Server',
    host: 'stdio / local process',
    desc: 'Run a trusted MCP server on this machine. Best for private data and dev tooling.',
    status: 'Recommended',
    statusColor: 'var(--color-success)',
  },
  {
    name: 'Remote MCP Server',
    host: 'https endpoint',
    desc: 'Connect to a hosted MCP server. Use for third-party integrations and team-shared capabilities.',
    status: 'Beta',
    statusColor: 'var(--color-warning)',
  },
  {
    name: 'In-process MCP Skill',
    host: 'embedded',
    desc: 'Skills shipped with Product OS expose themselves through MCP automatically — nothing to install.',
    status: 'Built-in',
    statusColor: 'var(--accent-text)',
  },
]

export default function MCPView() {
  return (
    <div className="flex h-full w-full bg-[var(--bg-base)] overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-10 py-10 space-y-8">
        <section className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
            <Cable size={20} />
          </div>
          <div>
            <h2 className="font-serif text-[28px] leading-tight tracking-[-0.02em] text-[var(--text-primary)] m-0">
              Model Context Protocol
            </h2>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.55] text-[var(--text-secondary)]">
              MCP is the standard way Product OS exchanges tools, resources, and prompts with
              outside systems. Point Copilot at an MCP server and it can query databases, take
              screenshots, call internal APIs — using your credentials, logged under Computer Mode.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3">
            How MCP fits in
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MCP_KINDS.map((m) => (
              <article
                key={m.name}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
              >
                <header className="flex items-center gap-2 mb-2">
                  <Server size={14} className="text-[var(--text-tertiary)]" />
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{m.name}</span>
                </header>
                <p className="text-[11px] font-mono text-[var(--text-tertiary)] mb-3">{m.host}</p>
                <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)] mb-4">{m.desc}</p>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-subtle)', color: m.statusColor }}
                >
                  {m.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={16} className="text-[var(--text-tertiary)] mt-[2px]" />
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text-primary)] m-0">Security model</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-[1.55] mt-1 max-w-[64ch]">
                Every MCP call Copilot makes goes through Computer Mode. You choose whether
                individual servers run in Suggest, Assist, or Auto. All invocations are written
                to Computer Log and can be rolled back from the Intelligence Mode.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 px-3 h-8 rounded-md text-[13px] font-medium border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]">
              <Sparkles size={14} />
              Ask Copilot to set one up
            </button>
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 h-8 rounded-md text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Read the MCP spec
              <ExternalLink size={12} />
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
