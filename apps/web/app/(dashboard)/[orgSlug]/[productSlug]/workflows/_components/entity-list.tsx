"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Database } from "lucide-react";
import type { Entity } from "../_data/mock-data";

interface EntityListProps {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export default function EntityList({ entities, selectedId, onSelect, onAdd }: EntityListProps) {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1">
      <AnimatePresence mode="popLayout">
        {entities.map((entity, i) => (
          <motion.button
            key={entity.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(entity.id)}
            className={`group w-full text-left px-3 py-3 rounded-lg transition-all ${
              selectedId === entity.id
                ? "bg-white/[0.04] border-l-2 border-emerald-500 pl-2.5"
                : "bg-white/[0.02] hover:bg-white/[0.04] border-l-2 border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#F1F5F9]">{entity.name}</span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8] font-medium">
                <Database className="w-2.5 h-2.5" />
                {entity.fields.length} fields
              </span>
            </div>
            <p className="text-xs text-[#64748B] line-clamp-1">{entity.description}</p>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Add Entity card */}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-white/[0.1] text-[#64748B] text-sm hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mt-1"
      >
        <Plus className="w-4 h-4" />
        Add Entity
      </button>
    </div>
  );
}
