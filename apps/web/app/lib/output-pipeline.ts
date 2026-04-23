'use client'

/**
 * Product OS — Output Pipeline
 *
 * The output pipeline provides registered exporters for turning graph nodes
 * and canvas frames into real, tangible artifacts:
 *
 *   • Design frame  → React/TSX + Tailwind
 *   • Design frame  → PNG / SVG / PDF (via browser APIs)
 *   • Design frame  → Figma-compatible JSON
 *   • Spec node     → Markdown / PDF
 *   • Workflow node → Deployable JSON config
 *   • Release node  → Deployment trigger
 *
 * Usage:
 *   import { outputPipeline } from '@/lib/output-pipeline'
 *
 *   // Register a custom exporter (e.g. from a plugin)
 *   outputPipeline.register('my-format', myExporter)
 *
 *   // Run an export
 *   const result = await outputPipeline.run('tsx', { frame, layers })
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat =
  | 'tsx'
  | 'png'
  | 'svg'
  | 'pdf'
  | 'figma-json'
  | 'markdown'
  | 'workflow-json'
  | 'release-manifest'

export interface ExportContext {
  /** The frame/node label */
  label: string
  /** Width in px */
  width?: number
  /** Height in px */
  height?: number
  /** Flat list of layers in this frame */
  layers?: FrameLayerExport[]
  /** Raw markdown content (for spec export) */
  markdownContent?: string
  /** Arbitrary node data (for workflow/release exports) */
  nodeData?: Record<string, unknown>
  /** Product id */
  productId?: string
}

export interface FrameLayerExport {
  id: string
  kind: string
  name: string
  x: number
  y: number
  width: number
  height: number
  fills?: Array<{ type: string; color?: string; opacity: number }>
  strokes?: Array<{ color: string; width: number }>
  borderRadius?: number
  text?: { content: string; fontSize: number; fontWeight: number; color: string }
  componentId?: string
  childIds?: string[]
  parentId?: string | null
}

export interface ExportResult {
  format: ExportFormat
  /** String content (TSX, SVG, Markdown, JSON) */
  content?: string
  /** Blob for binary formats (PNG, PDF) */
  blob?: Blob
  /** Suggested filename */
  filename: string
  /** MIME type */
  mimeType: string
}

type Exporter = (ctx: ExportContext) => Promise<ExportResult>

// ---------------------------------------------------------------------------
// Pipeline registry
// ---------------------------------------------------------------------------

class OutputPipeline {
  private exporters = new Map<ExportFormat, Exporter>()

  register(format: ExportFormat, exporter: Exporter): void {
    this.exporters.set(format, exporter)
  }

  async run(format: ExportFormat, ctx: ExportContext): Promise<ExportResult> {
    const exporter = this.exporters.get(format)
    if (!exporter) throw new Error(`No exporter registered for format: ${format}`)
    return exporter(ctx)
  }

