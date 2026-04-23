'use client'

/**
 * ExportMenu — unified export dropdown usable in any workspace.
 *
 * Usage:
 *   <ExportMenu
 *     formats={['tsx', 'png', 'svg']}
 *     onExport={(format) => outputPipeline.download(format, ctx)}
 *   />
 */

import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown, FileCode2, Image, FileText, Box, FileJson } from 'lucide-react'
import type { ExportFormat } from '../../lib/output-pipeline'

const FORMAT_META: Record<ExportFormat, { label: string; icon: React.ReactNode; desc: string }> = {
  tsx:              { label: 'React / TSX',       icon: <FileCode2 size={13} />, desc: 'React component + inline styles' },
  png:              { label: 'PNG Image',          icon: <Image size={13} />,     desc: 'Rasterised at 1× resolution' },
  svg:              { label: 'SVG Vector',         icon: <Image size={13} />,     desc: 'Scalable vector graphic' },
  pdf:              { label: 'PDF Document',       icon: <FileText size={13} />,  desc: 'Print-ready PDF' },
  'figma-json':     { label: 'Figma JSON',         icon: <Box size={13} />,       desc: 'Import into Figma' },
  markdown:         { label: 'Markdown',           icon: <FileText size={13} />,  desc: 'Spec / documentation export' },
  'workflow-json':  { label: 'Workflow Config',    icon: <FileJson size={13} />,  desc: 'Deployable workflow JSON' },
  'release-manifest': { label: 'Release Manifest',icon: <FileJson size={13} />,  desc: 'Release deployment manifest' },
}

interface ExportMenuProps {
  formats: ExportFormat[]
  onExport: (format: ExportFormat) => void | Promise<void>
  disabled?: boolean
  /** Compact mode shows only icon button */
  compact?: boolean
}

export function ExportMenu({ formats, onExport, disabled, compact }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function handleExport(format: ExportFormat) {
    setLoading(format)
    setOpen(false)
    try {
      await onExport(format)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 h-[26px] px-2 rounded-md text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export"
      >
        <Download size={12} />
        {!compact && <span>Export</span>}
        {!compact && <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[220px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-[var(--shadow-panel)] z-50 py-1 overflow-hidden"
          style={{ animation: 'fadeIn 120ms ease' }}
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-[var(--border-default)]">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Export as</span>
          </div>

          {formats.map((fmt) => {
            const meta = FORMAT_META[fmt]
            if (!meta) return null
            const isLoading = loading === fmt
            return (
              <button
                key={fmt}
                role="menuitem"
                onClick={() => handleExport(fmt)}
                disabled={isLoading}
                className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-60"
              >
                <span className="mt-0.5 text-[var(--text-secondary)]">{meta.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] text-[var(--text-primary)] font-medium leading-tight">
                    {meta.label}
                    {isLoading && <span className="ml-1 text-[10px] text-[var(--text-tertiary)] animate-pulse">Exporting…</span>}
                  </span>
                  <span className="block text-[10px] text-[var(--text-tertiary)] mt-0.5">{meta.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
