"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { WorkflowState, WorkflowTransition } from "../_data/mock-data";

interface StateDiagramProps {
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  selectedStateId: string | null;
  onSelectState: (id: string) => void;
}

const STATE_W = 120;
const STATE_H = 48;
const COLS = 3;
const H_GAP = 170;
const V_GAP = 100;
const PAD_X = 40;
const PAD_Y = 40;

const TYPE_COLOR: Record<string, string> = {
  initial: "#3B82F6",
  normal: "#94A3B8",
  final: "#10B981",
};

/** Auto-layout: arrange states in rows of 3 */
function getPosition(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: PAD_X + col * H_GAP,
    y: PAD_Y + row * V_GAP,
  };
}

function stateCenter(x: number, y: number) {
  return { cx: x + STATE_W / 2, cy: y + STATE_H / 2 };
}

/**
 * Quadratic bezier between two state centers with perpendicular offset
 * to separate overlapping / reversed edges.
 */
function edgePath(
  fromX: number, fromY: number,
  toX: number, toY: number,
  offset: number = 0,
): string {
  const a = stateCenter(fromX, fromY);
  const b = stateCenter(toX, toY);
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const curveOffset = 25 + offset * 18;
  const nx = -dy / len;
  const ny = dx / len;
  const cpx = mx + nx * curveOffset;
  const cpy = my + ny * curveOffset;
  return `M ${a.cx} ${a.cy} Q ${cpx} ${cpy} ${b.cx} ${b.cy}`;
}

function bezierMidpoint(
  fromX: number, fromY: number,
  toX: number, toY: number,
  offset: number = 0,
) {
  const a = stateCenter(fromX, fromY);
  const b = stateCenter(toX, toY);
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const curveOffset = 25 + offset * 18;
  const nx = -dy / len;
  const ny = dx / len;
  const cpx = mx + nx * curveOffset;
  const cpy = my + ny * curveOffset;
  const t = 0.5;
  const x = (1 - t) * (1 - t) * a.cx + 2 * (1 - t) * t * cpx + t * t * b.cx;
  const y = (1 - t) * (1 - t) * a.cy + 2 * (1 - t) * t * cpy + t * t * b.cy;
  return { x, y };
}

export default function StateDiagram({
  states,
  transitions,
  selectedStateId,
  onSelectState,
}: StateDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Build position map
  const posMap = new Map<string, { x: number; y: number }>();
  states.forEach((s, i) => posMap.set(s.id, getPosition(i)));

  const rows = Math.ceil(states.length / COLS);
  const svgW = PAD_X * 2 + Math.min(states.length, COLS) * H_GAP - (H_GAP - STATE_W);
  const svgH = PAD_Y * 2 + Math.max(rows, 1) * V_GAP - (V_GAP - STATE_H);

  // Compute edge pair offsets
  const pairCount: Record<string, number> = {};
  const edgeOffset: Record<string, number> = {};
  transitions.forEach((tr) => {
    const key = [tr.fromStateId, tr.toStateId].sort().join("|");
    pairCount[key] = (pairCount[key] ?? 0) + 1;
  });
  const pairCursor: Record<string, number> = {};
  transitions.forEach((tr) => {
    const key = [tr.fromStateId, tr.toStateId].sort().join("|");
    const cursor = pairCursor[key] ?? 0;
    edgeOffset[tr.id] = cursor;
    pairCursor[key] = cursor + 1;
  });

  return (
    <div className="bg-[#0a0f1e] rounded-xl border border-white/[0.06] p-4 overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        style={{ minHeight: 180 }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#64748B" />
          </marker>
          <marker
            id="arrowhead-accent"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#10B981" />
          </marker>
        </defs>

        {/* Transitions */}
        {transitions.map((tr) => {
          const fromPos = posMap.get(tr.fromStateId);
          const toPos = posMap.get(tr.toStateId);
          if (!fromPos || !toPos) return null;

          const offset = edgeOffset[tr.id] ?? 0;
          const d = edgePath(fromPos.x, fromPos.y, toPos.x, toPos.y, offset);
          const label = bezierMidpoint(fromPos.x, fromPos.y, toPos.x, toPos.y, offset);

          return (
            <g key={tr.id}>
              <motion.path
                d={d}
                fill="none"
                stroke="#64748B"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <rect
                x={label.x - 30}
                y={label.y - 9}
                width={60}
                height={18}
                rx={4}
                fill="#0a0f1e"
                fillOpacity={0.95}
                stroke="#64748B"
                strokeOpacity={0.2}
                strokeWidth={0.5}
              />
              <text
                x={label.x}
                y={label.y + 4}
                textAnchor="middle"
                fontSize={9}
                fill="#94A3B8"
              >
                {tr.trigger}
              </text>
            </g>
          );
        })}

        {/* States */}
        {states.map((s, i) => {
          const pos = posMap.get(s.id);
          if (!pos) return null;
          const color = TYPE_COLOR[s.type] ?? "#94A3B8";
          const isSelected = selectedStateId === s.id;

          return (
            <motion.g
              key={s.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectState(s.id)}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={STATE_W}
                height={STATE_H}
                rx={12}
                fill={color}
                fillOpacity={isSelected ? 0.25 : 0.12}
                stroke={isSelected ? "#10B981" : color}
                strokeOpacity={isSelected ? 0.9 : 0.4}
                strokeWidth={isSelected ? 2 : 1}
              />
              <text
                x={pos.x + STATE_W / 2}
                y={pos.y + STATE_H / 2 - 3}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="#F1F5F9"
              >
                {s.name}
              </text>
              <text
                x={pos.x + STATE_W / 2}
                y={pos.y + STATE_H / 2 + 12}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                fontWeight={500}
              >
                {s.type.toUpperCase()}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