  /** Run and immediately trigger a browser download. */
  async download(format: ExportFormat, ctx: ExportContext): Promise<void> {
    const result = await this.run(format, ctx)
    const blob = result.blob ?? new Blob([result.content ?? ''], { type: result.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  formats(): ExportFormat[] {
    return [...this.exporters.keys()]
  }
}

export const outputPipeline = new OutputPipeline()

// ---------------------------------------------------------------------------
// Built-in exporters
// ---------------------------------------------------------------------------

// ── TSX exporter ──

outputPipeline.register('tsx', async (ctx) => {
  const name = ctx.label.replace(/[^a-zA-Z0-9]/g, '') || 'Screen'
  const layers = ctx.layers ?? []

  // Recursive layer → JSX
  function renderLayer(layer: FrameLayerExport, indent = 4): string {
    const fill = layer.fills?.[0]
    const bg = fill?.type === 'solid' && fill.color ? fill.color : 'transparent'
    const radius = layer.borderRadius ?? 0
    const stroke = layer.strokes?.[0]

    const styleEntries: string[] = [
      `position: 'absolute'`,
      `left: ${layer.x}`,
      `top: ${layer.y}`,
      `width: ${layer.width}`,
      `height: ${layer.height}`,
      bg !== 'transparent' ? `background: '${bg}'` : '',
      radius ? `borderRadius: ${radius}` : '',
      stroke ? `border: '${stroke.width}px solid ${stroke.color}'` : '',
    ].filter(Boolean)

    const pad = ' '.repeat(indent)
    const children = (layer.childIds ?? [])
      .map((cid) => layers.find((l) => l.id === cid))
      .filter(Boolean)
      .map((child) => renderLayer(child!, indent + 2))
      .join('\n')

    const content = layer.text
      ? `${pad}  <span style={{ fontSize: ${layer.text.fontSize}, fontWeight: ${layer.text.fontWeight}, color: '${layer.text.color}' }}>${layer.text.content}</span>`
      : children

    return `${pad}<div style={{ ${styleEntries.join(', ')} }}>\n${content}\n${pad}</div>`
  }

  // Only root-level layers (no parentId)
  const rootLayers = layers.filter((l) => !l.parentId)
  const jsx = rootLayers.map((l) => renderLayer(l)).join('\n')

  const content = `// Generated by Product OS — Design Studio
// ${ctx.label} (${ctx.width ?? 390}×${ctx.height ?? 844})
// Edit freely — re-export from Design Studio to sync.

import React from 'react'

export default function ${name}() {
  return (
    <div
      style={{
        position: 'relative',
        width: ${ctx.width ?? 390},
        height: ${ctx.height ?? 844},
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
${jsx}
    </div>
  )
}
`

  return {
    format: 'tsx',
    content,
    filename: `${name}.tsx`,
    mimeType: 'text/plain',
  }
})

// ── SVG exporter ──

outputPipeline.register('svg', async (ctx) => {
  const layers = ctx.layers ?? []
  const w = ctx.width ?? 390
  const h = ctx.height ?? 844

  function layerToSVG(layer: FrameLayerExport): string {
    const fill = layer.fills?.[0]
    const color = fill?.type === 'solid' && fill.color ? fill.color : 'none'
    const stroke = layer.strokes?.[0]
    const strokeAttr = stroke ? ` stroke="${stroke.color}" stroke-width="${stroke.width}"` : ''
    const radius = layer.borderRadius ?? 0

    if (layer.kind === 'text' && layer.text) {
      return `  <text x="${layer.x}" y="${layer.y + layer.text.fontSize}" font-size="${layer.text.fontSize}" font-weight="${layer.text.fontWeight}" fill="${layer.text.color}">${layer.text.content}</text>`
    }
    if (layer.kind === 'ellipse') {
      const rx = layer.width / 2
      const ry = layer.height / 2
      return `  <ellipse cx="${layer.x + rx}" cy="${layer.y + ry}" rx="${rx}" ry="${ry}" fill="${color}"${strokeAttr} />`
    }
    return `  <rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${radius}" fill="${color}"${strokeAttr} />`
  }

  const shapes = layers.filter((l) => !l.parentId).map(layerToSVG).join('\n')

  const content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#ffffff"/>
${shapes}
</svg>`

  return {
    format: 'svg',
    content,
    filename: `${ctx.label.replace(/\s+/g, '-')}.svg`,
    mimeType: 'image/svg+xml',
  }
})

// ── Figma JSON exporter ──

outputPipeline.register('figma-json', async (ctx) => {
  const node = {
    id: `${Date.now()}`,
    name: ctx.label,
    type: 'FRAME',
    absoluteBoundingBox: { x: 0, y: 0, width: ctx.width ?? 390, height: ctx.height ?? 844 },
    backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
    children: (ctx.layers ?? []).filter((l) => !l.parentId).map((layer) => ({
      id: layer.id,
      name: layer.name,
      type: layer.kind === 'text' ? 'TEXT'
        : layer.kind === 'ellipse' ? 'ELLIPSE'
        : layer.kind === 'component' ? 'INSTANCE'
        : 'RECTANGLE',
      absoluteBoundingBox: { x: layer.x, y: layer.y, width: layer.width, height: layer.height },
      fills: layer.fills?.map((f) => ({
        type: f.type === 'solid' ? 'SOLID' : 'GRADIENT_LINEAR',
        color: f.color ? hexToFigmaRGB(f.color) : { r: 1, g: 1, b: 1, a: 1 },
        opacity: f.opacity,
      })) ?? [],
      cornerRadius: layer.borderRadius ?? 0,
      ...(layer.text ? { characters: layer.text.content } : {}),
    })),
  }

  return {
    format: 'figma-json',
    content: JSON.stringify({ document: node }, null, 2),
    filename: `${ctx.label.replace(/\s+/g, '-')}-figma.json`,
    mimeType: 'application/json',
  }
})

// ── Markdown exporter (specs, decisions) ──

outputPipeline.register('markdown', async (ctx) => {
  const content = ctx.markdownContent ?? `# ${ctx.label}\n\n_No content_\n`
  return {
    format: 'markdown',
    content,
    filename: `${ctx.label.replace(/\s+/g, '-').toLowerCase()}.md`,
    mimeType: 'text/markdown',
  }
})

// ── Workflow JSON exporter ──

outputPipeline.register('workflow-json', async (ctx) => {
  const content = JSON.stringify({
    name: ctx.label,
    productId: ctx.productId,
    exportedAt: new Date().toISOString(),
    ...ctx.nodeData,
  }, null, 2)

  return {
    format: 'workflow-json',
    content,
    filename: `${ctx.label.replace(/\s+/g, '-').toLowerCase()}-workflow.json`,
    mimeType: 'application/json',
  }
})

// ── Release manifest exporter ──

outputPipeline.register('release-manifest', async (ctx) => {
  const manifest = {
    product: ctx.productId,
    release: ctx.label,
    generatedAt: new Date().toISOString(),
    ...ctx.nodeData,
  }
  return {
    format: 'release-manifest',
    content: JSON.stringify(manifest, null, 2),
    filename: `release-${ctx.label.replace(/\s+/g, '-').toLowerCase()}.json`,
    mimeType: 'application/json',
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToFigmaRGB(hex: string): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  return { r, g, b, a: 1 }
}

// ---------------------------------------------------------------------------
// PNG exporter — uses an offscreen canvas (browser only)
// ---------------------------------------------------------------------------

outputPipeline.register('png', async (ctx) => {
  const w = ctx.width ?? 390
  const h = ctx.height ?? 844
  const layers = ctx.layers ?? []

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const c2d = canvas.getContext('2d')!

  c2d.fillStyle = '#ffffff'
  c2d.fillRect(0, 0, w, h)

  function paintLayer(layer: FrameLayerExport) {
    const fill = layer.fills?.[0]
    if (fill?.type === 'solid' && fill.color) {
      c2d.globalAlpha = fill.opacity
      c2d.fillStyle = fill.color
      if (layer.kind === 'ellipse') {
        c2d.beginPath()
        c2d.ellipse(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2)
        c2d.fill()
      } else {
        const r = layer.borderRadius ?? 0
        if (r > 0) {
          roundRect(c2d, layer.x, layer.y, layer.width, layer.height, r)
          c2d.fill()
        } else {
          c2d.fillRect(layer.x, layer.y, layer.width, layer.height)
        }
      }
      c2d.globalAlpha = 1
    }

    if (layer.kind === 'text' && layer.text) {
      c2d.fillStyle = layer.text.color
      c2d.font = `${layer.text.fontWeight} ${layer.text.fontSize}px Inter, sans-serif`
      c2d.fillText(layer.text.content, layer.x, layer.y + layer.text.fontSize)
    }
  }

  layers.filter((l) => !l.parentId).forEach(paintLayer)

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
  return {
    format: 'png',
    blob,
    filename: `${ctx.label.replace(/\s+/g, '-')}.png`,
    mimeType: 'image/png',
  }
})

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
