'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Rocket, Plus, Filter } from 'lucide-react'
import {
  mockReleases,
  type Release as MockRelease,
  type ReleaseStatus,
  type ReleaseChange as MockChange,
} from './_data/mock-releases'
import { ReleaseTimeline } from './_components/release-timeline'
import { ReleaseDetail } from './_components/release-detail'
import { ReleaseCreateModal } from './_components/release-create-modal'
import { useProduct } from '../layout'
import { useReleaseStore, type Release as StoreRelease } from '../../../../lib/release-store'

type StatusFilter = 'all' | ReleaseStatus

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.valueOf()) ? iso : d.toISOString().slice(0, 10)
}

/** Reduce store-level change types into the subset the UI understands. */
function toMockChangeType(t: StoreRelease['changes'][number]['type']): MockChange['type'] {
  if (t === 'entity' || t === 'workflow') return 'api'
  return t
}

function toMockRelease(r: StoreRelease): MockRelease {
  return {
    id: r.id,
    version: r.version || 'v0.0.0',
    title: r.title,
    status: r.status,
    date: formatDate(r.deployedAt ?? r.updatedAt ?? r.createdAt),
    notes: r.notes,
    changes: r.changes.map((c) => ({
      name: c.name,
      type: toMockChangeType(c.type),
      changeType: c.changeType,
    })),
    checklist: r.checklist,
  }
}

export default function ReleasesPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const storeReleases = useReleaseStore((s) => s.releases)
  const statusFilter = useReleaseStore((s) => s.statusFilter) as StatusFilter
  const setStoreStatusFilter = useReleaseStore((s) => s.setStatusFilter)
  const selectedStoreId = useReleaseStore((s) => s.selectedId)
  const selectStore = useReleaseStore((s) => s.select)

  const productReleases = useMemo(
    () => storeReleases.filter((r) => r.productId === productId),
    [storeReleases, productId],
  )
  const isLive = productReleases.length > 0

  const allReleases: MockRelease[] = isLive
    ? productReleases.map(toMockRelease)
    : mockReleases

  const filteredReleases = useMemo(() => {
    if (statusFilter === 'all') return allReleases
    return allReleases.filter((r) => r.status === statusFilter)
  }, [allReleases, statusFilter])

  const [modalOpen, setModalOpen] = useState(false)

  const selectedId = selectedStoreId ?? filteredReleases[0]?.id ?? allReleases[0]?.id ?? ''
  const selectedRelease = useMemo(
    () => allReleases.find((r) => r.id === selectedId) ?? allReleases[0],
    [allReleases, selectedId],
  )

  const latestVersion = allReleases[0]?.version ?? 'v0.1.0'

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
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          <Filter size={12} className="text-[var(--text-tertiary)]" />
          <div className="tool-tabs" style={{ borderBottom: 'none' }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStoreStatusFilter(f.key)}
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
            onSelect={selectStore}
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
