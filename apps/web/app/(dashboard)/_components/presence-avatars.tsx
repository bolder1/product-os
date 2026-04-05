'use client'

import { type PresenceState } from '../../lib/use-collaboration'

interface PresenceAvatarsProps {
  peers: PresenceState[]
  maxVisible?: number
}

export function PresenceAvatars({ peers, maxVisible = 5 }: PresenceAvatarsProps) {
  // Only show peers active in the last 60 seconds
  const activePeers = peers.filter(
    (p) => Date.now() - p.lastActive < 60_000
  )

  if (activePeers.length === 0) return null

  const visible = activePeers.slice(0, maxVisible)
  const overflow = activePeers.length - maxVisible

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((peer) => (
        <div
          key={peer.user.id}
          className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] text-[10px] font-semibold text-white"
          style={{ backgroundColor: peer.user.color }}
          title={`${peer.user.name}${peer.activeStudio ? ` — ${peer.activeStudio}` : ''}`}
        >
          {peer.user.initials}
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-primary)] bg-emerald-400" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-tertiary)] text-[10px] font-medium text-[var(--text-secondary)]">
          +{overflow}
        </div>
      )}
    </div>
  )
}

interface ConnectionBadgeProps {
  status: 'connecting' | 'connected' | 'disconnected'
}

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  const config = {
    connected: { color: 'bg-emerald-500', label: 'Live' },
    connecting: { color: 'bg-amber-500 animate-pulse', label: 'Connecting' },
    disconnected: { color: 'bg-zinc-500', label: 'Offline' },
  }

  const { color, label } = config[status]

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-tertiary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  )
}
