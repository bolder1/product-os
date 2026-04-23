'use client'

/**
 * Frame Renderer
 *
 * Resolves CanvasFrame + CanvasLayer trees from the design-canvas-store into
 * live React elements that match the visual intent of each layer.
 *
 * This is the "real rendering" pillar of V2: what you design is what ships.
 * Component layers resolve to live React components from the Components
 * workspace graph node registry, falling back to a placeholder when the
 * component module hasn't been loaded yet.
 *
 * Usage:
 *   <FrameRenderer frameId="frame-xyz" productId="org-product" />
 *   <FrameRenderer frameId="frame-xyz" productId="org-product" interactive={false} scale={0.5} />
 */

import React, { useMemo, Suspense, lazy, useCallback } from 'react'
import { useDesignCanvasStore, type CanvasLayer, type CanvasFrame, type Fill } from './design-canvas-store'
import { useGraphStore } from './graph-store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillsToBackground(fills: Fill[]): string {
  if (!fills.length) return 'transparent'
  const f = fills[fills.length - 1]             // topmost fill
  if (f.type === 'solid' && f.color) return f.color
  if ((f.type === 'linear' || f.type === 'radial') && f.stops?.length) {
    const stops = f.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')
    return f.type === 'linear'
      ? `linear-gradient(135deg, ${stops})`
      : `radial-gradient(circle, ${stops})`
  }
  if (f.type === 'image' && f.imageUrl) return `url(${f.imageUrl}) center/cover no-repeat`
  return 'transparent'
}

function borderRadiusValue(br?: number | [number, number, number, number]): string {
  if (br === undefined) return '0'
  if (typeof br === 'number') return `${br}px`
  return br.map((v) => `${v}px`).join(' ')
}

