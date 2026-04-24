'use client'

/**
 * BlueprintIllustration — animated SVG scenes that replace emoji previews
 * in the Blueprint Marketplace. Each web-app category gets a distinct motif
 * composed from a small library of primitives:
 *
 *   • Window chrome (Notion-style app preview)
 *   • Stacked/layered cards (Cred-style depth)
 *   • Floating gradient orbs
 *   • Flow lines connecting nodes
 *   • Data bars / sparkline
 *   • Category glyphs (shield, cart, book, avatar, etc.)
 *
 * Scenes are driven off the category's gradient (two hex colors) so every
 * illustration stays visually cohesive with the rest of the marketplace card.
 *
 * Animations use Framer Motion's `animate` prop with gentle easing + long
 * durations so the UI feels alive but never distracting.
 */

import { memo, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { AppCategory } from './template-marketplace'

export interface BlueprintIllustrationProps {
  category: AppCategory
  gradient: [string, string]
  /** Tuning knob — compact cards vs large hero */
  size?: 'sm' | 'md' | 'lg'
  /** Pause all motion (useful for dense grids on low-end devices) */
  reduceMotion?: boolean
  className?: string
  style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Ambient gradient wash — renders behind every scene. */
function Ambient({ g }: { g: [string, string] }) {
  return (
    <>
      <defs>
        <radialGradient id={`amb-a-${g[0].slice(1)}`} cx="20%" cy="20%" r="60%">
          <stop offset="0%" stopColor={g[0]} stopOpacity="0.55" />
          <stop offset="100%" stopColor={g[0]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`amb-b-${g[1].slice(1)}`} cx="80%" cy="90%" r="60%">
          <stop offset="0%" stopColor={g[1]} stopOpacity="0.45" />
          <stop offset="100%" stopColor={g[1]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#amb-a-${g[0].slice(1)})`} />
      <rect width="200" height="140" fill={`url(#amb-b-${g[1].slice(1)})`} />
    </>
  )
}

/** Floating gradient orbs — lazy, infinite drift. */
function Orbs({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  const dots = [
    { cx: 32, cy: 26, r: 3.2, color: g[0], delay: 0 },
    { cx: 168, cy: 44, r: 2.4, color: g[1], delay: 0.8 },
    { cx: 160, cy: 108, r: 4, color: g[0], delay: 1.4 },
    { cx: 46, cy: 112, r: 2, color: g[1], delay: 2.0 },
  ]
  return (
    <>
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.color}
          opacity={0.55}
          animate={
            reduce
              ? undefined
              : { cy: [d.cy, d.cy - 4, d.cy], opacity: [0.5, 0.85, 0.5] }
          }
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, delay: d.delay, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

/** Window chrome — Notion-style mac-ish window with traffic lights. */
function Window({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      initial={reduce ? false : { y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <rect x="34" y="28" width="132" height="82" rx="8" fill="var(--bg-inset)" opacity="0.55" />
      <rect
        x="34"
        y="28"
        width="132"
        height="82"
        rx="8"
        fill="none"
        stroke={g[0]}
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {/* Title bar */}
      <rect x="34" y="28" width="132" height="14" rx="8" fill={g[0]} opacity="0.1" />
      {/* Faux macOS window-chrome dots — semantic tones keep them on-palette. */}
      <circle cx="42" cy="35" r="1.8" fill="var(--color-error)" opacity="0.65" />
      <circle cx="48" cy="35" r="1.8" fill="var(--color-warning)" opacity="0.65" />
      <circle cx="54" cy="35" r="1.8" fill="var(--color-success)" opacity="0.65" />
      {/* Fake URL */}
      <rect x="70" y="32.5" width="80" height="5" rx="2.5" fill="#ffffff" opacity="0.08" />
    </motion.g>
  )
}

/** Layered cards — subtle Cred-style stacking. */
function StackedCards({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      animate={reduce ? undefined : { y: [0, -2, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="58" y="68" width="84" height="32" rx="6" fill={g[1]} opacity="0.18" />
      <rect x="54" y="62" width="84" height="32" rx="6" fill={g[0]} opacity="0.25" />
      <rect x="50" y="56" width="84" height="32" rx="6" fill="#ffffff" opacity="0.10" />
      <rect x="50" y="56" width="84" height="32" rx="6" fill="none" stroke={g[0]} strokeOpacity="0.45" strokeWidth="1" />
      <rect x="56" y="64" width="44" height="3" rx="1.5" fill="#ffffff" opacity="0.85" />
      <rect x="56" y="71" width="28" height="2.5" rx="1.25" fill="#ffffff" opacity="0.45" />
      <rect x="56" y="77" width="52" height="2.5" rx="1.25" fill="#ffffff" opacity="0.3" />
    </motion.g>
  )
}

/** Flow: 3 nodes connected with an animated dash — good for workflow/ai/data. */
function FlowLine({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      <motion.path
        d="M50 78 C 80 58, 120 98, 150 70"
        fill="none"
        stroke={g[0]}
        strokeOpacity="0.75"
        strokeWidth="1.4"
        strokeDasharray="3 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      {[{ cx: 50, cy: 78 }, { cx: 100, cy: 72 }, { cx: 150, cy: 70 }].map((p, i) => (
        <motion.circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={4}
          fill={g[0]}
          animate={reduce ? undefined : { r: [3.5, 4.5, 3.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}
      {[{ cx: 50, cy: 78 }, { cx: 100, cy: 72 }, { cx: 150, cy: 70 }].map((p, i) => (
        <circle key={`r-${i}`} cx={p.cx} cy={p.cy} r={2} fill="#ffffff" opacity="0.85" />
      ))}
    </g>
  )
}

/** Bar chart — dashboards, analytics. */
function Bars({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  const bars = [
    { x: 62, h: 22, d: 0 },
    { x: 78, h: 38, d: 0.2 },
    { x: 94, h: 16, d: 0.4 },
    { x: 110, h: 48, d: 0.6 },
    { x: 126, h: 28, d: 0.8 },
  ]
  return (
    <g>
      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          y={90 - b.h}
          width="10"
          height={b.h}
          rx="2"
          fill={i % 2 === 0 ? g[0] : g[1]}
          opacity="0.85"
          initial={reduce ? false : { scaleY: 0.3 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, delay: b.d, ease: 'easeOut' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
        />
      ))}
      <motion.path
        d="M62 62 L 78 52 L 94 68 L 110 46 L 126 58"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: 'easeOut' }}
      />
    </g>
  )
}

/** Neural nodes — AI apps. */
function Neural({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  const nodes = [
    { cx: 60, cy: 60 }, { cx: 60, cy: 82 },
    { cx: 100, cy: 50 }, { cx: 100, cy: 72 }, { cx: 100, cy: 94 },
    { cx: 140, cy: 66 }, { cx: 140, cy: 88 },
  ]
  const edges = [
    [0, 2], [0, 3], [1, 3], [1, 4],
    [2, 5], [3, 5], [3, 6], [4, 6],
  ] as const
  return (
    <g>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a]!.cx}
          y1={nodes[a]!.cy}
          x2={nodes[b]!.cx}
          y2={nodes[b]!.cy}
          stroke={g[0]}
          strokeOpacity="0.4"
          strokeWidth="0.8"
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={3.2}
          fill={i % 2 === 0 ? g[0] : g[1]}
          animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </g>
  )
}

/** Kanban columns — pm-tool. */
function Kanban({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      {[52, 88, 124].map((x, col) => (
        <g key={col}>
          <rect x={x} y={50} width="28" height="56" rx="4" fill="var(--bg-inset)" opacity="0.4" />
          <rect x={x} y={50} width="28" height="56" rx="4" fill="none" stroke={g[0]} strokeOpacity="0.35" strokeWidth="0.8" />
          {[0, 1, 2].map((row) => (
            <motion.rect
              key={row}
              x={x + 3}
              y={55 + row * 14}
              width="22"
              height="10"
              rx="2"
              fill={col === 0 ? g[1] : col === 1 ? g[0] : '#ffffff'}
              opacity={col === 2 ? 0.2 : 0.7}
              animate={reduce ? undefined : { x: [x + 3, x + 4, x + 3] }}
              transition={{ duration: 3, repeat: Infinity, delay: col * 0.3 + row * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </g>
      ))}
    </g>
  )
}

/** Avatar cluster — hr/community/collab. */
function Avatars({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  const av = [
    { cx: 70, cy: 70, r: 9, c: g[0] },
    { cx: 100, cy: 60, r: 11, c: g[1] },
    { cx: 132, cy: 72, r: 9, c: g[0] },
    { cx: 86, cy: 90, r: 8, c: g[1] },
    { cx: 118, cy: 92, r: 8, c: g[0] },
  ]
  return (
    <g>
      {av.map((a, i) => (
        <motion.g
          key={i}
          animate={reduce ? undefined : { y: [0, -1.5, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        >
          <circle cx={a.cx} cy={a.cy} r={a.r} fill={a.c} opacity="0.85" />
          <circle cx={a.cx} cy={a.cy} r={a.r} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
          <circle cx={a.cx} cy={a.cy - 1.5} r={a.r * 0.35} fill="#ffffff" opacity="0.9" />
          <path
            d={`M ${a.cx - a.r * 0.55} ${a.cy + a.r * 0.25} Q ${a.cx} ${a.cy + a.r * 0.9} ${a.cx + a.r * 0.55} ${a.cy + a.r * 0.25}`}
            fill="#ffffff"
            opacity="0.9"
          />
        </motion.g>
      ))}
    </g>
  )
}

/** Shield — admin panels. */
function Shield({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      <path
        d="M100 42 L 130 52 V 74 C 130 90 116 100 100 108 C 84 100 70 90 70 74 V 52 Z"
        fill={g[0]}
        opacity="0.3"
      />
      <path
        d="M100 42 L 130 52 V 74 C 130 90 116 100 100 108 C 84 100 70 90 70 74 V 52 Z"
        fill="none"
        stroke={g[0]}
        strokeOpacity="0.9"
        strokeWidth="1.4"
      />
      <path
        d="M88 76 L 96 84 L 114 66"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.95"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.g>
  )
}

/** Cart + box — commerce. */
function Cart({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      animate={reduce ? undefined : { x: [-2, 2, -2] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="74" y="58" width="28" height="24" rx="3" fill={g[0]} opacity="0.6" />
      <rect x="74" y="58" width="28" height="24" rx="3" fill="none" stroke={g[0]} strokeWidth="1" />
      <rect x="74" y="64" width="28" height="2" fill="#ffffff" opacity="0.5" />
      <path d="M108 58 L 132 58 L 138 94 L 110 94 Z" fill={g[1]} opacity="0.55" />
      <path d="M108 58 L 132 58 L 138 94 L 110 94 Z" fill="none" stroke={g[1]} strokeWidth="1" />
      <circle cx="114" cy="100" r="3.5" fill="#ffffff" opacity="0.9" />
      <circle cx="134" cy="100" r="3.5" fill="#ffffff" opacity="0.9" />
    </motion.g>
  )
}

/** Book — edu. */
function Book({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      animate={reduce ? undefined : { rotate: [-2, 2, -2] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformBox: 'fill-box', transformOrigin: '100px 78px' }}
    >
      <rect x="70" y="54" width="60" height="46" rx="3" fill={g[1]} opacity="0.55" />
      <rect x="72" y="56" width="56" height="42" rx="2" fill={g[0]} opacity="0.35" />
      <line x1="100" y1="56" x2="100" y2="98" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
      {[62, 68, 74, 80, 86].map((y, i) => (
        <line key={i} x1="76" y1={y} x2="96" y2={y} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.8" />
      ))}
      {[62, 68, 74, 80, 86].map((y, i) => (
        <line key={`r${i}`} x1="104" y1={y} x2="124" y2={y} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.8" />
      ))}
    </motion.g>
  )
}

/** Code brackets + tag — dev-tool. */
function Code({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      <motion.text
        x="68"
        y="82"
        fontSize="32"
        fontWeight="600"
        fontFamily="ui-monospace, Menlo, monospace"
        fill={g[0]}
        opacity="0.85"
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {'<'}
      </motion.text>
      <motion.text
        x="86"
        y="82"
        fontSize="20"
        fontFamily="ui-monospace, Menlo, monospace"
        fill="#ffffff"
        opacity="0.75"
        animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
      >
        /api
      </motion.text>
      <motion.text
        x="120"
        y="82"
        fontSize="32"
        fontWeight="600"
        fontFamily="ui-monospace, Menlo, monospace"
        fill={g[1]}
        opacity="0.85"
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
      >
        {'/>'}
      </motion.text>
    </g>
  )
}

/** Coin + spark — finance. */
function Coin({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      <motion.g
        animate={reduce ? undefined : { rotateY: [0, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: '100px 72px' }}
      >
        <circle cx="100" cy="72" r="20" fill={g[0]} opacity="0.7" />
        <circle cx="100" cy="72" r="20" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
        <text
          x="100"
          y="79"
          fontSize="22"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="ui-monospace, Menlo, monospace"
          fill="#ffffff"
          opacity="0.95"
        >
          $
        </text>
      </motion.g>
      <motion.path
        d="M56 98 L 72 86 L 84 92 L 100 78 L 120 88 L 140 70"
        fill="none"
        stroke={g[1]}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 3"
        initial={{ pathLength: 0 }}
        animate={reduce ? undefined : { pathLength: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
    </g>
  )
}

/** Chat bubbles — support/community. */
function Chat({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      <motion.g
        animate={reduce ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="56" y="52" width="60" height="30" rx="10" fill={g[0]} opacity="0.7" />
        <path d="M70 82 L 66 92 L 80 82 Z" fill={g[0]} opacity="0.7" />
        <circle cx="70" cy="67" r="2" fill="#ffffff" opacity="0.95" />
        <circle cx="82" cy="67" r="2" fill="#ffffff" opacity="0.95" />
        <circle cx="94" cy="67" r="2" fill="#ffffff" opacity="0.95" />
      </motion.g>
      <motion.g
        animate={reduce ? undefined : { y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }}
      >
        <rect x="100" y="74" width="50" height="24" rx="10" fill={g[1]} opacity="0.55" />
        <path d="M132 98 L 140 108 L 128 98 Z" fill={g[1]} opacity="0.55" />
        <line x1="108" y1="84" x2="142" y2="84" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.4" />
        <line x1="108" y1="90" x2="130" y2="90" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.4" />
      </motion.g>
    </g>
  )
}

/** Grid of tiles — marketplace. */
function GridTiles({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  const tiles: Array<[number, number, string]> = [
    [56, 54, g[0]], [86, 54, g[1]], [116, 54, g[0]], [146, 54, '#ffffff'],
    [56, 80, g[1]], [86, 80, g[0]], [116, 80, '#ffffff'], [146, 80, g[1]],
  ]
  return (
    <g>
      {tiles.map(([x, y, c], i) => (
        <motion.rect
          key={i}
          x={x}
          y={y}
          width="22"
          height="20"
          rx="3"
          fill={c}
          opacity={c === '#ffffff' ? 0.25 : 0.6}
          animate={reduce ? undefined : { opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: (i % 4) * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </g>
  )
}

/** Data rows — data-app. */
function DataRows({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <g>
      <rect x="48" y="50" width="106" height="64" rx="4" fill="var(--bg-inset)" opacity="0.5" />
      <rect x="48" y="50" width="106" height="10" rx="4" fill={g[0]} opacity="0.35" />
      {[62, 72, 82, 92, 102].map((y, i) => (
        <g key={i}>
          <rect x="52" y={y} width="18" height="5" rx="1" fill="#ffffff" opacity="0.3" />
          <motion.rect
            x="74"
            y={y}
            width="28"
            height="5"
            rx="1"
            fill={g[0]}
            opacity="0.65"
            animate={reduce ? undefined : { width: [18, 32, 18] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
          <rect x="106" y={y} width="18" height="5" rx="1" fill="#ffffff" opacity="0.2" />
          <circle cx="140" cy={y + 2.5} r="2" fill={i % 2 === 0 ? g[1] : g[0]} opacity="0.75" />
        </g>
      ))}
    </g>
  )
}

/** Spark pill — ai skills / copilot glyph. */
function Spark({ g, reduce }: { g: [string, string]; reduce: boolean }) {
  return (
    <motion.g
      animate={reduce ? undefined : { scale: [1, 1.08, 1], rotate: [0, 3, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformBox: 'fill-box', transformOrigin: '100px 70px' }}
    >
      <path
        d="M100 44 L 107 63 L 126 70 L 107 77 L 100 96 L 93 77 L 74 70 L 93 63 Z"
        fill={g[0]}
        opacity="0.6"
      />
      <path
        d="M100 44 L 107 63 L 126 70 L 107 77 L 100 96 L 93 77 L 74 70 L 93 63 Z"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="1"
      />
      <circle cx="100" cy="70" r="4" fill="#ffffff" opacity="0.9" />
    </motion.g>
  )
}

// ---------------------------------------------------------------------------
// Scene composer — category → motif stack
// ---------------------------------------------------------------------------

function Scene({ category, g, reduce }: { category: AppCategory; g: [string, string]; reduce: boolean }) {
  switch (category) {
    case 'saas-app':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <StackedCards g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'internal-tool':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <FlowLine g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'admin-panel':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Shield g={g} reduce={reduce} />
        </>
      )
    case 'dashboard':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Bars g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'crm':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <FlowLine g={g} reduce={reduce} />
          <Avatars g={g} reduce={reduce} />
        </>
      )
    case 'pm-tool':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Kanban g={g} reduce={reduce} />
        </>
      )
    case 'ai-app':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Neural g={g} reduce={reduce} />
          <Spark g={g} reduce={reduce} />
        </>
      )
    case 'collab':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Avatars g={g} reduce={reduce} />
          <Chat g={g} reduce={reduce} />
        </>
      )
    case 'data-app':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <DataRows g={g} reduce={reduce} />
        </>
      )
    case 'dev-tool':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Code g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'finance':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Coin g={g} reduce={reduce} />
        </>
      )
    case 'hr-app':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Avatars g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'support':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Chat g={g} reduce={reduce} />
        </>
      )
    case 'edu-app':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Book g={g} reduce={reduce} />
          <Orbs g={g} reduce={reduce} />
        </>
      )
    case 'ecom-ops':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Cart g={g} reduce={reduce} />
        </>
      )
    case 'marketplace':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <GridTiles g={g} reduce={reduce} />
        </>
      )
    case 'community':
      return (
        <>
          <Window g={g} reduce={reduce} />
          <Avatars g={g} reduce={reduce} />
          <Chat g={g} reduce={reduce} />
        </>
      )
    default:
      return (
        <>
          <Window g={g} reduce={reduce} />
          <StackedCards g={g} reduce={reduce} />
        </>
      )
  }
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

function BlueprintIllustrationImpl({
  category,
  gradient,
  size = 'md',
  reduceMotion = false,
  className,
  style,
}: BlueprintIllustrationProps) {
  const viewBox = '0 0 200 140'
  const heightMap = { sm: 'h-full', md: 'h-full', lg: 'h-full' }
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={`${heightMap[size]} w-full ${className ?? ''}`}
      style={style}
      aria-hidden
    >
      <Ambient g={gradient} />
      <Scene category={category} g={gradient} reduce={reduceMotion} />
    </svg>
  )
}

export const BlueprintIllustration = memo(BlueprintIllustrationImpl)
