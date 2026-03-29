'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Minus, ShieldCheck, ShieldAlert } from 'lucide-react'

const ROLES = ['Admin', 'Manager', 'BA', 'QA', 'Designer', 'FE Dev', 'BE Dev', 'Viewer']

const STUDIOS = [
  'Planner', 'Templates', 'Brand', 'Components', 'Design',
  'Workflows', 'Pages', 'Code', 'Tasks', 'Approvals', 'Analytics',
]

type AccessMatrix = Record<string, Record<string, boolean>>

const initialMatrix: AccessMatrix = {
  Admin:    Object.fromEntries(STUDIOS.map((s) => [s, true])),
  Manager:  Object.fromEntries(STUDIOS.map((s) => [s, true])),
  BA:       Object.fromEntries(STUDIOS.map((s) => [s, ['Planner', 'Templates', 'Tasks', 'Workflows', 'Approvals', 'Analytics'].includes(s)])),
  QA:       Object.fromEntries(STUDIOS.map((s) => [s, ['Tasks', 'Workflows', 'Code', 'Approvals', 'Analytics'].includes(s)])),
  Designer: Object.fromEntries(STUDIOS.map((s) => [s, ['Brand', 'Components', 'Design', 'Pages', 'Templates', 'Tasks'].includes(s)])),
  'FE Dev': Object.fromEntries(STUDIOS.map((s) => [s, ['Components', 'Design', 'Pages', 'Code', 'Tasks', 'Workflows'].includes(s)])),
  'BE Dev': Object.fromEntries(STUDIOS.map((s) => [s, ['Code', 'Workflows', 'Tasks', 'Analytics'].includes(s)])),
  Viewer:   Object.fromEntries(STUDIOS.map((s) => [s, ['Planner', 'Analytics'].includes(s)])),
}

interface AccessRequest {
  id: string
  user: string
  initials: string
  role: string
  studio: string
  reason: string
  requestedAt: string
}

const initialRequests: AccessRequest[] = [
  {
    id: 'ar1',
    user: 'Dana Patel',
    initials: 'DP',
    role: 'QA',
    studio: 'Design',
    reason: 'Need to review design specs for test case creation',
    requestedAt: '2026-03-28',
  },
  {
    id: 'ar2',
    user: 'Charlie Kim',
    initials: 'CK',
    role: 'BE Dev',
    studio: 'Components',
    reason: 'Working on component API integration, need component reference',
    requestedAt: '2026-03-27',
  },
]

export function RolesAccess() {
  const [matrix, setMatrix] = useState<AccessMatrix>(initialMatrix)
  const [requests, setRequests] = useState<AccessRequest[]>(initialRequests)

  const toggleAccess = (role: string, studio: string) => {
    if (role === 'Admin') return // Admin always has full access
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [studio]: !prev[role][studio],
      },
    }))
  }

  const approveRequest = (req: AccessRequest) => {
    setMatrix((prev) => ({
      ...prev,
      [req.role]: {
        ...prev[req.role],
        [req.studio]: true,
      },
    }))
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
  }

  const denyRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Role matrix */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#E2E8F0]">Access Matrix</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Toggle studio access for each role. Admin always has full access.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-xs font-semibold text-[#94A3B8] bg-white/[0.02] sticky left-0 z-10 min-w-[100px]">
                  Role
                </th>
                {STUDIOS.map((studio) => (
                  <th
                    key={studio}
                    className="px-3 py-3 text-[0.625rem] font-semibold text-[#94A3B8] bg-white/[0.02] text-center whitespace-nowrap"
                  >
                    {studio}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role, rowIdx) => (
                <tr
                  key={role}
                  className={`border-b border-white/[0.04] ${
                    rowIdx % 2 === 0 ? 'bg-white/[0.01]' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-[#CBD5E1] sticky left-0 z-10 bg-inherit">
                    {role}
                  </td>
                  {STUDIOS.map((studio) => {
                    const hasAccess = matrix[role]?.[studio] ?? false
                    const isAdmin = role === 'Admin'
                    return (
                      <td key={studio} className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => toggleAccess(role, studio)}
                          disabled={isAdmin}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
                            isAdmin
                              ? 'cursor-default'
                              : 'cursor-pointer hover:bg-white/[0.06]'
                          }`}
                        >
                          {hasAccess ? (
                            <Check
                              size={14}
                              className={
                                isAdmin ? 'text-[#10B981]/50' : 'text-[#10B981]'
                              }
                            />
                          ) : (
                            <Minus size={14} className="text-[#334155]" />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Requests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-[#E2E8F0]">
            Access Requests
          </h3>
          {requests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] text-[0.625rem] font-medium">
              {requests.length}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-6 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[#64748B]">
            <ShieldCheck size={16} />
            <span className="text-sm">No pending access requests</span>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              >
                <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] text-xs font-medium">
                  {req.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#E2E8F0]">{req.user}</span>
                    <span className="text-[0.625rem] text-[#64748B]">({req.role})</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Requesting access to <span className="text-[#CBD5E1]">{req.studio}</span>
                  </p>
                  <p className="text-[0.6875rem] text-[#475569] mt-1 italic">
                    &ldquo;{req.reason}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approveRequest(req)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyRequest(req.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
