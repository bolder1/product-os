"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Database, GitBranch, Plus, Zap, FileInput, Trash2 } from "lucide-react";
import { AIActionBar } from "../../../../components/primitives/ai-action-bar";
import { useProduct } from "../layout";
import {
  INITIAL_ENTITIES,
  INITIAL_WORKFLOWS,
  uid,
  type Entity,
  type Workflow,
} from "./_data/mock-data";
import { useGraphStore } from "../../../../lib/graph-store";
import { StudioEmptyState } from "../../../../components/shared/studio-empty-state";
import EntityList from "./_components/entity-list";
import EntityEditor from "./_components/entity-editor";
import WorkflowList from "./_components/workflow-list";
import WorkflowEditor from "./_components/workflow-editor";
import { StudioHealthBadge } from "../../../../components/shared/studio-health-badge";

type Tab = "entities" | "workflows" | "automations" | "forms";
type Selection =
  | { kind: "entity"; id: string }
  | { kind: "workflow"; id: string }
  | { kind: "automation"; id: string }
  | { kind: "form"; id: string }
  | null;

/* ── Automation / Form types ────────────────────────────────────── */
interface AutomationDef {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerLabel: string;
  actionCount: number;
}

interface FormDef {
  id: string;
  name: string;
  entityId: string;
  fieldCount: number;
  stepCount: number;
}

