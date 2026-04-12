'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Rocket, Clock, AlertTriangle, CheckCircle2, Globe, Calendar } from 'lucide-react'

interface PublishModalProps {
  open: boolean
  onClose: () => void
  pageName: string
  currentStatus: string
  seoScore: number
  onPublish: (scheduledAt?: string) => void
  onUnpublish: (reason?: string) => void
}

export function PublishModal({ open, onClose, pageName, currentStatus, seoScore, onPublish, onUnpublish }: PublishModalProps) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [unpublishReason, setUnpublishReason] = useState('')

  const isPublished = currentStatus === 'published'
  const seoOk = seoScore >= 50

  const handlePublish = () => {
    if (mode === 'schedule' && scheduledDate && scheduledTime) {
      onPublish(new Date(`${scheduledDate}T${scheduledTime}`).toISOString())
    } else {
      onPublish()
    }
    onClose()
  }

  const handleUnpublish = () => {
    onUnpublish(unpublishReason || undefined)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[400px] rounded-xl bg-[#0C1024] border border-white/[0.08] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {isPublished ? <Globe className="w-4 h-4 text-emerald-400" /> : <Rocket className="w-4 h-4 text-[#3B82F6]" />}
                <span className="text-sm font-medium text-[#F1F5F9]">{isPublished ? 'Manage Publication' : 'Publish Page'}</span>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/[0.06] text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Page info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div>
                  <div className="text-[12px] font-medium text-[#F1F5F9]">{pageName}</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Status: <span className={currentStatus === 'published' ? 'text-emerald-400' : 'text-amber-400'}>{currentStatus}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {seoOk ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className={`text-[10px] ${seoOk ? 'text-emerald-400' : 'text-amber-400'}`}>SEO {seoScore}</span>
                </div>
              </div>

              {!seoOk && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-amber-200">SEO score is low. Consider improving title and description before publishing.</span>
                </div>
              )}

              {!isPublished ? (
                <>
                  {/* Publish mode */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('now')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                        mode === 'now' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' : 'bg-white/[0.03] text-[#64748B] border border-white/[0.06]'
                      }`}
                    >
                      <Rocket className="w-3.5 h-3.5" /> Publish Now
                    </button>
                    <button
                      onClick={() => setMode('schedule')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                        mode === 'schedule' ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30' : 'bg-white/[0.03] text-[#64748B] border border-white/[0.06]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Schedule
                    </button>
                  </div>

                  {mode === 'schedule' && (
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-[#64748B]">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#8B5CF6]/40"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-[#64748B]">Time</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#F1F5F9] focus:outline-none focus:border-[#8B5CF6]/40"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePublish}
                    disabled={mode === 'schedule' && (!scheduledDate || !scheduledTime)}
                    className="w-full py-2.5 rounded-lg text-[12px] font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {mode === 'schedule' ? 'Schedule Publication' : 'Publish Now'}
                  </button>
                </>
              ) : (
                <>
                  {/* Unpublish */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Reason (optional)</label>
                    <textarea
                      value={unpublishReason}
                      onChange={(e) => setUnpublishReason(e.target.value)}
                      placeholder="Why are you unpublishing this page?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleUnpublish}
                    className="w-full py-2.5 rounded-lg text-[12px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                  >
                    Unpublish Page
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
