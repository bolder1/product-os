'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
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
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Releases</h1>
            <p className="text-xs text-[#64748B]">
              {filteredReleases.length} release{filteredReleases.length !== 1 ? 's' : ''} / Latest: {latestVersion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === f.key
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Release
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-5 min-h-0">
        {/* Left: Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[320px] flex-shrink-0 overflow-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] p-3"
        >
          <ReleaseTimeline
            releases={filteredReleases}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNewRelease={() => setModalOpen(true)}
          />
        </motion.div>

        {/* Right: Detail */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 min-w-0 overflow-auto rounded-2xl bg-white/[0.02] border border-white/[0.08] p-5"
        >
          {selectedRelease ? (
            <ReleaseDetail release={selectedRelease} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Rocket className="w-10 h-10 text-[#10B981]/30 mx-auto mb-3" />
                <p className="text-sm text-[#64748B]">Select a release to view details</p>
              </div>
            </div>
          )}
        </motion.div>
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
