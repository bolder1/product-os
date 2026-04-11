'use client'

import { useMemo } from 'react'
import { useGraphStore, type GraphNode } from './graph-store'
import type {
  BrandConfig,
  ColorGroup,
  TypographyConfig,
  SpacingConfig,
  EffectsConfig,
} from '../../app/(dashboard)/[orgSlug]/[productSlug]/brand/_data/default-brand'

// ---------------------------------------------------------------------------
// Resolved token types — flat, easy-to-consume tokens for any studio
// ---------------------------------------------------------------------------

export interface ResolvedColorToken {
  /** e.g. "primary", "secondary", "accent" */
  semantic: string
  /** Base hex value */
  base: string
  /** 11-shade scale: 50, 100, ..., 950 */
  scale: Record<string, string>
}

export interface ResolvedTypographyToken {
  headingFont: string
  bodyFont: string
  codeFont: string
  baseSize: number
  /** Map from step label (e.g. "h1") to { size, weight, lineHeight, letterSpacing } */
  steps: Record<string, { size: number; weight: number; lineHeight: number; letterSpacing: number }>
}

export interface ResolvedSpacingToken {
  baseUnit: number
  /** Map from key (e.g. "1", "2", "4") to px value */
  scale: Record<string, number>
  /** Map from label (e.g. "sm", "md") to px value */
  radii: Record<string, number>
}

export interface ResolvedEffectsToken {
  shadows: Record<string, string> // label → CSS box-shadow string
  glow: { enabled: boolean; color: string; intensity: number } | null
  backdropBlur: number
}

export interface BrandTokens {
  colors: ResolvedColorToken[]
  typography: ResolvedTypographyToken
  spacing: ResolvedSpacingToken
  effects: ResolvedEffectsToken
  /** Raw BrandConfig for studios that need the full object */
  raw: BrandConfig | null
  /** Whether brand tokens have been configured (vs defaults) */
  hasTokens: boolean
  /** Generate CSS custom properties string */
  toCSSVariables: () => string
  /** Get a flat map of token-name → value for binding */
  toFlatMap: () => Record<string, string>
}

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

function parseColorGroups(payload: string): ColorGroup[] {
  try { return JSON.parse(payload) } catch { return [] }
}

function parseTypography(payload: string): TypographyConfig | null {
  try { return JSON.parse(payload) } catch { return null }
}

function parseSpacing(payload: string): SpacingConfig | null {
  try { return JSON.parse(payload) } catch { return null }
}

function parseEffects(payload: string): EffectsConfig | null {
  try { return JSON.parse(payload) } catch { return null }
}

function findTokenNode(nodes: GraphNode[], tokenType: string): GraphNode | undefined {
  return nodes.find((n) => (n.data as Record<string, unknown>).tokenType === tokenType)
}

// ---------------------------------------------------------------------------
// CSS Variable Generation
// ---------------------------------------------------------------------------

