'use client'

import { useState, useMemo, useCallback } from 'react'
import { Link2, Plus, Trash2, Palette, Type, Ruler, ChevronDown, ChevronRight, Search } from 'lucide-react'
import type { TokenBinding, ComponentDef } from '../_data/mock-components'
import type { BrandTokens } from '../../../../../lib/use-brand-tokens'

// ── Bindable CSS properties ──
const BINDABLE_PROPERTIES = [
  // Colors
  { value: 'backgroundColor', label: 'Background', category: 'Color' },
  { value: 'color', label: 'Text Color', category: 'Color' },
  { value: 'borderColor', label: 'Border Color', category: 'Color' },
  { value: 'outlineColor', label: 'Outline Color', category: 'Color' },
  { value: 'accentColor', label: 'Accent Color', category: 'Color' },
  // Typography
  { value: 'fontFamily', label: 'Font Family', category: 'Typography' },
  { value: 'fontSize', label: 'Font Size', category: 'Typography' },
  { value: 'fontWeight', label: 'Font Weight', category: 'Typography' },
  { value: 'lineHeight', label: 'Line Height', category: 'Typography' },
  { value: 'letterSpacing', label: 'Letter Spacing', category: 'Typography' },
  // Spacing
  { value: 'padding', label: 'Padding', category: 'Spacing' },
  { value: 'margin', label: 'Margin', category: 'Spacing' },
  { value: 'gap', label: 'Gap', category: 'Spacing' },
  { value: 'borderRadius', label: 'Border Radius', category: 'Spacing' },
  // Effects
  { value: 'boxShadow', label: 'Box Shadow', category: 'Effects' },
] as const

const categoryIcon: Record<string, React.ReactNode> = {
  Color: <Palette className="w-3 h-3" />,
  Typography: <Type className="w-3 h-3" />,
  Spacing: <Ruler className="w-3 h-3" />,
  Effects: <Link2 className="w-3 h-3" />,
}

interface TokenBindingPanelProps {
  component: ComponentDef
  brandTokens: BrandTokens
  onBindingsChange: (bindings: TokenBinding[]) => void
}

