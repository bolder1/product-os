"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, GitBranch, Plus, Sparkles } from "lucide-react";
import {
  INITIAL_ENTITIES,
  INITIAL_WORKFLOWS,
  uid,
  type Entity,
  type Workflow,
} from "./_data/mock-data";
import EntityList from "./_components/entity-list";
import EntityEditor from "./_components/entity-editor";
import WorkflowList from "./_components/workflow-list";
import WorkflowEditor from "./_components/workflow-editor";

type Tab = "entities" | "workflows";
type Selection =
  | { kind: "entity"; id: string }
  | { kind: "workflow"; id: string }
  | null;

export default function WorkflowBuilderPage() {
  const [tab, setTab] = useState<Tab>("entities");
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [selection, setSelection] = useState<Selection>(null);

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
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <GitBranch className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <h1 className="text-lg font-semibold text-[#F1F5F9]">Workflow Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addEntity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] text-sm hover:bg-white/[0.08] hover:text-[#F1F5F9] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Entity
          </button>
          <button
            onClick={addWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] text-sm hover:bg-white/[0.08] hover:text-[#F1F5F9] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workflow
          </button>
          <button
            onClick={aiGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </button>
        </div>
      </div>

      {/* ── Body: two panels ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left panel (~35%) ──────────────────────────────────────────── */}
        <div className="w-[35%] shrink-0 flex flex-col border-r border-white/[0.06]">
          {/* Tab toggle */}
          <div className="flex border-b border-white/[0.06]">
            <button
              onClick={() => setTab("entities")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                tab === "entities"
                  ? "text-emerald-400"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              <Database className="w-4 h-4" />
              Entities
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
                {entities.length}
              </span>
              {tab === "entities" && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
            <button
              onClick={() => setTab("workflows")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                tab === "workflows"
                  ? "text-emerald-400"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Workflows
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
                {workflows.length}
              </span>
              {tab === "workflows" && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {tab === "entities" ? (
                <motion.div
                  key="entities-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <EntityList
                    entities={entities}
                    selectedId={selection?.kind === "entity" ? selection.id : null}
                    onSelect={selectEntity}
                    onAdd={addEntity}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="workflows-list"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <WorkflowList
                    workflows={workflows}
                    entities={entities}
                    selectedId={selection?.kind === "workflow" ? selection.id : null}
                    onSelect={selectWorkflow}
                    onAdd={addWorkflow}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right panel (~65%) ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
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
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-4 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <GitBranch className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[#F1F5F9] font-medium mb-1">Select an item to edit</p>
                  <p className="text-sm text-[#64748B]">
                    Choose an entity or workflow from the left panel, or create a new one.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