function generateCSSVariables(colors: ResolvedColorToken[], typography: ResolvedTypographyToken, spacing: ResolvedSpacingToken, effects: ResolvedEffectsToken): string {
  const lines: string[] = [':root {']

  // Color tokens
  for (const color of colors) {
    lines.push(`  /* ${color.semantic} */`)
    lines.push(`  --color-${color.semantic}: ${color.base};`)
    for (const [shade, hex] of Object.entries(color.scale)) {
      lines.push(`  --color-${color.semantic}-${shade}: ${hex};`)
    }
  }

  // Typography tokens
  lines.push('')
  lines.push('  /* Typography */')
  lines.push(`  --font-heading: ${typography.headingFont};`)
  lines.push(`  --font-body: ${typography.bodyFont};`)
  lines.push(`  --font-code: ${typography.codeFont};`)
  lines.push(`  --font-size-base: ${typography.baseSize}px;`)
  for (const [step, val] of Object.entries(typography.steps)) {
    lines.push(`  --font-size-${step}: ${val.size}px;`)
    lines.push(`  --font-weight-${step}: ${val.weight};`)
    lines.push(`  --line-height-${step}: ${val.lineHeight};`)
  }

  // Spacing tokens
  lines.push('')
  lines.push('  /* Spacing */')
  lines.push(`  --spacing-unit: ${spacing.baseUnit}px;`)
  for (const [key, val] of Object.entries(spacing.scale)) {
    lines.push(`  --spacing-${key}: ${val}px;`)
  }
  for (const [label, val] of Object.entries(spacing.radii)) {
    lines.push(`  --radius-${label}: ${val}px;`)
  }

  // Shadow tokens
  lines.push('')
  lines.push('  /* Effects */')
  for (const [label, val] of Object.entries(effects.shadows)) {
    lines.push(`  --shadow-${label}: ${val};`)
  }
  lines.push(`  --backdrop-blur: ${effects.backdropBlur}px;`)

  lines.push('}')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Flat map generation
// ---------------------------------------------------------------------------

function generateFlatMap(colors: ResolvedColorToken[], typography: ResolvedTypographyToken, spacing: ResolvedSpacingToken, effects: ResolvedEffectsToken): Record<string, string> {
  const map: Record<string, string> = {}

  for (const color of colors) {
    map[`color.${color.semantic}`] = color.base
    for (const [shade, hex] of Object.entries(color.scale)) {
      map[`color.${color.semantic}.${shade}`] = hex
    }
  }

  map['font.heading'] = typography.headingFont
  map['font.body'] = typography.bodyFont
  map['font.code'] = typography.codeFont
  map['font.size.base'] = `${typography.baseSize}px`
  for (const [step, val] of Object.entries(typography.steps)) {
    map[`font.size.${step}`] = `${val.size}px`
    map[`font.weight.${step}`] = `${val.weight}`
  }

  map['spacing.unit'] = `${spacing.baseUnit}px`
  for (const [key, val] of Object.entries(spacing.scale)) {
    map[`spacing.${key}`] = `${val}px`
  }
  for (const [label, val] of Object.entries(spacing.radii)) {
    map[`radius.${label}`] = `${val}px`
  }

  for (const [label, val] of Object.entries(effects.shadows)) {
    map[`shadow.${label}`] = val
  }

  return map
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Cross-studio hook to consume brand tokens from the product graph.
 * Returns resolved, flat tokens ready for binding, CSS generation, and preview.
 *
 * Usage:
 *   const { colors, typography, spacing, toCSSVariables, toFlatMap } = useBrandTokens(productId)
 */
export function useBrandTokens(productId: string): BrandTokens {
  const allNodes = useGraphStore((s) => s.nodes)

  return useMemo(() => {
    const tokenNodes = allNodes.filter(
      (n) => n.productId === productId && n.kind === 'token'
    )

    const colorsNode = findTokenNode(tokenNodes, 'brand-colors')
    const typographyNode = findTokenNode(tokenNodes, 'brand-typography')
    const spacingNode = findTokenNode(tokenNodes, 'brand-spacing')
    const effectsNode = findTokenNode(tokenNodes, 'brand-effects')

    const hasTokens = !!colorsNode

    // Parse raw config
    const colorGroups = colorsNode ? parseColorGroups(String(colorsNode.data.payload)) : []
    const typographyConfig = typographyNode ? parseTypography(String(typographyNode.data.payload)) : null
    const spacingConfig = spacingNode ? parseSpacing(String(spacingNode.data.payload)) : null
    const effectsConfig = effectsNode ? parseEffects(String(effectsNode.data.payload)) : null

    // Resolve colors
    const colors: ResolvedColorToken[] = colorGroups.map((g) => ({
      semantic: g.id,
      base: g.token.base,
      scale: g.token.scale,
    }))

    // Resolve typography
    const typography: ResolvedTypographyToken = {
      headingFont: typographyConfig?.headingFont ?? 'Inter',
      bodyFont: typographyConfig?.bodyFont ?? 'Inter',
      codeFont: typographyConfig?.codeFont ?? 'JetBrains Mono',
      baseSize: typographyConfig?.baseSize ?? 16,
      steps: Object.fromEntries(
        (typographyConfig?.scale ?? []).map((s) => [
          s.id,
          { size: s.size, weight: s.weight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing },
        ])
      ),
    }

    // Resolve spacing
    const spacing: ResolvedSpacingToken = {
      baseUnit: spacingConfig?.baseUnit ?? 4,
      scale: Object.fromEntries(
        (spacingConfig?.scale ?? []).map((s) => [s.key, s.value])
      ),
      radii: Object.fromEntries(
        (spacingConfig?.radii ?? []).map((r) => [r.id, r.value])
      ),
    }

    // Resolve effects
    const effects: ResolvedEffectsToken = {
      shadows: Object.fromEntries(
        (effectsConfig?.shadows ?? []).map((s) => [
          s.id,
          `${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`,
        ])
      ),
      glow: effectsConfig?.glowEnabled
        ? { enabled: true, color: effectsConfig.glowColor, intensity: effectsConfig.glowIntensity }
        : null,
      backdropBlur: effectsConfig?.backdropBlur ?? 0,
    }

    // Reconstruct raw config
    const raw: BrandConfig | null = hasTokens
      ? {
          colorGroups,
          typography: typographyConfig ?? { headingFont: 'Inter', bodyFont: 'Inter', codeFont: 'JetBrains Mono', baseSize: 16, scale: [] },
          spacing: spacingConfig ?? { baseUnit: 4, scale: [], radii: [] },
          effects: effectsConfig ?? { shadows: [], glowEnabled: false, glowColor: '#3B82F6', glowIntensity: 20, backdropBlur: 0, gradients: [] },
        }
      : null

    return {
      colors,
      typography,
      spacing,
      effects,
      raw,
      hasTokens,
      toCSSVariables: () => generateCSSVariables(colors, typography, spacing, effects),
      toFlatMap: () => generateFlatMap(colors, typography, spacing, effects),
    }
  }, [allNodes, productId])
}
