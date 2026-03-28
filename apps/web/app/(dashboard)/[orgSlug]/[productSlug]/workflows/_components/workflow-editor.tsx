"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, ArrowRight } from "lucide-react";
import type { Workflow, WorkflowState, WorkflowTransition, Entity } from "../_data/mock-data";
import { uid } from "../_data/mock-data";
import StateDiagram from "./state-diagram";

interface WorkflowEditorProps {
  workflow: Workflow;
  entities: Entity[];
  onChange: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

const STATE_TYPES: WorkflowState["type"][] = ["initial", "normal", "final"];
const PRESET_COLORS = ["#3B82F6", "#94A3B8", "#10B981", "#F59E0B", "#EF4444", "#A855F7", "#EC4899", "#06B6D4"];

export default function WorkflowEditor({ workflow, entities, onChange, onDelete }: WorkflowEditorProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  const update = (patch: Partial<Workflow>) => onChange({ ...workflow, ...patch });

  // ── State helpers ──────────────────────────────────────────────────────
  const updateState = (id: string, patch: Partial<WorkflowState>) => {
    update({ states: workflow.states.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };

  const addState = () => {
    const newState: WorkflowState = {
      id: uid(),
      name: "New State",
      color: "#94A3B8",
      type: "normal",
    };
    update({ states: [...workflow.states, newState] });
  };

  const removeState = (id: string) => {
    update({
      states: workflow.states.filter((s) => s.id !== id),
      transitions: workflow.transitions.filter((t) => t.fromStateId !== id && t.toStateId !== id),
    });
    if (selectedStateId === id) setSelectedStateId(null);
  };

  // ── Transition helpers ─────────────────────────────────────────────────
  const updateTransition = (id: string, patch: Partial<WorkflowTransition>) => {
    update({ transitions: workflow.transitions.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  };

  const addTransition = () => {
    if (workflow.states.length < 2) return;
    const newT: WorkflowTransition = {
      id: uid(),
      fromStateId: workflow.states[0].id,
      toStateId: workflow.states[1].id,
      trigger: "new_trigger",
    };
    update({ transitions: [...workflow.transitions, newT] });
  };

  const removeTransition = (id: string) => {
    update({ transitions: workflow.transitions.filter((t) => t.id !== id) });
  };

  const stateName = (id: string) => workflow.states.find((s) => s.id === id)?.name ?? "?";

  return (
    <motion.div
      key={workflow.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5 h-full overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <input
          value={workflow.name}
          onChange={(e) => update({ name: e.target.value })}
          className="text-xl font-semibold bg-transparent text-[#F1F5F9] outline-none border-b border-transparent focus:border-emerald-500/40 pb-1 transition-colors flex-1"
          placeholder="Workflow name"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Entity:</span>
          <select
            value={workflow.entityId}
            onChange={(e) => update({ entityId: e.target.value })}
            className="bg-white/[0.05] text-sm text-[#94A3B8] rounded-lg px-2 py-1 outline-none border border-white/[0.08]"
          >
            {entities.map((e) => (
              <option key={e.id} value={e.id} className="bg-[#0c1022]">
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* State diagram */}
      <StateDiagram
        states={workflow.states}
        transitions={workflow.transitions}
        selectedStateId={selectedStateId}
        onSelectState={setSelectedStateId}
      />

      {/* States list */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[#F1F5F9]">States</h3>
        <div className="flex flex-col gap-1.5">
          {workflow.states.map((state) => (
            <div
              key={state.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                selectedStateId === state.id
                  ? "bg-white/[0.05] border-emerald-500/30"
                  : "bg-white/[0.02] border-white/[0.06]"
              }`}
              onClick={() => setSelectedStateId(state.id)}
            >
              {/* Color dot */}
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: state.color }}
              />
              <input
                value={state.name}
                onChange={(e) => updateState(state.id, { name: e.target.value })}
                className="bg-transparent text-sm text-[#F1F5F9] outline-none flex-1"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Color picker */}
              <div className="relative group">
                <button
                  className="w-5 h-5 rounded border border-white/[0.12]"
                  style={{ backgroundColor: state.color }}
                />
                <div className="absolute right-0 top-7 z-10 hidden group-hover:flex gap-1 p-1.5 bg-[#0c1022] border border-white/[0.1] rounded-lg shadow-xl">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateState(state.id, { color: c });
                      }}
                      className="w-4 h-4 rounded-sm border border-white/[0.1] hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <select
                value={state.type}
                onChange={(e) => updateState(state.id, { type: e.target.value as WorkflowState["type"] })}
                className="bg-white/[0.05] text-xs text-[#94A3B8] rounded px-1.5 py-0.5 outline-none border border-white/[0.08]"
                onClick={(e) => e.stopPropagation()}
              >
                {STATE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0c1022]">
                    {t}
                  </option>
                ))}
              </select>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeState(state.id);
                }}
                className="text-[#64748B] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addState}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-emerald-400 transition-colors self-start mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add State
        </button>
      </div>

      {/* Transitions list */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[#F1F5F9]">Transitions</h3>
        <div className="flex flex-col gap-1.5">
          {workflow.transitions.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]"
            >
              <select
                value={tr.fromStateId}
                onChange={(e) => updateTransition(tr.id, { fromStateId: e.target.value })}
                className="bg-white/[0.05] text-xs text-[#94A3B8] rounded px-1.5 py-1 outline-none border border-white/[0.08] flex-1"
              >
                {workflow.states.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0c1022]">
                    {s.name}
                  </option>
                ))}
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <select
                value={tr.toStateId}
                onChange={(e) => updateTransition(tr.id, { toStateId: e.target.value })}
                className="bg-white/[0.05] text-xs text-[#94A3B8] rounded px-1.5 py-1 outline-none border border-white/[0.08] flex-1"
              >
                {workflow.states.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0c1022]">
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={tr.trigger}
                onChange={(e) => updateTransition(tr.id, { trigger: e.target.value })}
                className="bg-transparent text-xs text-[#F1F5F9] outline-none w-24"
                placeholder="trigger"
              />
              <button
                onClick={() => removeTransition(tr.id)}
                className="text-[#64748B] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addTransition}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-emerald-400 transition-colors self-start mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Transition
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
          <Save className="w-4 h-4" /> Save Workflow
        </button>
        <button
          onClick={() => onDelete(workflow.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors ml-auto"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </motion.div>
  );
}
