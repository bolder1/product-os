'use client'

/**
 * R6 — Unified Extensions Studio (Intelligence Mode).
 *
 * Collapses what used to be `/connectors`, `/ai-skills`, and the standalone MCP
 * concept into one surface. The shell provides a shared editorial PageHeader
 * and top tab bar; the views keep their existing rich UI.
 *
 *   Connectors · Third-party syncs (Figma, Jira, GitHub, Mixpanel…)
 *   MCP        · Model Context Protocol servers and skills
 *   Skills     · Registered AI skills, per-skill permissions, executions
 *
 * Deep link via ?tab=connectors|mcp|skills. Legacy routes redirect here.
 */

import { useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Plug, Cable, Sparkles } from 'lucide-react'
import { PageHeader } from '@product-os/ui'
import ConnectorsView from './_components/connectors-view'
import MCPView from './_components/mcp-view'
import SkillsView from './_components/skills-view'

type ExtTab = 'connectors' | 'mcp' | 'skills'

const TABS: { id: ExtTab; label: string; icon: typeof Plug; blurb: string }[] = [
  { id: 'connectors', label: 'Connectors', icon: Plug,     blurb: 'Sync with Figma, Jira, GitHub, analytics…' },
  { id: 'mcp',        label: 'MCP',        icon: Cable,    blurb: 'Model Context Protocol servers and tools' },
  { id: 'skills',     label: 'AI Skills',  icon: Sparkles, blurb: 'Registered AI actions, permissions, log' },
]

function isExtTab(v: string | null): v is ExtTab {
  return v === 'connectors' || v === 'mcp' || v === 'skills'
}

export default function ExtensionsStudioPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawTab = searchParams.get('tab')
  const tab: ExtTab = isExtTab(rawTab) ? rawTab : 'connectors'
  const activeBlurb = useMemo(() => TABS.find((t) => t.id === tab)?.blurb ?? '', [tab])

  function setTab(next: ExtTab) {
    const p = new URLSearchParams(searchParams.toString())
    if (next === 'connectors') p.delete('tab')
    else p.set('tab', next)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-base)] overflow-hidden">
      <PageHeader
        eyebrow={<span>Intelligence · Extensions</span>}
        title="Extensions"
        subtitle={activeBlurb}
        bordered={false}
        className="px-10 pt-8 pb-4"
      />

      <div className="px-10 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-2 px-4 h-11 text-[13px] transition-colors"
                style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <Icon size={14} />
                <span className="font-medium">{t.label}</span>
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full transition-all"
                  style={{ background: active ? 'var(--accent-text)' : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'connectors' && <ConnectorsView />}
        {tab === 'mcp' && <MCPView />}
        {tab === 'skills' && <SkillsView />}
      </div>
    </div>
  )
}
