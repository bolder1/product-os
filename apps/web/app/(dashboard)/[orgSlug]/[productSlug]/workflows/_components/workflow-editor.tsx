"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, ArrowRight, Shield, Zap, ChevronDown, ChevronUp, Lock, Bell, CheckSquare, Globe, Sparkles, UserCheck } from "lucide-react";
import type { Workflow, WorkflowState, WorkflowTransition, Entity } from "../_data/mock-data";
import { uid } from "../_data/mock-data";
import StateDiagram from "./state-diagram";
import { ViewInGraphLink } from "../../../../../components/shared/view-in-graph-link";

/* ------------------------------------------------------------------ */
/*  Guard / Action types for enhanced transitions                      */
/* ------------------------------------------------------------------ */
interface Guard {
  id: string;
  type: "field_check" | "role_check" | "custom_expression";
  field?: string;
  operator?: string;
  value?: string;
  role?: string;
  expression?: string;
  errorMessage?: string;
}

interface Action {
  id: string;
  type: "set_field" | "create_task" | "send_notification" | "request_approval" | "call_webhook" | "run_ai_skill";
  config: Record<string, unknown>;
}

// Extended transition with guards and actions
type EnhancedTransition = WorkflowTransition & {
  guards?: Guard[];
  actions?: Action[];
  allowedRoles?: string[];
  requiresApproval?: boolean;
};

interface WorkflowEditorProps {
  workflow: Workflow & { transitions: EnhancedTransition[] };
  entities: Entity[];
  onChange: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

const STATE_TYPES: WorkflowState["type"][] = ["initial", "normal", "final"];

// R20: user-facing state-color palette picker. These are *authored*
// swatches a user chooses from when tagging a workflow state in the
// state diagram — functional palette, not chrome. Left literal and
// per-line eslint-disabled.
const PRESET_COLORS = [
  // eslint-disable-next-line no-hardcoded-hex -- state palette: blue
  "#3B82F6",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: slate (default)
  "#94A3B8",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: emerald
  "#10B981",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: amber
  "#F59E0B",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: rose
  "#EF4444",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: violet
  "#A855F7",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: pink
  "#EC4899",
  // eslint-disable-next-line no-hardcoded-hex -- state palette: cyan
  "#06B6D4",
];

const GUARD_TYPES = [
  { value: "field_check", label: "Field Check", icon: CheckSquare },
  { value: "role_check", label: "Role Check", icon: UserCheck },
  { value: "custom_expression", label: "Expression", icon: Sparkles },
] as const;

const ACTION_TYPES = [
  { value: "set_field", label: "Set Field" },
  { value: "create_task", label: "Create Task" },
  { value: "send_notification", label: "Send Notification" },
  { value: "request_approval", label: "Request Approval" },
  { value: "call_webhook", label: "Call Webhook" },
  { value: "run_ai_skill", label: "Run AI Skill" },
] as const;

const OPERATORS = ["eq", "neq", "gt", "lt", "gte", "lte", "in", "not_in", "is_set", "is_empty"];

/* ------------------------------------------------------------------ */
/*  Guard/Action row for transition detail                             */
/* ------------------------------------------------------------------ */
function GuardRow({ guard, entity, onUpdate, onRemove }: {
  guard: Guard; entity: Entity | undefined; onUpdate: (g: Guard) => void; onRemove: () => void;
}) {
  const fields = entity?.fields.map((f) => f.name) ?? [];
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
      <Shield className="w-3 h-3 text-[var(--color-warning)] shrink-0" />
      <select value={guard.type} onChange={(e) => onUpdate({ ...guard, type: e.target.value as Guard["type"] })}
        className="bg-white/[0.05] text-[10px] text-[var(--text-secondary)] rounded px-1 py-0.5 outline-none border border-white/[0.08]">
        {GUARD_TYPES.map((g) => <option key={g.value} value={g.value} className="bg-[var(--bg-inset)]">{g.label}</option>)}
      </select>

      {guard.type === "field_check" && (
        <>
          <select value={guard.field ?? ""} onChange={(e) => onUpdate({ ...guard, field: e.target.value })}
            className="bg-white/[0.05] text-[10px] text-[var(--text-secondary)] rounded px-1 py-0.5 outline-none border border-white/[0.08]">
            <option value="">field...</option>
            {fields.map((f) => <option key={f} value={f} className="bg-[var(--bg-inset)]">{f}</option>)}
          </select>
          <select value={guard.operator ?? "eq"} onChange={(e) => onUpdate({ ...guard, operator: e.target.value })}
            className="bg-white/[0.05] text-[10px] text-[var(--text-secondary)] rounded px-1 py-0.5 outline-none border border-white/[0.08]">
            {OPERATORS.map((o) => <option key={o} value={o} className="bg-[var(--bg-inset)]">{o}</option>)}
          </select>
          <input value={guard.value ?? ""} onChange={(e) => onUpdate({ ...guard, value: e.target.value })}
            className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none w-16 border-b border-white/[0.06]" placeholder="value" />
        </>
      )}
      {guard.type === "role_check" && (
        <input value={guard.role ?? ""} onChange={(e) => onUpdate({ ...guard, role: e.target.value })}
          className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none w-20 border-b border-white/[0.06]" placeholder="admin, manager..." />
      )}
      {guard.type === "custom_expression" && (
        <input value={guard.expression ?? ""} onChange={(e) => onUpdate({ ...guard, expression: e.target.value })}
          className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none flex-1 border-b border-white/[0.06]" placeholder="entity.status !== 'locked'" />
      )}

      <button onClick={onRemove} className="ml-auto text-[var(--text-tertiary)] hover:text-[var(--color-error)]"><Trash2 className="w-3 h-3" /></button>
    </div>
  );
}

