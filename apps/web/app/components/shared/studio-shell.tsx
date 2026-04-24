'use client'

/**
 * Canonical studio layout primitives.
 *
 * The product layout renders <main className="flex-1 min-h-0 overflow-auto">
 * — so every studio page MUST render inside a `h-full min-h-0` container and
 * manage its own scroll region. Before StudioShell, studios reinvented this
 * pattern ~30 different ways (h-screen escaping the shell, flex chains that
 * never reach min-h-0, sticky headers that overflow the status bar, etc.).
 *
 * Contract:
 *   <StudioShell>
 *     <StudioPageHeader title="…" subtitle="…" actions={<…/>} />
 *     <StudioBody>
 *       <StudioSection title="…">…</StudioSection>
 *     </StudioBody>
 *   </StudioShell>
 *
 * Rules:
 * - Never use h-screen inside the product shell; the <main> already owns it.
 * - Scroll ONLY inside StudioBody — not on the header or the shell.
 * - Locked typography: page title = `text-lg` (18px), section = `text-sm`
 *   (14px bold), caption = `text-xs`. Per R21 these are the allowed sizes
 *   for chrome; display/hero is a deliberate exception, not the norm.
 */

import type { ReactNode } from 'react'

interface StudioShellProps {
  children: ReactNode
  className?: string
}

export function StudioShell({ children, className = '' }: StudioShellProps) {
  return <div className={`flex h-full min-h-0 flex-col ${className}`}>{children}</div>
}

interface StudioPageHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  /** Sticky to top of StudioBody scroll parent. Default false — most studios
   *  put the header outside the scroll region, which StudioShell already
   *  does by virtue of StudioBody being the only scrolling child. */
  sticky?: boolean
  /** Dense header for split-pane studios (Design, Canvas, Code). */
  dense?: boolean
  className?: string
}

export function StudioPageHeader({
  title,
  subtitle,
  icon,
  actions,
  sticky = false,
  dense = false,
  className = '',
}: StudioPageHeaderProps) {
  const pad = dense ? 'px-5 py-3' : 'px-6 py-4'
  const stickyClass = sticky ? 'sticky top-0 z-20 bg-[var(--bg-base)]/95 backdrop-blur' : ''
  return (
    <header
      className={`flex flex-shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] ${pad} ${stickyClass} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-tight text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

interface StudioBodyProps {
  children: ReactNode
  /** Adds the standard editorial 24px horizontal / 20px vertical padding.
   *  Disable for split-pane studios that manage their own grid/padding. */
  padded?: boolean
  /** When the body itself should not scroll (because a child does). Rare. */
  noScroll?: boolean
  className?: string
}

export function StudioBody({ children, padded = true, noScroll = false, className = '' }: StudioBodyProps) {
  const padClass = padded ? 'px-6 py-5' : ''
  const scrollClass = noScroll ? 'overflow-hidden' : 'overflow-auto'
  return <div className={`flex min-h-0 flex-1 flex-col ${scrollClass} ${padClass} ${className}`}>{children}</div>
}

interface StudioSectionProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function StudioSection({ title, subtitle, actions, children, className = '' }: StudioSectionProps) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

interface StudioToolbarProps {
  children: ReactNode
  /** Align toolbar under the header, sticky so it stays visible when content
   *  scrolls. Use for studios with filters/tabs (Skills, Templates, Work). */
  sticky?: boolean
  className?: string
}

export function StudioToolbar({ children, sticky = false, className = '' }: StudioToolbarProps) {
  const stickyClass = sticky ? 'sticky top-0 z-10 bg-[var(--bg-base)]/90 backdrop-blur' : ''
  return (
    <div
      className={`flex flex-shrink-0 flex-wrap items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-2.5 ${stickyClass} ${className}`}
    >
      {children}
    </div>
  )
}
