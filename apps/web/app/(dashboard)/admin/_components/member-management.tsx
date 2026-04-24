'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Edit3,
  Trash2,
  Ban,
  X,
  ChevronDown,
  Check,
  Users,
} from 'lucide-react'
import type { OrgRole } from '../../../lib/role-config'
import { roleConfigs } from '../../../lib/role-config'

interface Member {
  id: string
  name: string
  email: string
  role: OrgRole
  status: 'active' | 'invited' | 'suspended'
  joinedDate: string
  avatar: string
}

const mockMembers: Member[] = [
  { id: '1', name: 'Surajit Das', email: 'surajit@company.com', role: 'admin', status: 'active', joinedDate: 'Jan 15, 2026', avatar: 'SD' },
  { id: '2', name: 'Sarah Kim', email: 'sarah.kim@company.com', role: 'manager', status: 'active', joinedDate: 'Feb 3, 2026', avatar: 'SK' },
  { id: '3', name: 'Alex Chen', email: 'alex.chen@company.com', role: 'frontend_dev', status: 'active', joinedDate: 'Feb 10, 2026', avatar: 'AC' },
  { id: '4', name: 'Priya Patel', email: 'priya@company.com', role: 'product_designer', status: 'active', joinedDate: 'Feb 18, 2026', avatar: 'PP' },
  { id: '5', name: 'Mike Johnson', email: 'mike.j@company.com', role: 'backend_dev', status: 'active', joinedDate: 'Mar 1, 2026', avatar: 'MJ' },
  { id: '6', name: 'Emma Wilson', email: 'emma.w@company.com', role: 'qa', status: 'invited', joinedDate: 'Mar 15, 2026', avatar: 'EW' },
  { id: '7', name: 'David Lee', email: 'david.lee@company.com', role: 'business_analyst', status: 'active', joinedDate: 'Mar 20, 2026', avatar: 'DL' },
  { id: '8', name: 'Olivia Brown', email: 'olivia.b@company.com', role: 'viewer', status: 'suspended', joinedDate: 'Jan 28, 2026', avatar: 'OB' },
]

const allStudios = [
  'planner', 'templates', 'canvas', 'brand', 'components', 'design',
  'workflow', 'pages', 'graphics', 'code', 'handoff', 'releases',
  'testing', 'tasks', 'approvals', 'notifications', 'analytics',
]

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  invited: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  suspended: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
}

export default function MemberManagement() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<OrgRole | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('viewer')
  const [inviteStudios, setInviteStudios] = useState<Set<string>>(new Set())

  const filtered = mockMembers.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)))
    }
  }

  const toggleInviteStudio = (studio: string) => {
    setInviteStudios((prev) => {
      const next = new Set(prev)
      if (next.has(studio)) next.delete(studio)
      else next.add(studio)
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition"
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as OrgRole | 'all')}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-secondary)] focus:border-[var(--accent)]/40 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Roles</option>
              {(Object.keys(roleConfigs) as OrgRole[]).map((role) => (
                <option key={role} value={role}>{roleConfigs[role].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-[var(--text-secondary)]">{selectedIds.size} selected</span>
              <button className="px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-[var(--text-secondary)] hover:bg-white/[0.06] transition">
                Change Role
              </button>
              <button className="px-3 py-1.5 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 hover:bg-rose-500/20 transition">
                Remove
              </button>
            </motion.div>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-[var(--accent)]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member, i) => {
              const rc = roleConfigs[member.role]
              const sc = statusColors[member.status]
              return (
                <motion.tr
                  key={member.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(member.id)}
                      onChange={() => toggleSelect(member.id)}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.04] accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-[var(--color-white)] flex-shrink-0 bg-[var(--accent)]">
                        {member.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">{member.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                      {rc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full ${sc.bg} ${sc.text} capitalize`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-[var(--text-tertiary)]">{member.joinedDate}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                        className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {actionMenuId === member.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1 w-40 py-1 bg-[#0c1029] border border-white/[0.08] rounded-lg shadow-xl z-10"
                          >
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/[0.04] transition">
                              <Edit3 className="w-3.5 h-3.5" /> Edit Role
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-white/[0.04] transition">
                              <Ban className="w-3.5 h-3.5" /> Suspend
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/[0.04] transition">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Users className="w-8 h-8 text-[var(--bg-surface)] mb-2" />
            <p className="text-sm text-[var(--text-tertiary)]">No members found</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              className="w-full max-w-md mx-4 p-6 bg-[#0c1029] border border-white/[0.08] rounded-2xl shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Invite Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                      className="w-full appearance-none px-3 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-primary)] focus:border-[var(--accent)]/40 focus:outline-none transition cursor-pointer"
                    >
                      {(Object.keys(roleConfigs) as OrgRole[]).map((role) => (
                        <option key={role} value={role}>{roleConfigs[role].label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Custom Studio Access</label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {allStudios.map((studio) => (
                      <button
                        key={studio}
                        onClick={() => toggleInviteStudio(studio)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg border transition ${
                          inviteStudios.has(studio)
                            ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'border-white/[0.06] bg-white/[0.02] text-[var(--text-tertiary)] hover:bg-white/[0.04]'
                        }`}
                      >
                        {inviteStudios.has(studio) && <Check className="w-3 h-3" />}
                        <span className="capitalize truncate">{studio}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm border border-white/[0.08] rounded-lg text-[var(--text-secondary)] hover:bg-white/[0.04] transition"
                >
                  Cancel
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <UserPlus className="w-4 h-4" />
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

