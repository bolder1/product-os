'use client'

import { motion } from 'framer-motion'
import {
  Crown,
  ArrowUpRight,
  AlertTriangle,
  Settings2,
} from 'lucide-react'
import type { OrgRole } from '../../../lib/role-config'
import { roleConfigs } from '../../../lib/role-config'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

interface SeatAllocation {
  role: OrgRole
  allocated: number
  used: number
}

const planInfo = {
  name: 'Team Pro',
  totalSeats: 30,
  usedSeats: 24,
  renewalDate: 'Apr 15, 2026',
}

const seatAllocations: SeatAllocation[] = [
  { role: 'admin', allocated: 2, used: 1 },
  { role: 'manager', allocated: 3, used: 2 },
  { role: 'business_analyst', allocated: 4, used: 3 },
  { role: 'product_designer', allocated: 5, used: 4 },
  { role: 'frontend_dev', allocated: 6, used: 5 },
  { role: 'backend_dev', allocated: 4, used: 3 },
  { role: 'qa', allocated: 3, used: 2 },
  { role: 'viewer', allocated: 3, used: 4 }, // Overage!
]

export default function SeatManagement() {
  const usedPercentage = (planInfo.usedSeats / planInfo.totalSeats) * 100
  const hasOverage = seatAllocations.some((s) => s.used > s.allocated)

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Current plan card */}
      <motion.div
        className="p-6 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01]"
        variants={fadeUp}
        custom={0}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/12 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{planInfo.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">Current Plan</span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Renews {planInfo.renewalDate}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <ArrowUpRight className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>

        {/* Seat usage bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">Seats Used</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {planInfo.usedSeats} / {planInfo.totalSeats}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                usedPercentage > 90
                  ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                  : usedPercentage > 70
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">{Math.round(usedPercentage)}% used</span>
            <span className="text-xs text-[var(--text-tertiary)]">{planInfo.totalSeats - planInfo.usedSeats} available</span>
          </div>
        </div>
      </motion.div>

      {/* Overage warning */}
      {hasOverage && (
        <motion.div
          className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5"
          variants={fadeUp}
          custom={1}
        >
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-400">Seat Overage Detected</p>
            <p className="text-xs text-rose-400/70 mt-0.5">
              One or more roles exceed their allocated seats. Please adjust allocations or upgrade your plan.
            </p>
          </div>
        </motion.div>
      )}

      {/* Seat allocation table */}
      <motion.div
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
        variants={fadeUp}
        custom={2}
      >
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Seat Allocation by Role</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Allocated</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Used</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Available</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">Usage</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {seatAllocations.map((seat, i) => {
              const rc = roleConfigs[seat.role]
              const available = seat.allocated - seat.used
              const isOver = available < 0
              const usagePct = Math.min((seat.used / seat.allocated) * 100, 100)

              return (
                <motion.tr
                  key={seat.role}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                        {rc.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[var(--text-primary)]">{seat.allocated}</td>
                  <td className="px-5 py-3.5 text-sm text-[var(--text-primary)]">{seat.used}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-medium ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isOver ? `${available} (overage)` : available}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="w-24 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${isOver ? 100 : usagePct}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[var(--text-secondary)] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition ml-auto">
                      <Settings2 className="w-3 h-3" />
                      Adjust
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  )
}
