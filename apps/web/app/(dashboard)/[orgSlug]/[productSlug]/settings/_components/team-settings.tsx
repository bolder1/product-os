'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Mail, Clock, UserMinus } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  initials: string
  role: string
  color: string
}

interface Invitation {
  id: string
  email: string
  role: string
  sentAt: string
}

const ROLES = ['Admin', 'Manager', 'BA', 'QA', 'Designer', 'FE Developer', 'BE Developer', 'Viewer']

const ROLE_COLORS: Record<string, string> = {
  Admin: '#F43F5E',
  Manager: '#8B5CF6',
  BA: '#3B82F6',
  QA: '#F59E0B',
  Designer: '#EC4899',
  'FE Developer': '#06B6D4',
  'BE Developer': '#10B981',
  Viewer: '#64748B',
}

const initialMembers: TeamMember[] = [
  { id: 'm1', name: 'Alice Chen', email: 'alice@productos.dev', initials: 'AC', role: 'Admin', color: '#8B5CF6' },
  { id: 'm2', name: 'Bob Rivera', email: 'bob@productos.dev', initials: 'BR', role: 'Designer', color: '#EC4899' },
  { id: 'm3', name: 'Charlie Kim', email: 'charlie@productos.dev', initials: 'CK', role: 'BE Developer', color: '#14B8A6' },
  { id: 'm4', name: 'Dana Patel', email: 'dana@productos.dev', initials: 'DP', role: 'QA', color: '#F97316' },
  { id: 'm5', name: 'Eve Santos', email: 'eve@productos.dev', initials: 'ES', role: 'FE Developer', color: '#06B6D4' },
]

const initialInvitations: Invitation[] = [
  { id: 'inv1', email: 'frank@productos.dev', role: 'BA', sentAt: '2026-03-28' },
  { id: 'inv2', email: 'grace@productos.dev', role: 'Designer', sentAt: '2026-03-27' },
]

export function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Viewer')

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const cancelInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id))
  }

  const sendInvite = () => {
    if (!inviteEmail) return
    setInvitations((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}`,
        email: inviteEmail,
        role: inviteRole,
        sentAt: new Date().toISOString().slice(0, 10),
      },
    ])
    setInviteEmail('')
    setInviteRole('Viewer')
    setShowInviteForm(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-3xl"
    >
      {/* Team members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#E2E8F0]">Team Members</h3>
            <p className="text-xs text-[#64748B] mt-0.5">{members.length} members</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
          >
            <Plus size={14} />
            Invite Member
          </button>
        </div>

        {/* Invite form */}
        <AnimatePresence>
          {showInviteForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-end gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs text-[#64748B]">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
                  />
                </div>
                <div className="w-40 space-y-1.5">
                  <label className="text-xs text-[#64748B]">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-[#0f1629]">{r}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={sendInvite}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="p-2 rounded-lg text-[#64748B] hover:bg-white/[0.06] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member list */}
        <div className="space-y-1">
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E2E8F0] truncate">{member.name}</p>
                <p className="text-xs text-[#64748B] truncate">{member.email}</p>
              </div>
              <span
                className="px-2 py-0.5 rounded-md text-[0.6875rem] font-medium shrink-0"
                style={{
                  color: ROLE_COLORS[member.role] || '#94A3B8',
                  backgroundColor: `${ROLE_COLORS[member.role] || '#94A3B8'}15`,
                }}
              >
                {member.role}
              </span>
              {member.role !== 'Admin' && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="p-1.5 rounded-md text-[#475569] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#E2E8F0]">Pending Invitations</h3>
          <div className="space-y-1">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[#64748B]">
                  <Mail size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#CBD5E1] truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[0.625rem] font-medium"
                      style={{ color: ROLE_COLORS[inv.role] || '#94A3B8' }}
                    >
                      {inv.role}
                    </span>
                    <span className="flex items-center gap-1 text-[0.625rem] text-[#475569]">
                      <Clock size={9} />
                      Sent {inv.sentAt}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => cancelInvitation(inv.id)}
                  className="px-2.5 py-1 rounded-md text-xs text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