export default function WorkflowBuilderPage() {
  const params = useParams<{ productSlug: string }>();
  const searchParams = useSearchParams();
  const product = useProduct();
  const productId = product?.id ?? params.productSlug;

  // Graph store for persistence
  const allNodes = useGraphStore((s) => s.nodes);
  const addNode = useGraphStore((s) => s.addNode);
  const updateNode = useGraphStore((s) => s.updateNode);
  const deleteNodeFromStore = useGraphStore((s) => s.deleteNode);

  const entityNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === "entity"),
    [allNodes, productId]
  );
  const workflowNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === "workflow"),
    [allNodes, productId]
  );

  // Hydrate from store or fall back to mock
  const hasStoreEntities = entityNodes.length > 0;
  const hasStoreWorkflows = workflowNodes.length > 0;

  const [tab, setTab] = useState<Tab>("entities");
  const [entities, setEntities] = useState<Entity[]>(() => {
    if (!hasStoreEntities) return INITIAL_ENTITIES;
    try {
      return entityNodes.map((n) => JSON.parse(String(n.data.payload)) as Entity);
    } catch { return INITIAL_ENTITIES; }
  });
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    if (!hasStoreWorkflows) return INITIAL_WORKFLOWS;
    try {
      return workflowNodes.map((n) => JSON.parse(String(n.data.payload)) as Workflow);
    } catch { return INITIAL_WORKFLOWS; }
  });
  const [selection, setSelection] = useState<Selection>(null);

  // Auto-select entity or workflow when navigated from Graph Explorer via ?nodeId
  useEffect(() => {
    const nodeId = searchParams.get("nodeId");
    if (!nodeId) return;
    const matchEntity = entities.find((e) => e.id === nodeId);
    if (matchEntity) { setTab("entities"); setSelection({ kind: "entity", id: nodeId }); return; }
    const matchWorkflow = workflows.find((w) => w.id === nodeId);
    if (matchWorkflow) { setTab("workflows"); setSelection({ kind: "workflow", id: nodeId }); }
  }, [searchParams, entities, workflows]);

  // ── Automations & Forms (mock data — wired to graph store) ──────────
  const [automations, setAutomations] = useState<AutomationDef[]>([
    { id: "auto_1", name: "On Task Created → Assign", enabled: true, triggerType: "entity_created", triggerLabel: "Task Created", actionCount: 2 },
    { id: "auto_2", name: "On State Change → Notify", enabled: true, triggerType: "state_changed", triggerLabel: "State Changed", actionCount: 1 },
    { id: "auto_3", name: "Daily Digest", enabled: false, triggerType: "schedule", triggerLabel: "Daily at 9am", actionCount: 1 },
  ]);

  const [forms, setForms] = useState<FormDef[]>([
    { id: "form_1", name: "Create Task", entityId: "ent_task", fieldCount: 4, stepCount: 1 },
    { id: "form_2", name: "New Project Wizard", entityId: "ent_project", fieldCount: 6, stepCount: 3 },
  ]);

  // Sync entities to graph store
  useEffect(() => {
    for (const entity of entities) {
      const existing = entityNodes.find((n) => (n.data as Record<string, unknown>).entityLocalId === entity.id);
      const payload = JSON.stringify(entity);
      if (existing) {
        if (String(existing.data.payload) !== payload) {
          updateNode(existing.id, { label: entity.name, data: { entityLocalId: entity.id, payload } });
        }
      } else {
        addNode({ kind: "entity", label: entity.name, productId, data: { entityLocalId: entity.id, payload } });
      }
    }
  }, [entities]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync workflows to graph store
  useEffect(() => {
    for (const wf of workflows) {
      const existing = workflowNodes.find((n) => (n.data as Record<string, unknown>).wfLocalId === wf.id);
      const payload = JSON.stringify(wf);
      if (existing) {
        if (String(existing.data.payload) !== payload) {
          updateNode(existing.id, { label: wf.name, data: { wfLocalId: wf.id, payload } });
        }
      } else {
        addNode({ kind: "workflow", label: wf.name, productId, data: { wfLocalId: wf.id, payload } });
      }
    }
  }, [workflows]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Entity CRUD ────────────────────────────────────────────────────────
  const selectEntity = useCallback((id: string) => {
    setSelection({ kind: "entity", id });
  }, []);

  const addEntity = useCallback(() => {
    const newEntity: Entity = {
      id: uid(),
      name: "New Entity",
      description: "",
      fields: [],
      relations: [],
    };
    setEntities((prev) => [...prev, newEntity]);
    setSelection({ kind: "entity", id: newEntity.id });
  }, []);

  const updateEntity = useCallback((updated: Entity) => {
    setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const deleteEntity = useCallback(
    (id: string) => {
      setEntities((prev) => prev.filter((e) => e.id !== id));
      if (selection?.kind === "entity" && selection.id === id) {
        setSelection(null);
      }
    },
    [selection],
  );

  // ── Workflow CRUD ──────────────────────────────────────────────────────
  const selectWorkflow = useCallback((id: string) => {
    setSelection({ kind: "workflow", id });
  }, []);

  const addWorkflow = useCallback(() => {
    const entityId = entities[0]?.id ?? "";
    const newWorkflow: Workflow = {
      id: uid(),
      name: "New Workflow",
      entityId,
      states: [
        { id: uid(), name: "Start", color: "#3B82F6", type: "initial" },
        { id: uid(), name: "End", color: "#10B981", type: "final" },
      ],
      transitions: [],
    };
    setWorkflows((prev) => [...prev, newWorkflow]);
    setSelection({ kind: "workflow", id: newWorkflow.id });
  }, [entities]);

  const updateWorkflow = useCallback((updated: Workflow) => {
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }, []);

  const deleteWorkflow = useCallback(
    (id: string) => {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (selection?.kind === "workflow" && selection.id === id) {
        setSelection(null);
      }
    },
    [selection],
  );

  // ── AI Generate (placeholder) ──────────────────────────────────────────
  const aiGenerate = useCallback(() => {
    const newWf: Workflow = {
      id: uid(),
      name: "AI-Generated Workflow",
      entityId: entities[0]?.id ?? "",
      states: [
        { id: uid(), name: "Pending", color: "#3B82F6", type: "initial" },
        { id: uid(), name: "Processing", color: "#F59E0B", type: "normal" },
        { id: uid(), name: "Review", color: "#A855F7", type: "normal" },
        { id: uid(), name: "Approved", color: "#10B981", type: "final" },
      ],
      transitions: [],
    };
    // Wire transitions after we have IDs
    const [s0, s1, s2, s3] = newWf.states;
    newWf.transitions = [
      { id: uid(), fromStateId: s0.id, toStateId: s1.id, trigger: "begin" },
      { id: uid(), fromStateId: s1.id, toStateId: s2.id, trigger: "submit" },
      { id: uid(), fromStateId: s2.id, toStateId: s3.id, trigger: "approve" },
      { id: uid(), fromStateId: s2.id, toStateId: s1.id, trigger: "revise" },
    ];
    setWorkflows((prev) => [...prev, newWf]);
    setTab("workflows");
    setSelection({ kind: "workflow", id: newWf.id });
  }, [entities]);

  // ── Resolve selected item ─────────────────────────────────────────────
  const selectedEntity =
    selection?.kind === "entity"
      ? entities.find((e) => e.id === selection.id) ?? null
      : null;
  const selectedWorkflow =
    selection?.kind === "workflow"
      ? workflows.find((w) => w.id === selection.id) ?? null
      : null;
  const selectedAutomation =
    selection?.kind === "automation"
      ? automations.find((a) => a.id === selection.id) ?? null
      : null;
  const selectedForm =
    selection?.kind === "form"
      ? forms.find((f) => f.id === selection.id) ?? null
      : null;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Top Toolbar (32px) ─────────────────────────────────────────── */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">Workflow Builder</span>
          <StudioHealthBadge productId={productId} studio="workflows" />
          <span className="text-[10px] text-[var(--text-tertiary)] leading-none ml-1">
            {entities.length} entities / {workflows.length} workflows / {automations.length} automations
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={addEntity}
            className="tool-btn flex items-center gap-1 px-2 h-[22px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[11px] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <Plus className="w-3 h-3" />
            Entity
          </button>
          <button
            onClick={addWorkflow}
            className="tool-btn flex items-center gap-1 px-2 h-[22px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[11px] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <Plus className="w-3 h-3" />
            Workflow
          </button>
          <button
            onClick={() => {
              const a: AutomationDef = { id: uid(), name: "New Automation", enabled: true, triggerType: "manual", triggerLabel: "Manual", actionCount: 0 };
              setAutomations((prev) => [...prev, a]);
              setTab("automations");
              setSelection({ kind: "automation", id: a.id });
            }}
            className="tool-btn flex items-center gap-1 px-2 h-[22px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[11px] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            <Plus className="w-3 h-3" />
            Automation
          </button>
          <AIActionBar workspace="engineer" productId={productId} compact />
        </div>
      </div>

      {/* ── Body: two panels ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel (~240px) ──────────────────────────────────────── */}
        <div className="tool-panel-left w-[240px] shrink-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Tab toggle — 4 tabs */}
          <div className="tool-tabs flex border-b border-[var(--border-default)]">
            {([
              { key: "entities" as Tab, icon: <Database className="w-3 h-3" />, label: "Entities", count: entities.length },
              { key: "workflows" as Tab, icon: <GitBranch className="w-3 h-3" />, label: "Workflows", count: workflows.length },
              { key: "automations" as Tab, icon: <Zap className="w-3 h-3" />, label: "Auto", count: automations.length },
              { key: "forms" as Tab, icon: <FileInput className="w-3 h-3" />, label: "Forms", count: forms.length },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`tool-tab flex-1 flex items-center justify-center gap-0.5 h-7 text-[10px] font-medium relative ${
                  tab === t.key
                    ? "text-[var(--accent-text)]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {t.icon}
                {t.label}
                <span className="text-[9px] px-0.5 py-px bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
                  {t.count}
                </span>
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-1">
            {tab === "entities" && (
              <EntityList
                entities={entities}
                selectedId={selection?.kind === "entity" ? selection.id : null}
                onSelect={selectEntity}
                onAdd={addEntity}
              />
            )}
            {tab === "workflows" && (
              <WorkflowList
                workflows={workflows}
                entities={entities}
                selectedId={selection?.kind === "workflow" ? selection.id : null}
                onSelect={selectWorkflow}
                onAdd={addWorkflow}
              />
            )}
            {tab === "automations" && (
              <div className="flex flex-col gap-1">
                {automations.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelection({ kind: "automation", id: a.id })}
                    className={`flex items-start gap-2 p-2 rounded-lg text-left transition-all ${
                      selection?.kind === "automation" && selection.id === a.id
                        ? "bg-white/[0.06] border border-emerald-500/20"
                        : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${a.enabled ? "text-amber-400" : "text-[#64748B]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#F1F5F9] truncate">{a.name}</div>
                      <div className="text-[9px] text-[#64748B]">
                        {a.triggerLabel} · {a.actionCount} action{a.actionCount !== 1 ? "s" : ""}
                        {!a.enabled && <span className="text-red-400 ml-1">disabled</span>}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    const a: AutomationDef = { id: uid(), name: "New Automation", enabled: true, triggerType: "manual", triggerLabel: "Manual", actionCount: 0 };
                    setAutomations((prev) => [...prev, a]);
                    setSelection({ kind: "automation", id: a.id });
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-[#64748B] hover:text-emerald-400 hover:border-emerald-500/20 transition-colors justify-center"
                >
                  <Plus className="w-3 h-3" /> Add Automation
                </button>
              </div>
            )}
            {tab === "forms" && (
              <div className="flex flex-col gap-1">
                {forms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelection({ kind: "form", id: f.id })}
                    className={`flex items-start gap-2 p-2 rounded-lg text-left transition-all ${
                      selection?.kind === "form" && selection.id === f.id
                        ? "bg-white/[0.06] border border-emerald-500/20"
                        : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
                    }`}
                  >
                    <FileInput className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#F1F5F9] truncate">{f.name}</div>
                      <div className="text-[9px] text-[#64748B]">
                        {f.fieldCount} fields · {f.stepCount} step{f.stepCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    const f: FormDef = { id: uid(), name: "New Form", entityId: entities[0]?.id ?? "", fieldCount: 0, stepCount: 1 };
                    setForms((prev) => [...prev, f]);
                    setSelection({ kind: "form", id: f.id });
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-lg border border-dashed border-white/[0.08] text-[11px] text-[#64748B] hover:text-emerald-400 hover:border-emerald-500/20 transition-colors justify-center"
                >
                  <Plus className="w-3 h-3" /> Add Form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel (editor area) ─────────────────────────────────── */}
        <div className="tool-panel-right flex-1 min-w-0 p-2 overflow-y-auto bg-[var(--bg-workspace)]">
          {selectedEntity ? (
            <EntityEditor
              key={`entity-${selectedEntity.id}`}
              entity={selectedEntity}
              allEntities={entities}
              onChange={updateEntity}
              onDelete={deleteEntity}
            />
          ) : selectedWorkflow ? (
            <WorkflowEditor
              key={`workflow-${selectedWorkflow.id}`}
              workflow={selectedWorkflow as any}
              entities={entities}
              onChange={updateWorkflow}
              onDelete={deleteWorkflow}
            />
          ) : selectedAutomation ? (
            /* ── Automation Editor ─────────────────────────────────────── */
            <motion.div key={`auto-${selectedAutomation.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4 h-full overflow-y-auto">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <input value={selectedAutomation.name}
                  onChange={(e) => setAutomations((prev) => prev.map((a) => a.id === selectedAutomation.id ? { ...a, name: e.target.value } : a))}
                  className="text-lg font-semibold bg-transparent text-[#F1F5F9] outline-none border-b border-transparent focus:border-amber-500/40 pb-1 flex-1" />
                <button onClick={() => setAutomations((prev) => prev.map((a) => a.id === selectedAutomation.id ? { ...a, enabled: !a.enabled } : a))}
                  className={`px-2 py-1 rounded text-[10px] font-medium ${selectedAutomation.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {selectedAutomation.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              {/* Trigger config */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Trigger</span>
                <select value={selectedAutomation.triggerType}
                  onChange={(e) => {
                    const labels: Record<string, string> = { entity_created: "Entity Created", entity_updated: "Entity Updated", state_changed: "State Changed", schedule: "Schedule", webhook: "Webhook", manual: "Manual" };
                    setAutomations((prev) => prev.map((a) => a.id === selectedAutomation.id ? { ...a, triggerType: e.target.value, triggerLabel: labels[e.target.value] ?? e.target.value } : a));
                  }}
                  className="w-full bg-white/[0.05] text-sm text-[#94A3B8] rounded-lg px-2 py-1.5 outline-none border border-white/[0.08]">
                  <option value="entity_created" className="bg-[#0c1022]">Entity Created</option>
                  <option value="entity_updated" className="bg-[#0c1022]">Entity Updated</option>
                  <option value="entity_deleted" className="bg-[#0c1022]">Entity Deleted</option>
                  <option value="state_changed" className="bg-[#0c1022]">State Changed</option>
                  <option value="schedule" className="bg-[#0c1022]">Schedule (Cron)</option>
                  <option value="webhook" className="bg-[#0c1022]">Webhook</option>
                  <option value="manual" className="bg-[#0c1022]">Manual</option>
                </select>
              </div>

              {/* Conditions placeholder */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Conditions</span>
                <p className="text-[10px] text-[#64748B]">Add field conditions to filter when this automation runs.</p>
                <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
                  <Plus className="w-3 h-3" /> Add Condition
                </button>
              </div>

              {/* Actions placeholder */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Actions</span>
                <p className="text-[10px] text-[#64748B]">Define what happens when this automation fires.</p>
                <button className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300">
                  <Plus className="w-3 h-3" /> Add Action
                </button>
              </div>

              {/* Delete */}
              <div className="mt-auto pt-4 border-t border-white/[0.06]">
                <button onClick={() => {
                  setAutomations((prev) => prev.filter((a) => a.id !== selectedAutomation.id));
                  setSelection(null);
                }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Automation
                </button>
              </div>
            </motion.div>
          ) : selectedForm ? (
            /* ── Form Editor ───────────────────────────────────────────── */
            <motion.div key={`form-${selectedForm.id}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4 h-full overflow-y-auto">
              <div className="flex items-center gap-3">
                <FileInput className="w-5 h-5 text-blue-400" />
                <input value={selectedForm.name}
                  onChange={(e) => setForms((prev) => prev.map((f) => f.id === selectedForm.id ? { ...f, name: e.target.value } : f))}
                  className="text-lg font-semibold bg-transparent text-[#F1F5F9] outline-none border-b border-transparent focus:border-blue-500/40 pb-1 flex-1" />
              </div>

              {/* Entity binding */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Bound Entity</span>
                <select value={selectedForm.entityId}
                  onChange={(e) => setForms((prev) => prev.map((f) => f.id === selectedForm.id ? { ...f, entityId: e.target.value } : f))}
                  className="w-full bg-white/[0.05] text-sm text-[#94A3B8] rounded-lg px-2 py-1.5 outline-none border border-white/[0.08]">
                  {entities.map((e) => <option key={e.id} value={e.id} className="bg-[#0c1022]">{e.name}</option>)}
                </select>
              </div>

              {/* Form fields */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Form Fields</span>
                  <span className="text-[10px] text-[#64748B]">{selectedForm.fieldCount} fields</span>
                </div>
                {(() => {
                  const ent = entities.find((e) => e.id === selectedForm.entityId);
                  if (!ent) return <p className="text-[10px] text-[#64748B]">Select an entity to see available fields</p>;
                  return (
                    <div className="space-y-1">
                      {ent.fields.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                          <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-white/[0.2]" />
                          <span className="text-[11px] text-[#F1F5F9] flex-1">{f.name}</span>
                          <span className="text-[9px] text-[#64748B] bg-white/[0.04] px-1 py-0.5 rounded">{f.type}</span>
                          <select defaultValue="full" className="bg-white/[0.05] text-[9px] text-[#94A3B8] rounded px-1 py-0.5 outline-none border border-white/[0.08]">
                            <option value="full">Full</option>
                            <option value="half">Half</option>
                            <option value="third">Third</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Steps */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">Form Steps</span>
                  <span className="text-[10px] text-[#64748B]">{selectedForm.stepCount} step{selectedForm.stepCount !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-[10px] text-[#64748B]">Split form fields across multiple wizard steps.</p>
                <button className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300">
                  <Plus className="w-3 h-3" /> Add Step
                </button>
              </div>

              {/* Submit config */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">On Submit</span>
                <select defaultValue="create"
                  className="w-full bg-white/[0.05] text-sm text-[#94A3B8] rounded-lg px-2 py-1.5 outline-none border border-white/[0.08]">
                  <option value="create" className="bg-[#0c1022]">Create Entity</option>
                  <option value="update" className="bg-[#0c1022]">Update Entity</option>
                  <option value="transition" className="bg-[#0c1022]">Trigger Workflow Transition</option>
                </select>
              </div>

              {/* Delete */}
              <div className="mt-auto pt-4 border-t border-white/[0.06]">
                <button onClick={() => {
                  setForms((prev) => prev.filter((f) => f.id !== selectedForm.id));
                  setSelection(null);
                }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Form
                </button>
              </div>
            </motion.div>
          ) : entities.length === 0 && workflows.length === 0 ? (
            <StudioEmptyState
              title="No Workflows Yet"
              description="Model your product's business logic — entities, state machines, forms, and automations. Workflows drive pages, tasks, and approval chains."
              icon={<GitBranch className="w-6 h-6" />}
              createLabel="New Entity"
              onCreate={addEntity}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <GitBranch className="w-4 h-4 text-[var(--text-tertiary)]" />
              <div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">Select an item to edit</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Choose an entity, workflow, automation, or form from the left panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