function ActionRow({ action, onUpdate, onRemove }: {
  action: Action; onUpdate: (a: Action) => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
      <Zap className="w-3 h-3 text-[var(--accent)] shrink-0" />
      <select value={action.type} onChange={(e) => onUpdate({ ...action, type: e.target.value as Action["type"] })}
        className="bg-white/[0.05] text-[10px] text-[var(--text-secondary)] rounded px-1 py-0.5 outline-none border border-white/[0.08]">
        {ACTION_TYPES.map((a) => <option key={a.value} value={a.value} className="bg-[var(--bg-inset)]">{a.label}</option>)}
      </select>
      {action.type === "set_field" && (
        <>
          <input value={String(action.config.field ?? "")} onChange={(e) => onUpdate({ ...action, config: { ...action.config, field: e.target.value } })}
            className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none w-16 border-b border-white/[0.06]" placeholder="field" />
          <span className="text-[10px] text-[var(--text-tertiary)]">=</span>
          <input value={String(action.config.value ?? "")} onChange={(e) => onUpdate({ ...action, config: { ...action.config, value: e.target.value } })}
            className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none w-16 border-b border-white/[0.06]" placeholder="value" />
        </>
      )}
      {action.type === "call_webhook" && (
        <input value={String(action.config.url ?? "")} onChange={(e) => onUpdate({ ...action, config: { ...action.config, url: e.target.value } })}
          className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none flex-1 border-b border-white/[0.06]" placeholder="https://..." />
      )}
      {action.type === "send_notification" && (
        <input value={String(action.config.message ?? "")} onChange={(e) => onUpdate({ ...action, config: { ...action.config, message: e.target.value } })}
          className="bg-transparent text-[10px] text-[var(--text-primary)] outline-none flex-1 border-b border-white/[0.06]" placeholder="Notification text..." />
      )}
      {(action.type === "create_task" || action.type === "request_approval" || action.type === "run_ai_skill") && (
        <span className="text-[10px] text-[var(--text-tertiary)]">(configure in automation)</span>
      )}
      <button onClick={onRemove} className="ml-auto text-[var(--text-tertiary)] hover:text-[var(--color-error)]"><Trash2 className="w-3 h-3" /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main editor                                                        */
/* ------------------------------------------------------------------ */
export default function WorkflowEditor({ workflow, entities, onChange, onDelete }: WorkflowEditorProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [expandedTransitionId, setExpandedTransitionId] = useState<string | null>(null);

  const update = (patch: Partial<Workflow>) => onChange({ ...workflow, ...patch });
  const selectedEntity = entities.find((e) => e.id === workflow.entityId);

  // ── State helpers ──────────────────────────────────────────────────────
  const updateState = (id: string, patch: Partial<WorkflowState>) => {
    update({ states: workflow.states.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };

  const addState = () => {
    const newState: WorkflowState = {
      id: uid(),
      name: "New State",
      color: PRESET_COLORS[1], // slate default
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
  const updateTransition = (id: string, patch: Partial<EnhancedTransition>) => {
    update({ transitions: workflow.transitions.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  };

  const addTransition = () => {
    if (workflow.states.length < 2) return;
    const newT: EnhancedTransition = {
      id: uid(),
      fromStateId: workflow.states[0].id,
      toStateId: workflow.states[1].id,
      trigger: "new_trigger",
      guards: [],
      actions: [],
    };
    update({ transitions: [...workflow.transitions, newT] });
  };

  const removeTransition = (id: string) => {
    update({ transitions: workflow.transitions.filter((t) => t.id !== id) });
  };

  // Guard/Action helpers on transition
  const addGuardToTransition = (trId: string) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    const guard: Guard = { id: uid(), type: "field_check" };
    updateTransition(trId, { guards: [...(tr.guards ?? []), guard] });
  };

  const updateGuardOnTransition = (trId: string, guard: Guard) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    updateTransition(trId, { guards: (tr.guards ?? []).map((g) => (g.id === guard.id ? guard : g)) });
  };

  const removeGuardFromTransition = (trId: string, guardId: string) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    updateTransition(trId, { guards: (tr.guards ?? []).filter((g) => g.id !== guardId) });
  };

  const addActionToTransition = (trId: string) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    const action: Action = { id: uid(), type: "set_field", config: {} };
    updateTransition(trId, { actions: [...(tr.actions ?? []), action] });
  };

  const updateActionOnTransition = (trId: string, action: Action) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    updateTransition(trId, { actions: (tr.actions ?? []).map((a) => (a.id === action.id ? action : a)) });
  };

  const removeActionFromTransition = (trId: string, actionId: string) => {
    const tr = workflow.transitions.find((t) => t.id === trId) as EnhancedTransition | undefined;
    if (!tr) return;
    updateTransition(trId, { actions: (tr.actions ?? []).filter((a) => a.id !== actionId) });
  };

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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            value={workflow.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-xl font-semibold bg-transparent text-[var(--text-primary)] outline-none border-b border-transparent focus:border-[var(--color-success)]/40 pb-1 transition-colors flex-1 min-w-0"
            placeholder="Workflow name"
          />
          <ViewInGraphLink nodeId={workflow.id} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)]">Entity:</span>
          <select
            value={workflow.entityId}
            onChange={(e) => update({ entityId: e.target.value })}
            className="bg-white/[0.05] text-sm text-[var(--text-secondary)] rounded-lg px-2 py-1 outline-none border border-white/[0.08]"
          >
            {entities.map((e) => (
              <option key={e.id} value={e.id} className="bg-[var(--bg-inset)]">
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
        <h3 className="text-sm font-medium text-[var(--text-primary)]">States</h3>
        <div className="flex flex-col gap-1.5">
          {workflow.states.map((state) => (
            <div
              key={state.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                selectedStateId === state.id
                  ? "bg-white/[0.05] border-[var(--color-success)]/30"
                  : "bg-white/[0.02] border-white/[0.06]"
              }`}
              onClick={() => setSelectedStateId(state.id)}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: state.color }} />
              <input
                value={state.name}
                onChange={(e) => updateState(state.id, { name: e.target.value })}
                className="bg-transparent text-sm text-[var(--text-primary)] outline-none flex-1"
                onClick={(e) => e.stopPropagation()}
              />

              <div className="relative group">
                <button className="w-5 h-5 rounded border border-white/[0.12]" style={{ backgroundColor: state.color }} />
                <div className="absolute right-0 top-7 z-10 hidden group-hover:flex gap-1 p-1.5 bg-[var(--bg-inset)] border border-white/[0.1] rounded-lg shadow-xl">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={(e) => { e.stopPropagation(); updateState(state.id, { color: c }); }}
                      className="w-4 h-4 rounded-sm border border-white/[0.1] hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <select
                value={state.type}
                onChange={(e) => updateState(state.id, { type: e.target.value as WorkflowState["type"] })}
                className="bg-white/[0.05] text-xs text-[var(--text-secondary)] rounded px-1.5 py-0.5 outline-none border border-white/[0.08]"
                onClick={(e) => e.stopPropagation()}
              >
                {STATE_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[var(--bg-inset)]">{t}</option>
                ))}
              </select>

              <button onClick={(e) => { e.stopPropagation(); removeState(state.id); }}
                className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addState}
          className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--color-success)] transition-colors self-start mt-1">
          <Plus className="w-3.5 h-3.5" /> Add State
        </button>
      </div>

      {/* Transitions list — now with expandable guards/actions */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Transitions</h3>
        <div className="flex flex-col gap-1.5">
          {(workflow.transitions as EnhancedTransition[]).map((tr) => {
            const isExpanded = expandedTransitionId === tr.id;
            const guardCount = (tr.guards ?? []).length;
            const actionCount = (tr.actions ?? []).length;

            return (
              <div key={tr.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {/* Transition header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <select value={tr.fromStateId} onChange={(e) => updateTransition(tr.id, { fromStateId: e.target.value })}
                    className="bg-white/[0.05] text-xs text-[var(--text-secondary)] rounded px-1.5 py-1 outline-none border border-white/[0.08] flex-1">
                    {workflow.states.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[var(--bg-inset)]">{s.name}</option>
                    ))}
                  </select>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                  <select value={tr.toStateId} onChange={(e) => updateTransition(tr.id, { toStateId: e.target.value })}
                    className="bg-white/[0.05] text-xs text-[var(--text-secondary)] rounded px-1.5 py-1 outline-none border border-white/[0.08] flex-1">
                    {workflow.states.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[var(--bg-inset)]">{s.name}</option>
                    ))}
                  </select>
                  <input value={tr.trigger} onChange={(e) => updateTransition(tr.id, { trigger: e.target.value })}
                    className="bg-transparent text-xs text-[var(--text-primary)] outline-none w-20" placeholder="trigger" />

                  {/* Badges for guards/actions */}
                  {guardCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-1 py-0.5 rounded">
                      <Shield className="w-2.5 h-2.5" />{guardCount}
                    </span>
                  )}
                  {actionCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-[var(--accent)] bg-[var(--accent)]/10 px-1 py-0.5 rounded">
                      <Zap className="w-2.5 h-2.5" />{actionCount}
                    </span>
                  )}
                  {tr.requiresApproval && (
                    <Lock className="w-3 h-3 text-[var(--accent)]" />
                  )}

                  <button onClick={() => setExpandedTransitionId(isExpanded ? null : tr.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => removeTransition(tr.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded guard/action detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-3 border-t border-white/[0.04] pt-2">
                        {/* Guards */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-warning)] flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Guards
                            </span>
                            <button onClick={() => addGuardToTransition(tr.id)}
                              className="text-[10px] text-[var(--color-warning)] hover:opacity-80 flex items-center gap-0.5">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          {(tr.guards ?? []).length === 0 && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">No guards — transition always allowed</span>
                          )}
                          {(tr.guards ?? []).map((g) => (
                            <GuardRow key={g.id} guard={g} entity={selectedEntity}
                              onUpdate={(updated) => updateGuardOnTransition(tr.id, updated)}
                              onRemove={() => removeGuardFromTransition(tr.id, g.id)} />
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Actions
                            </span>
                            <button onClick={() => addActionToTransition(tr.id)}
                              className="text-[10px] text-[var(--accent)] hover:opacity-80 flex items-center gap-0.5">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          {(tr.actions ?? []).length === 0 && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">No actions — transition fires silently</span>
                          )}
                          {(tr.actions ?? []).map((a) => (
                            <ActionRow key={a.id} action={a}
                              onUpdate={(updated) => updateActionOnTransition(tr.id, updated)}
                              onRemove={() => removeActionFromTransition(tr.id, a.id)} />
                          ))}
                        </div>

                        {/* Requires approval toggle */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Requires Approval
                          </span>
                          <button onClick={() => updateTransition(tr.id, { requiresApproval: !tr.requiresApproval })}
                            className={`relative w-7 h-4 rounded-full transition-colors ${tr.requiresApproval ? "bg-[var(--accent)]" : "bg-white/[0.1]"}`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${tr.requiresApproval ? "left-3.5" : "left-0.5"}`} />
                          </button>
                        </div>

                        {/* Allowed roles */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-[var(--text-tertiary)]">Allowed Roles (comma-separated)</span>
                          <input value={(tr.allowedRoles ?? []).join(", ")}
                            onChange={(e) => updateTransition(tr.id, { allowedRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                            className="w-full bg-transparent text-[10px] text-[var(--text-primary)] outline-none border-b border-white/[0.06] pb-0.5"
                            placeholder="admin, manager, lead..." />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <button onClick={addTransition}
          className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--color-success)] transition-colors self-start mt-1">
          <Plus className="w-3.5 h-3.5" /> Add Transition
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm font-medium hover:bg-[var(--color-success)]/20 transition-colors">
          <Save className="w-4 h-4" /> Save Workflow
        </button>
        <button
          onClick={() => onDelete(workflow.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm font-medium hover:bg-[var(--color-error)]/20 transition-colors ml-auto"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </motion.div>
  );
}
