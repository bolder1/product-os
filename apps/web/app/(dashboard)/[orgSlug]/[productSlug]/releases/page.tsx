'use client'

import { useState, useMemo } from 'react'
import { Rocket, Plus, Filter } from 'lucide-react'
import { mockReleases, type ReleaseStatus } from './_data/mock-releases'
import { ReleaseTimeline } from './_components/release-timeline'
import { ReleaseDetail } from './_components/release-detail'
import { ReleaseCreateModal } from './_components/release-create-modal'

type StatusFilter = 'all' | ReleaseStatus

export default function ReleasesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string>(mockReleases[0].id)
  const [modalOpen, setModalOpen] = useState(false)

  const filteredReleases = useMemo(() => {
    if (statusFilter === 'all') return mockReleases
    return mockReleases.filter((r) => r.status === statusFilter)
  }, [statusFilter])

  const selectedRelease = useMemo(
    () => mockReleases.find((r) => r.id === selectedId) ?? mockReleases[0],
    [selectedId]
  )

  const latestVersion = mockReleases[0].version

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'staging', label: 'Staging' },
    { key: 'production', label: 'Production' },
  ]

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 shrink-0 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <Rocket size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Releases
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {filteredReleases.length} release{filteredReleases.length !== 1 ? 's' : ''} / Latest: {latestVersion}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          <Filter size={12} className="text-[var(--text-tertiary)]" />
          <div className="tool-tabs" style={{ borderBottom: 'none' }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`tool-tab ${statusFilter === f.key ? 'active' : ''}`}
                style={{ borderBottom: 'none' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="tool-btn tool-btn-primary"
          >
            <Plus size={12} />
            New Release
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Timeline list */}
        <div className="flex-shrink-0 overflow-y-auto w-[300px] border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          <ReleaseTimeline
            releases={filteredReleases}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNewRelease={() => setModalOpen(true)}
          />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-workspace)]">
          {selectedRelease ? (
            <ReleaseDetail release={selectedRelease} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Rocket size={18} className="text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-[12px] text-[var(--text-secondary)]">Select a release to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <ReleaseCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        latestVersion={latestVersion}
      />
    </div>
  )
}
