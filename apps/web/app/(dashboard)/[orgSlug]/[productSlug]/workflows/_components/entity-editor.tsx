"use client";

import { motion } from "framer-motion";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import type { Entity, Field, FieldType, Relation, Cardinality } from "../_data/mock-data";
import { uid } from "../_data/mock-data";
import { ViewInGraphLink } from "../../../../../components/shared/view-in-graph-link";

interface EntityEditorProps {
  entity: Entity;
  allEntities: Entity[];
  onChange: (entity: Entity) => void;
  onDelete: (id: string) => void;
}

const FIELD_TYPES: FieldType[] = [
  "text", "number", "boolean", "date", "email", "url", "enum", "relation", "json",
];
const CARDINALITIES: Cardinality[] = ["has_one", "has_many", "belongs_to", "many_to_many"];

export default function EntityEditor({ entity, allEntities, onChange, onDelete }: EntityEditorProps) {
  const update = (patch: Partial<Entity>) => onChange({ ...entity, ...patch });

  const updateField = (idx: number, patch: Partial<Field>) => {
    const fields = entity.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    update({ fields });
  };

  const addField = () => {
    update({
      fields: [
        ...entity.fields,
        { id: uid(), name: "", type: "text", required: false },
      ],
    });
  };

  const removeField = (idx: number) => {
    update({ fields: entity.fields.filter((_, i) => i !== idx) });
  };

  const updateRelation = (idx: number, patch: Partial<Relation>) => {
    const relations = entity.relations.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    update({ relations });
  };

  const addRelation = () => {
    const targetId = allEntities.find((e) => e.id !== entity.id)?.id ?? "";
    update({
      relations: [
        ...entity.relations,
        { id: uid(), name: "", targetEntityId: targetId, cardinality: "belongs_to" },
      ],
    });
  };

  const removeRelation = (idx: number) => {
    update({ relations: entity.relations.filter((_, i) => i !== idx) });
  };

  return (
    <motion.div
      key={entity.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 h-full overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            value={entity.name}
            onChange={(e) => update({ name: e.target.value })}
            className="flex-1 text-xl font-semibold bg-transparent text-[var(--text-primary)] outline-none border-b border-transparent focus:border-emerald-500/40 pb-1 transition-colors"
            placeholder="Entity name"
          />
          <ViewInGraphLink nodeId={entity.id} />
        </div>
        <textarea
          value={entity.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          className="text-sm bg-white/[0.03] rounded-lg border border-white/[0.08] p-3 text-[var(--text-secondary)] outline-none resize-none focus:border-emerald-500/40 transition-colors"
          placeholder="Entity description..."
        />
      </div>

      {/* Fields table */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Fields</h3>
        <div className="rounded-lg border border-white/[0.08] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_130px_60px_36px] gap-2 px-3 py-2 bg-white/[0.04] text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Name</span>
            <span>Type</span>
            <span className="text-center">Required</span>
            <span />
          </div>
          {entity.fields.map((field, idx) => (
            <div
              key={field.id}
              className={`grid grid-cols-[1fr_130px_60px_36px] gap-2 px-3 py-2 items-center ${
                idx % 2 === 0 ? "bg-white/[0.01]" : "bg-white/[0.03]"
              }`}
            >
              <input
                value={field.name}
                onChange={(e) => updateField(idx, { name: e.target.value })}
                className="bg-transparent text-sm text-[var(--text-primary)] outline-none"
                placeholder="field_name"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                className="bg-white/[0.05] text-sm text-[var(--text-secondary)] rounded px-1 py-0.5 outline-none border border-white/[0.08]"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[var(--bg-inset)]">
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(idx, { required: e.target.checked })}
                  className="accent-emerald-500 w-3.5 h-3.5"
                />
              </label>
              <button
                onClick={() => removeField(idx)}
                className="flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addField}
          className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-emerald-400 transition-colors self-start mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Field
        </button>
      </div>

      {/* Relations */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Relations</h3>
        <div className="flex flex-col gap-2">
          {entity.relations.map((rel, idx) => (
            <div
              key={rel.id}
              className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.08] rounded-lg px-3 py-2"
            >
              <input
                value={rel.name}
                onChange={(e) => updateRelation(idx, { name: e.target.value })}
                className="bg-transparent text-sm text-[var(--text-primary)] outline-none w-28"
                placeholder="name"
              />
              <select
                value={rel.targetEntityId}
                onChange={(e) => updateRelation(idx, { targetEntityId: e.target.value })}
                className="bg-white/[0.05] text-sm text-[var(--text-secondary)] rounded px-1.5 py-0.5 outline-none border border-white/[0.08] flex-1"
              >
                {allEntities
                  .filter((e) => e.id !== entity.id)
                  .map((e) => (
                    <option key={e.id} value={e.id} className="bg-[var(--bg-inset)]">
                      {e.name}
                    </option>
                  ))}
              </select>
              <select
                value={rel.cardinality}
                onChange={(e) => updateRelation(idx, { cardinality: e.target.value as Cardinality })}
                className="bg-white/[0.05] text-sm text-[var(--text-secondary)] rounded px-1.5 py-0.5 outline-none border border-white/[0.08]"
              >
                {CARDINALITIES.map((t) => (
                  <option key={t} value={t} className="bg-[var(--bg-inset)]">
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeRelation(idx)}
                className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addRelation}
          className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-emerald-400 transition-colors self-start mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Relation
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
          <Save className="w-4 h-4" /> Save Entity
        </button>
        <button
          onClick={() => onDelete(entity.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors ml-auto"
        >
          <AlertTriangle className="w-4 h-4" /> Delete
        </button>
      </div>
    </motion.div>
  );
}
