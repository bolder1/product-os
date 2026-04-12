'use client'

import { motion } from 'framer-motion'
import { Plus, Tag } from 'lucide-react'
import { type Release, statusConfig } from '../_data/mock-releases'

interface ReleaseTimelineProps {
  releases: Release[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNewRelease: () => void
}

export function ReleaseTimeline({
  releases,
  selectedId,
  onSelect,
  onNewRelease,
}: ReleaseTimelineProps) {
  return (
    <div className="flex flex-col gap-0 relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-14 bottom-4 w-px bg-white/[0.08]" />

      {/* New release card */}
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onNewRelease}
        className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-dashed border-[#10B981]/30 bg-[#10B981]/5 hover:bg-[#10B981]/10 transition-colors group"
      >
        <div className="w-[22px] h-[22px] rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0 z-10">
          <Plus className="w-3 h-3 text-[#10B981]" />
        </div>
        <span className="text-xs font-medium text-[#10B981] group-hover:text-[#34D399] transition-colors">
          New Release
        </span>
      </motion.button>

      {/* Release items */}
      {releases.map((release, i) => {
        const status = statusConfig[release.status]
        const isSelected = selectedId === release.id

        return (
          <motion.button
            key={release.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            onClick={() => onSelect(release.id)}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
              isSelected
                ? 'bg-[#10B981]/10 border border-[#10B981]/30'
                : 'hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 mt-1 z-10">
              <div
                className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: status.color,
                  backgroundColor: isSelected ? status.bg : 'transparent',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs font-mono font-semibold text-[#F1F5F9]">
                    {release.version}
                  </span>
                </div>
                <span
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] truncate">{release.title}</p>
              <p className="text-[10px] text-[#64748B] mt-1">{release.date}</p>
            </div>

            {/* Changes count */}
            <span className="text-[10px] text-[#64748B] bg-white/[0.05] px-1.5 py-0.5 rounded-full flex-shrink-0 mt-1">
              {release.changes.length}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
