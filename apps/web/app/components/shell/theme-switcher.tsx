'use client'

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Contrast, Check } from 'lucide-react'
import { useTheme, THEME_OPTIONS, type Theme } from '../../lib/use-theme'

/**
 * R19 — Topbar theme switcher.
 *
 * Icon button in the topbar that opens a small menu with the three
 * themes (Light / Dark / Dark-HC). Mirrors the RoleSelector pattern
 * for visual consistency.
 */

const ICONS: Record<Theme, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  light: Sun,
  dark: Moon,
  'dark-hc': Contrast,
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const CurrentIcon = ICONS[theme]
  const currentOpt = THEME_OPTIONS.find((o) => o.value === theme)

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="tool-btn-ghost tool-btn-icon"
        title={`Theme: ${currentOpt?.label ?? theme}`}
        aria-label="Change theme"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon size={14} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-[220px] rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-panel)] py-1.5 z-50"
          style={{ animation: 'slideInDown var(--duration-base) var(--ease-out)' }}
        >
          <div className="px-3 pt-1.5 pb-2 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Appearance
          </div>
          {THEME_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.value]
            const isActive = opt.value === theme
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  isActive ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--surface-hover)]'
                }`}
                role="option"
                aria-selected={isActive}
              >
                <Icon size={14} strokeWidth={1.75} className="shrink-0 text-[var(--text-secondary)]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">
                      {opt.label}
                    </span>
                    {isActive && <Check size={12} className="text-[var(--accent-text)]" />}
                  </div>
                  <div className="text-[var(--font-size-caption)] text-[var(--text-tertiary)] leading-[var(--line-height-caption)] truncate">
                    {opt.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