export function TokenBindingPanel({ component, brandTokens, onBindingsChange }: TokenBindingPanelProps) {
  const bindings = component.tokenBindings ?? []
  const [addingNew, setAddingNew] = useState(false)
  const [newProperty, setNewProperty] = useState('')
  const [newTokenPath, setNewTokenPath] = useState('')
  const [search, setSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Color')

  // Build flat token map for browsing
  const tokenMap = useMemo(() => brandTokens.toFlatMap(), [brandTokens])

  // Group tokens by category for the picker
  const groupedTokens = useMemo(() => {
    const groups: Record<string, { path: string; value: string }[]> = {
      'Colors': [],
      'Typography': [],
      'Spacing': [],
      'Effects': [],
    }
    const q = search.toLowerCase()
    for (const [path, value] of Object.entries(tokenMap)) {
      if (q && !path.toLowerCase().includes(q) && !value.toLowerCase().includes(q)) continue
      if (path.startsWith('color.')) groups['Colors'].push({ path, value })
      else if (path.startsWith('font.')) groups['Typography'].push({ path, value })
      else if (path.startsWith('spacing.') || path.startsWith('radius.')) groups['Spacing'].push({ path, value })
      else if (path.startsWith('shadow.')) groups['Effects'].push({ path, value })
    }
    return groups
  }, [tokenMap, search])

  const handleAdd = useCallback(() => {
    if (!newProperty || !newTokenPath) return
    const binding: TokenBinding = {
      id: `tb-${Date.now()}`,
      property: newProperty,
      tokenPath: newTokenPath,
      resolvedValue: tokenMap[newTokenPath] ?? '',
    }
    onBindingsChange([...bindings, binding])
    setNewProperty('')
    setNewTokenPath('')
    setAddingNew(false)
  }, [newProperty, newTokenPath, bindings, tokenMap, onBindingsChange])

  const handleRemove = useCallback((bindingId: string) => {
    onBindingsChange(bindings.filter((b) => b.id !== bindingId))
  }, [bindings, onBindingsChange])

  const isColorValue = (value: string) => value.startsWith('#') || value.startsWith('rgb')

  if (!brandTokens.hasTokens) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <Link2 className="w-5 h-5 text-[var(--text-tertiary)] mb-2" />
        <p className="text-[12px] text-[var(--text-secondary)] mb-1">No Brand Tokens</p>
        <p className="text-[10px] text-[var(--text-tertiary)] max-w-[200px]">
          Configure brand tokens in the Brand Builder to bind them to component properties.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[12px] font-medium text-[var(--text-primary)]">Token Bindings</span>
          <span className="text-[10px] px-1 py-px bg-[var(--bg-inset)] text-[var(--text-tertiary)] rounded">
            {bindings.length}
          </span>
        </div>
        <button
          onClick={() => setAddingNew(!addingNew)}
          className="tool-btn flex items-center gap-1 px-2 h-5 text-[10px] text-[var(--accent-text)] hover:bg-[var(--accent)]/10 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          Bind
        </button>
      </div>

      {/* Existing bindings */}
      {bindings.length > 0 && (
        <div className="space-y-1">
          {bindings.map((binding) => (
            <div
              key={binding.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] group"
            >
              {/* Color swatch if applicable */}
              {isColorValue(binding.resolvedValue ?? '') && (
                <div
                  className="w-3 h-3 rounded-sm border border-white/10 shrink-0"
                  style={{ backgroundColor: binding.resolvedValue }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[var(--text-primary)] truncate">
                  {BINDABLE_PROPERTIES.find((p) => p.value === binding.property)?.label ?? binding.property}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                  {binding.tokenPath}
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] font-mono shrink-0 max-w-[60px] truncate">
                {binding.resolvedValue}
              </div>
              <button
                onClick={() => handleRemove(binding.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new binding */}
      {addingNew && (
        <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-2 space-y-2">
          {/* Property selector */}
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">
              CSS Property
            </label>
            <select
              value={newProperty}
              onChange={(e) => setNewProperty(e.target.value)}
              className="w-full h-6 px-2 rounded text-[11px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] outline-none"
            >
              <option value="">Select property…</option>
              {Object.entries(
                BINDABLE_PROPERTIES.reduce<Record<string, typeof BINDABLE_PROPERTIES[number][]>>((acc, p) => {
                  (acc[p.category] ??= []).push(p)
                  return acc
                }, {})
              ).map(([cat, props]) => (
                <optgroup key={cat} label={cat}>
                  {props.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Token browser */}
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">
              Brand Token
            </label>
            <div className="flex items-center gap-1 h-5 px-1.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] mb-1.5">
              <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tokens…"
                className="flex-1 bg-transparent text-[10px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto rounded border border-[var(--border-default)] bg-[var(--bg-surface)]">
              {Object.entries(groupedTokens).map(([cat, tokens]) => {
                if (tokens.length === 0) return null
                const isExpanded = expandedCategory === cat
                return (
                  <div key={cat}>
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider hover:bg-[var(--bg-elevated)]"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {categoryIcon[cat.replace('s', '')] ?? <Link2 className="w-3 h-3" />}
                      {cat}
                      <span className="ml-auto text-[9px]">{tokens.length}</span>
                    </button>
                    {isExpanded && tokens.map((t) => (
                      <button
                        key={t.path}
                        onClick={() => setNewTokenPath(t.path)}
                        className={`w-full flex items-center gap-2 px-3 py-1 text-left hover:bg-[var(--bg-elevated)] transition-colors ${
                          newTokenPath === t.path ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        {isColorValue(t.value) && (
                          <div
                            className="w-2.5 h-2.5 rounded-sm border border-white/10 shrink-0"
                            style={{ backgroundColor: t.value }}
                          />
                        )}
                        <span className="text-[10px] text-[var(--text-primary)] font-mono truncate flex-1">{t.path}</span>
                        <span className="text-[9px] text-[var(--text-tertiary)] font-mono shrink-0">{t.value}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected token preview */}
          {newTokenPath && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--accent)]/20">
              {isColorValue(tokenMap[newTokenPath] ?? '') && (
                <div
                  className="w-4 h-4 rounded border border-white/10"
                  style={{ backgroundColor: tokenMap[newTokenPath] }}
                />
              )}
              <span className="text-[11px] text-[var(--text-primary)] font-mono">{newTokenPath}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">{tokenMap[newTokenPath]}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => { setAddingNew(false); setNewProperty(''); setNewTokenPath('') }}
              className="px-2 h-5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newProperty || !newTokenPath}
              className="px-2 h-5 text-[10px] font-medium rounded bg-[var(--accent)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Bind Token
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {bindings.length === 0 && !addingNew && (
        <div className="text-center py-4">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            No token bindings yet. Click <strong>Bind</strong> to connect a CSS property to a brand token.
          </p>
        </div>
      )}
    </div>
  )
}