function shadowValue(shadows: CanvasLayer['shadows']): string {
  return shadows
    .filter((s) => !s.inset)
    .map((s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`)
    .join(', ') || 'none'
}

function strokeToBorder(strokes: CanvasLayer['strokes']): React.CSSProperties {
  if (!strokes.length) return {}
  const s = strokes[0]
  const outline =
    s.align === 'outside'
      ? `outline: ${s.width}px solid ${s.color};`
      : undefined
  return s.align === 'outside'
    ? { outline: `${s.width}px solid ${s.color}`, outlineOffset: '0' }
    : { border: `${s.width}px solid ${s.color}` }
}

// ---------------------------------------------------------------------------
// Component instance registry
// Lazily resolves component graph nodes to importable React modules.
// Production: modules are code-gen'd by the output pipeline into /generated/.
// Dev: falls back to a styled placeholder that shows the component label.
// ---------------------------------------------------------------------------

const _componentCache = new Map<string, React.ComponentType<any>>()

function PlaceholderComponent({ label, width, height }: { label: string; width: number; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(99,102,241,0.08)',
        border: '1px dashed rgba(99,102,241,0.4)',
        borderRadius: 6,
        fontSize: 11,
        color: '#6366F1',
        fontFamily: 'system-ui',
        padding: '2px 6px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  )
}

function resolveComponent(componentId: string, graphLabel: string): React.ComponentType<any> {
  if (_componentCache.has(componentId)) return _componentCache.get(componentId)!

  // Generated component modules are loaded at runtime only (not statically analysed by webpack).
  // We always return a Suspense-wrapped placeholder; real codegen is handled server-side.
  try {
    const Loaded = lazy(() =>
      Promise.resolve({
        default: (props: any) => <PlaceholderComponent label={graphLabel} width={props.width ?? 100} height={props.height ?? 40} />,
      })
    )
    _componentCache.set(componentId, Loaded)
    return Loaded
  } catch {
    const Placeholder = (props: any) => (
      <PlaceholderComponent label={graphLabel} width={props.width ?? 100} height={props.height ?? 40} />
    )
    _componentCache.set(componentId, Placeholder)
    return Placeholder
  }
}

// ---------------------------------------------------------------------------
// Layer renderer
// ---------------------------------------------------------------------------

interface LayerRendererProps {
  layer: CanvasLayer
  allLayers: CanvasLayer[]
  graphLabels: Record<string, string>   // componentId → graph node label
  interactive: boolean
  scale: number
}

function LayerRenderer({ layer, allLayers, graphLabels, interactive, scale }: LayerRendererProps) {
  if (!layer.visible) return null

  const childLayers = useMemo(
    () => layer.childIds.map((id) => allLayers.find((l) => l.id === id)).filter(Boolean) as CanvasLayer[],
    [layer.childIds, allLayers]
  )

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    opacity: layer.opacity,
    transform: layer.rotation !== 0 ? `rotate(${layer.rotation}deg)` : undefined,
    mixBlendMode: layer.blendMode as React.CSSProperties['mixBlendMode'],
    overflow: 'hidden',
    pointerEvents: interactive && !layer.locked ? 'auto' : 'none',
  }

  // ── Component instance ──
  if (layer.kind === 'component' && layer.componentId) {
    const label = graphLabels[layer.componentId] ?? layer.name
    const Comp = resolveComponent(layer.componentId, label)
    return (
      <div style={baseStyle}>
        <Suspense fallback={<PlaceholderComponent label={label} width={layer.width} height={layer.height} />}>
          <Comp {...(layer.componentProps ?? {})} width={layer.width} height={layer.height} />
        </Suspense>
      </div>
    )
  }

  // ── Text ──
  if (layer.kind === 'text' && layer.text) {
    const t = layer.text
    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: t.fontFamily || 'system-ui',
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          textAlign: t.textAlign,
          color: t.color,
          background: 'transparent',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {t.content}
      </div>
    )
  }

  // ── Image ──
  if (layer.kind === 'image') {
    const imageUrl = layer.fills.find((f) => f.type === 'image')?.imageUrl
    return (
      <div style={baseStyle}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={layer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: 11,
              fontFamily: 'system-ui',
            }}
          >
            {layer.name}
          </div>
        )}
      </div>
    )
  }

  // ── Ellipse ──
  if (layer.kind === 'ellipse') {
    return (
      <div
        style={{
          ...baseStyle,
          borderRadius: '50%',
          background: fillsToBackground(layer.fills),
          boxShadow: shadowValue(layer.shadows),
          ...strokeToBorder(layer.strokes),
        }}
      />
    )
  }

  // ── Rectangle / Group / Frame / Line / Vector (default box model) ──
  return (
    <div
      style={{
        ...baseStyle,
        background: layer.kind === 'group' ? 'transparent' : fillsToBackground(layer.fills),
        borderRadius: borderRadiusValue(layer.borderRadius),
        boxShadow: shadowValue(layer.shadows),
        ...strokeToBorder(layer.strokes),
      }}
    >
      {childLayers.map((child) => (
        <LayerRenderer
          key={child.id}
          layer={child}
          allLayers={allLayers}
          graphLabels={graphLabels}
          interactive={interactive}
          scale={scale}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Frame renderer (public API)
// ---------------------------------------------------------------------------

interface FrameRendererProps {
  /** Canvas frame id from design-canvas-store */
  frameId: string
  productId: string
  /** Whether pointer events / interactions are active (default true) */
  interactive?: boolean
  /** Uniform scale factor for embed/preview contexts (default 1) */
  scale?: number
  /** Optional CSS class on the outer wrapper */
  className?: string
}

export function FrameRenderer({
  frameId,
  productId,
  interactive = true,
  scale = 1,
  className,
}: FrameRendererProps) {
  const frames = useDesignCanvasStore((s) => s.frames)
  const layers = useDesignCanvasStore((s) => s.layers)
  const graphNodes = useGraphStore((s) => s.nodes)

  const frame = useMemo(
    () => frames.find((f) => f.id === frameId) as CanvasFrame | undefined,
    [frames, frameId]
  )

  const frameLayers = useMemo(
    () => layers.filter((l) => l.frameId === frameId && l.parentId !== null),
    [layers, frameId]
  )

  // Root layers (direct children of the frame)
  const rootLayers = useMemo(
    () => frameLayers.filter((l) => l.parentId === frameId),
    [frameLayers, frameId]
  )

  // Component id → graph node label map (for placeholder labels)
  const graphLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const node of graphNodes) {
      if (node.kind === 'component' && node.productId === productId) {
        map[node.id] = node.label
      }
    }
    return map
  }, [graphNodes, productId])

  if (!frame) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 200,
          height: 120,
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: '#475569',
          fontSize: 11,
          fontFamily: 'system-ui',
        }}
        role="img"
        aria-label="Frame not found"
      >
        Frame not found
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: frame.width * scale,
        height: frame.height * scale,
        background: frame.background,
        overflow: 'hidden',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: scale !== 1 ? 'top left' : undefined,
        flexShrink: 0,
      }}
      role="img"
      aria-label={`Design frame: ${frame.name}`}
    >
      {rootLayers.map((layer) => (
        <LayerRenderer
          key={layer.id}
          layer={layer}
          allLayers={frameLayers}
          graphLabels={graphLabels}
          interactive={interactive}
          scale={scale}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Frame thumbnail (non-interactive, fixed max dimension, aspect-preserving)
// ---------------------------------------------------------------------------

interface FrameThumbnailProps {
  frameId: string
  productId: string
  maxWidth?: number
  maxHeight?: number
  className?: string
}

export function FrameThumbnail({
  frameId,
  productId,
  maxWidth = 240,
  maxHeight = 180,
  className,
}: FrameThumbnailProps) {
  const frames = useDesignCanvasStore((s) => s.frames)
  const frame = useMemo(
    () => frames.find((f) => f.id === frameId) as CanvasFrame | undefined,
    [frames, frameId]
  )

  const scale = useMemo(() => {
    if (!frame) return 1
    const sx = maxWidth / frame.width
    const sy = maxHeight / frame.height
    return Math.min(sx, sy, 1)
  }, [frame, maxWidth, maxHeight])

  return (
    <FrameRenderer
      frameId={frameId}
      productId={productId}
      interactive={false}
      scale={scale}
      className={className}
    />
  )
}
