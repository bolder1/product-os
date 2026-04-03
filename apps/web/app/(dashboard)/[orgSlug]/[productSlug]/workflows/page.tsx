"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Database, GitBranch, Plus, Sparkles } from "lucide-react";
import {
  INITIAL_ENTITIES,
  INITIAL_WORKFLOWS,
  uid,
  type Entity,
  type Workflow,
} from "./_data/mock-data";
import { useGraphStore } from "../../../../lib/graph-store";
import EntityList from "./_components/entity-list";
import EntityEditor from "./_components/entity-editor";
import WorkflowList from "./_components/workflow-list";
import WorkflowEditor from "./_components/workflow-editor";
import { StudioHealthBadge } from "../../../../components/shared/studio-health-badge";

type Tab = "entities" | "workflows";
type Selection =
  | { kind: "entity"; id: string }
  | { kind: "workflow"; id: string }
  | null;

export default function WorkflowBuilderPage() {
  const params = useParams<{ productSlug: string }>();
  const productId = params.productSlug;

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

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Top Toolbar (32px) ─────────────────────────────────────────── */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">Workflow Builder</span>
          <StudioHealthBadge productId={productId} studio="workflows" />
          <span className="text-[10px] text-[var(--text-tertiary)] leading-none ml-1">
            {entities.length} entities / {workflows.length} workflows
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
            onClick={aiGenerate}
            className="tool-btn flex items-center gap-1 px-2 h-[22px] bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent-text)] text-[11px] font-medium hover:bg-[var(--accent)]/20"
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </button>
        </div>
      </div>

      {/* ── Body: two panels ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel (~240px) ──────────────────────────────────────── */}
        <div className="tool-panel-left w-[240px] shrink-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Tab toggle */}
          <div className="tool-tabs flex border-b border-[var(--border-default)]">
            <button
              onClick={() => setTab("entities")}
              className={`tool-tab flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium relative ${
                tab === "entities"
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Database className="w-3 h-3" />
              Entities
              <span className="text-[10px] px-1 py-px bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
                {entities.length}
              </span>
              {tab === "entities" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent)]" />
              )}
            </button>
            <button
              onClick={() => setTab("workflows")}
              className={`tool-tab flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium relative ${
                tab === "workflows"
                  ? "text-[var(--accent-text)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <GitBranch className="w-3 h-3" />
              Workflows
              <span className="text-[10px] px-1 py-px bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
                {workflows.length}
              </span>
              {tab === "workflows" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent)]" />
              )}
            </button>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-1">
            {tab === "entities" ? (
              <EntityList
                entities={entities}
                selectedId={selection?.kind === "entity" ? selection.id : null}
                onSelect={selectEntity}
                onAdd={addEntity}
              />
            ) : (
              <WorkflowList
                workflows={workflows}
                entities={entities}
                selectedId={selection?.kind === "workflow" ? selection.id : null}
                onSelect={selectWorkflow}
                onAdd={addWorkflow}
              />
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
              workflow={selectedWorkflow}
              entities={entities}
              onChange={updateWorkflow}
              onDelete={deleteWorkflow}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <GitBranch className="w-4 h-4 text-[var(--text-tertiary)]" />
              <div>
                <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">Select an item to edit</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Choose an entity or workflow from the left panel, or create a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
