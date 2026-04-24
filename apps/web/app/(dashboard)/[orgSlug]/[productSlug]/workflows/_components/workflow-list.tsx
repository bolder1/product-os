"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, GitBranch, Circle } from "lucide-react";
import type { Workflow, Entity } from "../_data/mock-data";

interface WorkflowListProps {
  workflows: Workflow[];
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export default function WorkflowList({
  workflows,
  entities,
  selectedId,
  onSelect,
  onAdd,
}: WorkflowListProps) {
  const entityName = (id: string) => entities.find((e) => e.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
      <AnimatePresence mode="popLayout">
        {workflows.map((wf, i) => (
          <motion.button
            key={wf.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(wf.id)}
            className={`group w-full text-left px-3 py-3 rounded-lg transition-all ${
              selectedId === wf.id
                ? "bg-white/[0.04] border-l-2 border-emerald-500 pl-2.5"
                : "bg-white/[0.02] hover:bg-white/[0.04] border-l-2 border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">{wf.name}</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[var(--text-secondary)] font-medium">
                <Circle className="w-2.5 h-2.5" />
                {wf.states.length} states
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <GitBranch className="w-3 h-3" />
              {entityName(wf.entityId)}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add Workflow card */}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-white/[0.1] text-[var(--text-tertiary)] text-sm hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mt-1"
      >
        <Plus className="w-4 h-4" />
        Add Workflow
      </button>
    </div>
  );
}
