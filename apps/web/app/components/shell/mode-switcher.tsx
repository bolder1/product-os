'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Compass, Layers, Rocket, Activity, Sparkles, ChevronDown, Check } from 'lucide-react'
import { modes, getMode, modeForStudio, type ModeKey } from '../../lib/mode-config'
import { useModeStore } from '../../lib/mode-store'

const iconMap: Record<ModeKey, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  plan: Compass,
  build: Layers,
  ship: Rocket,
  operate: Activity,
  intelligence: Sparkles,
}

/**
 * Topbar Mode switcher.
 *
 * Shows the current Mode and opens a dropdown of the 5 Modes.
 * Switching navigates to that Mode's default studio, preserving org/product.
 */
export function ModeSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const segments = pathname.split('/').filter(Boolean)
  const orgSlug = segments[0] ?? ''
  const productSlug = segments[1] ?? ''
  const studioSlug = segments[2] ?? ''
  const basePath = orgSlug && productSlug ? `/${orgSlug}/${productSlug}` : ''

  // Mode derivation: URL wins; fall back to persisted.
  const derivedMode = useMemo<ModeKey>(() => modeForStudio(studioSlug), [studioSlug])
  const persisted = useModeStore((s) => s.currentMode)
  const setPersisted = useModeStore((s) => s.setCurrentMode)
  const currentMode = studioSlug ? derivedMode : persisted
  const currentDef = getMode(currentMode)
  const Icon = iconMap[currentMode]

  useEffect(() => {
    setPersisted(currentMode)
  }, [currentMode, setPersisted])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function selectMode(mode: ModeKey) {
    setPersisted(mode)
    setOpen(false)
    const def = getMode(mode)
    if (basePath) router.push(`${basePath}/${def.defaultHref}`)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-[32px] px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--font-size-label)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-[background,border-color,color] duration-[var(--duration-fast)] ease-[var(--ease-out)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Mode: ${currentDef.label}`}
      >
        <Icon size={14} strokeWidth={1.75} />
        <span className="font-medium">{currentDef.label}</span>
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-[260px] rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-panel)] py-1.5 z-50"
          style={{ animation: 'slideInDown var(--duration-base) var(--ease-out)' }}
        >
          <div className="px-3 pt-1.5 pb-2 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            Mode
          </div>
          {modes.map((mode) => {
            const MIcon = iconMap[mode.key]
            const isActive = mode.key === currentMode
            return (
              <button
                key={mode.key}
                onClick={() => selectMode(mode.key)}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  isActive
                    ? 'bg-[var(--accent-subtle)]'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] shrink-0 ${
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                  }`}
                >
                  <MIcon size={14} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">
                      {mode.label}
                    </span>
                    {isActive && <Check size={12} className="text-[var(--accent-text)]" />}
                  </div>
                  <div className="text-[var(--font-size-caption)] text-[var(--text-tertiary)] leading-[var(--line-height-caption)] mt-0.5">
                    {mode.tagline}
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
