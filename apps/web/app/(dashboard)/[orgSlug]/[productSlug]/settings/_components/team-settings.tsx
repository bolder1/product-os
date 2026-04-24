'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Mail, Clock, UserMinus, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useMemberStore, type DbRole, type Member } from '../../../../../lib/member-store'

const ROLES: DbRole[] = ['owner', 'admin', 'editor', 'viewer', 'guest']

const ROLE_LABELS: Record<DbRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  guest: 'Guest',
}

const ROLE_COLORS: Record<DbRole, string> = {
  owner: '#F43F5E',
  admin: '#8B5CF6',
  editor: '#06B6D4',
  viewer: '#64748B',
  guest: '#94A3B8',
}

// Display fallback when DB has no members yet — keeps the panel visually
// populated for first-run / unauthenticated states.
const FALLBACK_MEMBERS: Member[] = [
  {
    id: 'fallback-1',
    userId: 'fallback-1',
    orgId: 'fallback',
    role: 'owner',
    name: 'Alice Chen',
    email: 'alice@productos.dev',
    avatarUrl: null,
    invitedAt: null,
    acceptedAt: '2026-01-10',
    createdAt: '2026-01-10',
  },
  {
    id: 'fallback-2',
    userId: 'fallback-2',
    orgId: 'fallback',
    role: 'editor',
    name: 'Bob Rivera',
    email: 'bob@productos.dev',
    avatarUrl: null,
    invitedAt: null,
    acceptedAt: '2026-01-12',
    createdAt: '2026-01-12',
  },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function colorFor(name: string): string {
  // Stable hash → hue
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return `hsl(${h % 360}, 60%, 55%)`
}

export function TeamSettings() {
  const { members: dbMembers, hydrate, invite, updateRole, remove, isLoading, error } = useMemberStore(useShallow((s) => s))

  useEffect(() => {
    hydrate().catch(() => {})
  }, [hydrate])

  const members = useMemo(() => (dbMembers.length > 0 ? dbMembers : FALLBACK_MEMBERS), [dbMembers])
  const usingFallback = dbMembers.length === 0

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<DbRole>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<Member[]>([])

  // Pending invitations = members invited but not yet accepted
  useEffect(() => {
    setPendingInvitations(dbMembers.filter((m) => m.invitedAt && !m.acceptedAt))
  }, [dbMembers])

  const sendInvite = async () => {
    if (!inviteEmail) return
    setSubmitting(true)
    try {
      await invite(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('viewer')
      setShowInviteForm(false)
    } catch {
      // Error is captured in the store
    } finally {
      setSubmitting(false)
    }
  }

  const handleRoleChange = async (m: Member, role: DbRole) => {
    if (usingFallback) return
    try {
      await updateRole(m.id, role)
    } catch {}
  }

  const handleRemove = async (m: Member) => {
    if (usingFallback) return
    try {
      await remove(m.id)
    } catch {}
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Team Members</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {members.length} member{members.length !== 1 ? 's' : ''}
              {usingFallback && ' (preview)'}
              {isLoading && ' · syncing…'}
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent)] transition-colors"
          >
            <Plus size={14} />
            Invite Member
          </button>
        </div>

        {error && (
          <div className="text-[11px] text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

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
                  <label className="text-xs text-[var(--text-tertiary)]">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  />
                </div>
                <div className="w-40 space-y-1.5">
                  <label className="text-xs text-[var(--text-tertiary)]">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as DbRole)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {ROLES.filter((r) => r !== 'owner').map((r) => (
                      <option key={r} value={r} className="bg-[#0f1629]">
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={sendInvite}
                  disabled={submitting || !inviteEmail}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-success)] hover:bg-[var(--color-success)] transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-white/[0.06] transition-colors"
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
                style={{ backgroundColor: colorFor(member.name) }}
              >
                {initials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{member.name}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</p>
              </div>
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member, e.target.value as DbRole)}
                disabled={usingFallback || member.role === 'owner'}
                className="px-2 py-0.5 rounded-md text-[0.6875rem] font-medium shrink-0 bg-transparent border border-transparent hover:border-white/[0.08] focus:outline-none focus:border-[var(--accent)]/50 cursor-pointer disabled:cursor-default disabled:opacity-80"
                style={{
                  color: ROLE_COLORS[member.role],
                  backgroundColor: `${ROLE_COLORS[member.role]}15`,
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0f1629]">
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member)}
                  disabled={usingFallback}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pending Invitations</h3>
          <div className="space-y-1">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[var(--text-tertiary)]">
                  <Mail size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[0.625rem] font-medium"
                      style={{ color: ROLE_COLORS[inv.role] }}
                    >
                      {ROLE_LABELS[inv.role]}
                    </span>
                    <span className="flex items-center gap-1 text-[0.625rem] text-[var(--text-tertiary)]">
                      <Clock size={9} />
                      Sent {inv.invitedAt?.slice(0, 10)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(inv)}
                  className="px-2.5 py-1 rounded-md text-xs text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
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
