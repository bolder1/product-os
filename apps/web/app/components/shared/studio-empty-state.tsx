'use client'

import { Sparkles, LayoutTemplate, Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

interface StudioEmptyStateProps {
  /** Studio display name e.g. "Design Studio" */
  title: string
  /** What this studio does */
  description: string
  /** Icon to show */
  icon?: React.ReactNode
  /** Label for the create button e.g. "Create Screen" */
  createLabel?: string
  /** Callback when "Create" is clicked */
  onCreate?: () => void
  /** Whether to show the template CTA */
  showTemplate?: boolean
  /** Whether to show the AI CTA */
  showAI?: boolean
  /** Custom class */
  className?: string
}

export function StudioEmptyState({
  title,
  description,
  icon,
  createLabel,
  onCreate,
  showTemplate = true,
  showAI = true,
  className = '',
}: StudioEmptyStateProps) {
  const params = useParams()
  const router = useRouter()

  const handleGoToTemplates = () => {
    router.push(`/${params.orgSlug}/${params.productSlug}/templates`)
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-[var(--text-tertiary)]">
          {icon}
        </div>
      )}

      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12px] text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {createLabel && onCreate && (
          <button
            onClick={onCreate}
            className="tool-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            {createLabel}
          </button>
        )}

        {showTemplate && (
          <button
            onClick={handleGoToTemplates}
            className="tool-btn flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-[var(--accent-muted)] bg-[var(--accent-muted)]/10 hover:bg-[var(--accent-muted)]/20 text-[var(--accent-text)] transition-colors"
          >
            <LayoutTemplate className="w-3 h-3" />
            Start from Template
          </button>
        )}

        {showAI && (
          <button
            className="tool-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Create with AI
          </button>
        )}
      </div>
    </div>
  )
}
