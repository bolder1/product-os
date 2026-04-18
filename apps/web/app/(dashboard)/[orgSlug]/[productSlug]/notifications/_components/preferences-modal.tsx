'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

interface PreferencesModalProps {
  onClose: () => void
  productId: string
}

const NOTIFICATION_TYPES = [
  { id: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you' },
  { id: 'task_updated', label: 'Task Updated', description: 'When a task you follow is updated' },
  { id: 'approval_requested', label: 'Approval Requested', description: 'When approval is requested from you' },
  { id: 'approval_decided', label: 'Approval Decided', description: 'When an approval you made is decided' },
  { id: 'comment_mention', label: 'Mentioned in Comment', description: 'When you are mentioned in a comment' },
  { id: 'comment_reply', label: 'Comment Reply', description: 'When someone replies to your comment' },
  { id: 'release_ready', label: 'Release Ready', description: 'When a release is ready to publish' },
]

export function PreferencesModal({ onClose, productId }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  const getPreferencesQuery = trpc.notification.getPreferences.useQuery({ productId })
  const setPreferencesMutation = trpc.notification.setPreferences.useMutation({
    onSuccess: () => {
      setSaving(false)
      setTimeout(onClose, 300)
    },
  })

  const currentPrefs = getPreferencesQuery.data || {}

  const handleToggle = (type: string) => {
    const current = preferences[type] || currentPrefs[type] || { enabled: true, channel: 'in_app', emailDigestFrequency: 'off' }
    setPreferences({
      ...preferences,
      [type]: {
        ...current,
        enabled: !current.enabled,
      },
    })
  }

  const handleChannelChange = (type: string, channel: string) => {
    const current = preferences[type] || currentPrefs[type] || { enabled: true, channel: 'in_app', emailDigestFrequency: 'off' }
    setPreferences({
      ...preferences,
      [type]: {
        ...current,
        channel,
      },
    })
  }

  const handleSave = () => {
    setSaving(true)
    const allPrefs: Record<string, any> = {}
    
    for (const type of NOTIFICATION_TYPES.map(t => t.id)) {
      allPrefs[type] = preferences[type] || currentPrefs[type] || {
        enabled: true,
        channel: 'in_app',
        emailDigestFrequency: 'off',
      }
    }

    setPreferencesMutation.mutate({
      productId,
      preferences: allPrefs,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--bg-surface)] rounded-xl shadow-lg w-full max-w-[500px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Notification Preferences</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {NOTIFICATION_TYPES.map((type) => {
            const current = preferences[type.id] || currentPrefs[type.id] || { enabled: true, channel: 'in_app', emailDigestFrequency: 'off' }
            
            return (
              <div key={type.id} className="border border-[var(--border-subtle)] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">{type.label}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{type.description}</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={current.enabled}
                      onChange={() => handleToggle(type.id)}
                      className="w-4 h-4 rounded border border-[var(--border-default)] cursor-pointer"
                    />
                  </label>
                </div>

                {current.enabled && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2">
                      <input
                        type="radio"
                        value="in_app"
                        checked={current.channel === 'in_app'}
                        onChange={() => handleChannelChange(type.id, 'in_app')}
                        className="cursor-pointer"
                      />
                      In-app only
                    </label>
                    <label className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2">
                      <input
                        type="radio"
                        value="email"
                        checked={current.channel === 'email'}
                        onChange={() => handleChannelChange(type.id, 'email')}
                        className="cursor-pointer"
                      />
                      Email only
                    </label>
                    <label className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-2">
                      <input
                        type="radio"
                        value="both"
                        checked={current.channel === 'both'}
                        onChange={() => handleChannelChange(type.id, 'both')}
                        className="cursor-pointer"
                      />
                      Both
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[var(--border-default)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || getPreferencesQuery.isLoading}
            className="px-4 py-2 rounded-lg text-[11px] font-medium bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
