'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, AlertTriangle, CheckCircle2, Info, Image, Globe, Eye, ChevronDown, ChevronUp } from 'lucide-react'

interface SeoData {
  title: string
  description: string
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
  noIndex?: boolean
  keywords?: string[]
}

interface SeoIssue {
  field: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

interface SeoPanelProps {
  seo: SeoData
  slug: string
  onUpdate: (seo: Partial<SeoData>) => void
}

function Field({ label, value, onChange, placeholder, multiline, charLimit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; charLimit?: number
}) {
  const overLimit = charLimit && value.length > charLimit
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</label>
        {charLimit && (
          <span className={`text-[10px] ${overLimit ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
            {value.length}/{charLimit}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40 resize-none" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40" />
      )}
    </div>
  )
}

export function SeoPanel({ seo, slug, onUpdate }: SeoPanelProps) {
  const [ogExpanded, setOgExpanded] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  const issues = useMemo<SeoIssue[]>(() => {
    const list: SeoIssue[] = []
    if (!seo.title) list.push({ field: 'title', severity: 'error', message: 'Missing page title' })
    else if (seo.title.length > 60) list.push({ field: 'title', severity: 'warning', message: `Title is ${seo.title.length} chars (max 60)` })
    else if (seo.title.length < 10) list.push({ field: 'title', severity: 'warning', message: 'Title is very short' })

    if (!seo.description) list.push({ field: 'description', severity: 'error', message: 'Missing meta description' })
    else if (seo.description.length > 160) list.push({ field: 'description', severity: 'warning', message: `Description is ${seo.description.length} chars (max 160)` })
    else if (seo.description.length < 50) list.push({ field: 'description', severity: 'warning', message: 'Description is short' })

    if (!seo.ogImage) list.push({ field: 'ogImage', severity: 'info', message: 'No OG image' })
    if (!slug) list.push({ field: 'slug', severity: 'error', message: 'Missing URL slug' })
    if (seo.noIndex) list.push({ field: 'noIndex', severity: 'info', message: 'Page set to noindex' })
    return list
  }, [seo, slug])

  const score = Math.max(0, 100 - issues.filter(i => i.severity === 'error').length * 25 - issues.filter(i => i.severity === 'warning').length * 10 - issues.filter(i => i.severity === 'info').length * 2)

  const scoreColor = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="space-y-3">
      {/* Score badge */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="3"
              strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: scoreColor }}>
            {score}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-[var(--text-primary)]">SEO Score</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">{issues.length === 0 ? 'All checks passed' : `${issues.length} issue${issues.length > 1 ? 's' : ''} found`}</div>
        </div>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px]">
              {issue.severity === 'error' ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /> :
               issue.severity === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" /> :
               <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />}
              <span className="text-[var(--text-secondary)]">{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Core SEO */}
      <Field label="Page Title" value={seo.title} onChange={v => onUpdate({ title: v })} placeholder="Page title for search..." charLimit={60} />
      <Field label="Meta Description" value={seo.description} onChange={v => onUpdate({ description: v })} placeholder="Description for search..." multiline charLimit={160} />
      <Field label="Keywords (comma-separated)" value={(seo.keywords ?? []).join(', ')} onChange={v => onUpdate({ keywords: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="keyword1, keyword2..." />

      {/* Search Preview */}
      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 flex items-center gap-1">
          <Eye className="w-3 h-3" /> Search Preview
        </div>
        <div className="space-y-0.5">
          <div className="text-[13px] text-[#8AB4F8] truncate">{seo.title || 'Untitled Page'}</div>
          <div className="text-[11px] text-[#BDC1C6] truncate">{`example.com${slug}`}</div>
          <div className="text-[11px] text-[#9AA0A6] line-clamp-2">{seo.description || 'No description set'}</div>
        </div>
      </div>

      {/* Open Graph */}
      <button onClick={() => setOgExpanded(!ogExpanded)} className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Open Graph</span>
        {ogExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {ogExpanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 overflow-hidden">
          <Field label="OG Title" value={seo.ogTitle ?? ''} onChange={v => onUpdate({ ogTitle: v })} placeholder="Defaults to page title" />
          <Field label="OG Description" value={seo.ogDescription ?? ''} onChange={v => onUpdate({ ogDescription: v })} placeholder="Defaults to meta description" />
          <Field label="OG Image URL" value={seo.ogImage ?? ''} onChange={v => onUpdate({ ogImage: v })} placeholder="https://..." />

          {/* Social preview */}
          <div className="rounded-lg overflow-hidden border border-white/[0.06]">
            <div className="h-[100px] bg-white/[0.03] flex items-center justify-center">
              {seo.ogImage ? (
                <span className="text-[10px] text-[var(--text-tertiary)] truncate px-2">{seo.ogImage}</span>
              ) : (
                <Image className="w-6 h-6 text-[var(--text-tertiary)]/40" />
              )}
            </div>
            <div className="p-2 bg-white/[0.02]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase">example.com</div>
              <div className="text-[11px] text-[var(--text-primary)] truncate">{seo.ogTitle || seo.title || 'Page Title'}</div>
              <div className="text-[10px] text-[var(--text-secondary)] line-clamp-1">{seo.ogDescription || seo.description || ''}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced */}
      <button onClick={() => setAdvancedExpanded(!advancedExpanded)} className="flex items-center justify-between w-full text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
        <span>Advanced</span>
        {advancedExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {advancedExpanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-3 overflow-hidden">
          <Field label="Canonical URL" value={seo.canonical ?? ''} onChange={v => onUpdate({ canonical: v })} placeholder="https://..." />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">No Index</span>
            <button onClick={() => onUpdate({ noIndex: !seo.noIndex })}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${seo.noIndex ? 'bg-red-500' : 'bg-white/[0.1]'}`}>
              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${seo.noIndex ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
