'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { roleConfigs, type OrgRole } from '../../../../../lib/role-config'

interface Props {
  currentRole: OrgRole
  onChange: (role: OrgRole) => void
}

const ROLE_ORDER: OrgRole[] = [
  'admin', 'manager', 'business_analyst',
  'product_designer', 'frontend_dev', 'backend_dev',
  'qa', 'viewer',
]

export function RoleSwitcher({ currentRole, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const config = roleConfigs[currentRole]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <span className="text-[10px] text-[var(--text-tertiary)]">Viewing as</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-text)]">
          {config.label}
        </span>
        <ChevronDown size={10} className={`text-[var(--text-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 w-[200px] rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-default)] shadow-2xl overflow-hidden py-1"
            >
              {ROLE_ORDER.map((r) => {
                const cfg = roleConfigs[r]
                const isActive = r === currentRole
                return (
                  <button
                    key={r}
                    onClick={() => { onChange(r); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[var(--accent)]' : 'bg-[var(--text-tertiary)]'}`} />
                    <span className="flex-1 text-[11px] text-[var(--text-secondary)]">{cfg.label}</span>
                    {isActive && <Check size={10} className="text-[var(--accent)]" />}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
