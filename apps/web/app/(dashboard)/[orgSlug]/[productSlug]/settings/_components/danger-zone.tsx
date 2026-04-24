'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowRight, Archive, Trash2, Shield } from 'lucide-react'

export function DangerZone() {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const PRODUCT_NAME = 'Product OS'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-[var(--color-error)]" />
        <h3 className="text-sm font-semibold text-[var(--color-error)]">Danger Zone</h3>
      </div>

      {/* Transfer Ownership */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-3">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              Transfer Ownership
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
              Transfer this product to another team member. They will become the
              owner with full admin permissions. You will be downgraded to a
              Manager role.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-[30px]">
          <select className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-warning)]/50 transition-colors appearance-none cursor-pointer">
            <option value="" className="bg-[#0f1629]">
              Select a team member...
            </option>
            <option value="bob" className="bg-[#0f1629]">
              Bob Rivera (Designer)
            </option>
            <option value="charlie" className="bg-[#0f1629]">
              Charlie Kim (BE Developer)
            </option>
          </select>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[var(--color-warning)] border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning)]/10 transition-colors">
            <ArrowRight size={14} />
            Transfer
          </button>
        </div>
      </div>

      {/* Archive Product */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-3">
        <div className="flex items-start gap-3">
          <Archive size={18} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              Archive Product
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
              Archiving hides the product from the sidebar and dashboard. Team
              members will lose access. You can unarchive at any time from your
              organization settings.
            </p>
          </div>
        </div>
        <div className="ml-[30px]">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[var(--color-warning)] border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning)]/10 transition-colors">
            <Archive size={14} />
            Archive this product
          </button>
        </div>
      </div>

      {/* Delete Product */}
      <div className="p-5 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/[0.03] space-y-3">
        <div className="flex items-start gap-3">
          <Trash2 size={18} className="text-[var(--color-error)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-[var(--color-error)]">
              Delete Product
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
              Permanently delete this product and all of its data. This includes
              all studios, tasks, workflows, components, pages, designs, brand
              assets, and changelog history.{' '}
              <span className="text-[var(--color-error)] font-medium">
                This action cannot be undone.
              </span>
            </p>
          </div>
        </div>
        <div className="ml-[30px]">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[var(--color-error)] border border-[var(--color-error)]/40 hover:bg-[var(--color-error)]/10 transition-colors"
            >
              <Trash2 size={14} />
              Delete this product
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <p className="text-xs text-[var(--text-secondary)]">
                  Type <span className="font-mono text-[var(--color-error)] font-medium">{PRODUCT_NAME}</span>{' '}
                  to confirm deletion:
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={PRODUCT_NAME}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-[var(--color-error)]/30 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-error)]/60 transition-colors"
                  />
                  <button
                    disabled={deleteInput !== PRODUCT_NAME}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      deleteInput === PRODUCT_NAME
                        ? 'bg-[var(--color-error)] text-white hover:bg-[#E11D48]'
                        : 'bg-[var(--color-error)]/20 text-[var(--color-error)]/50 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 size={14} />
                    Permanently Delete
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false)
                      setDeleteInput('')
                    }}
                    className="px-3 py-2 rounded-lg text-xs text-[var(--text-tertiary)] hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  )
}
