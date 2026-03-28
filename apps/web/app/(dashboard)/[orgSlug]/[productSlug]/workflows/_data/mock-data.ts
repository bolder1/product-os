// ── Types ──────────────────────────────────────────────────────────────────

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "enum"
  | "relation"
  | "json";

export interface Relation {
  id: string;
  name: string;
  targetEntityId: string;
  cardinality: Cardinality;
}

export type Cardinality = "has_one" | "has_many" | "belongs_to" | "many_to_many";

export interface Entity {
  id: string;
  name: string;
  description: string;
  fields: Field[];
  relations: Relation[];
}

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  type: "initial" | "normal" | "final";
}

export interface WorkflowTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  trigger: string;
}

export interface Workflow {
  id: string;
  name: string;
  entityId: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

// ── Helper ─────────────────────────────────────────────────────────────────

let _counter = 100;
export function uid(): string {
  return `id_${Date.now()}_${++_counter}`;
}

// ── Mock Entities ──────────────────────────────────────────────────────────

export const INITIAL_ENTITIES: Entity[] = [
  {
    id: "ent_user",
    name: "User",
    description: "Application user account with role-based access.",
    fields: [
      { id: "f1", name: "name", type: "text", required: true },
      { id: "f2", name: "email", type: "email", required: true },
      { id: "f3", name: "role", type: "enum", required: true },
      { id: "f4", name: "avatar", type: "url", required: false },
      { id: "f5", name: "createdAt", type: "date", required: true },
    ],
    relations: [],
  },
  {
    id: "ent_project",
    name: "Project",
    description: "Top-level container for work streams.",
    fields: [
      { id: "f6", name: "name", type: "text", required: true },
      { id: "f7", name: "description", type: "text", required: false },
      { id: "f8", name: "status", type: "enum", required: true },
      { id: "f9", name: "startDate", type: "date", required: false },
      { id: "f10", name: "endDate", type: "date", required: false },
      { id: "f11", name: "budget", type: "number", required: false },
    ],
    relations: [
      { id: "r1", name: "owner", targetEntityId: "ent_user", cardinality: "belongs_to" },
    ],
  },
  {
    id: "ent_task",
    name: "Task",
    description: "Individual work item within a project.",
    fields: [
      { id: "f12", name: "title", type: "text", required: true },
      { id: "f13", name: "description", type: "text", required: false },
      { id: "f14", name: "priority", type: "enum", required: true },
      { id: "f15", name: "status", type: "enum", required: true },
      { id: "f16", name: "dueDate", type: "date", required: false },
      { id: "f17", name: "estimate", type: "number", required: false },
    ],
    relations: [
      { id: "r2", name: "assignee", targetEntityId: "ent_user", cardinality: "belongs_to" },
      { id: "r3", name: "project", targetEntityId: "ent_project", cardinality: "belongs_to" },
    ],
  },
  {
    id: "ent_comment",
    name: "Comment",
    description: "User comment attached to any entity.",
    fields: [
      { id: "f18", name: "body", type: "text", required: true },
      { id: "f19", name: "createdAt", type: "date", required: true },
      { id: "f20", name: "edited", type: "boolean", required: false },
      { id: "f21", name: "metadata", type: "json", required: false },
    ],
    relations: [
      { id: "r4", name: "author", targetEntityId: "ent_user", cardinality: "belongs_to" },
      { id: "r5", name: "task", targetEntityId: "ent_task", cardinality: "belongs_to" },
    ],
  },
];

// ── Mock Workflows ─────────────────────────────────────────────────────────

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: "wf_task",
    name: "Task Lifecycle",
    entityId: "ent_task",
    states: [
      { id: "s1", name: "Backlog", color: "#3B82F6", type: "initial" },
      { id: "s2", name: "Todo", color: "#94A3B8", type: "normal" },
      { id: "s3", name: "In Progress", color: "#F59E0B", type: "normal" },
      { id: "s4", name: "In Review", color: "#A855F7", type: "normal" },
      { id: "s5", name: "Done", color: "#10B981", type: "final" },
    ],
    transitions: [
      { id: "t1", fromStateId: "s1", toStateId: "s2", trigger: "schedule" },
      { id: "t2", fromStateId: "s2", toStateId: "s3", trigger: "start" },
      { id: "t3", fromStateId: "s3", toStateId: "s4", trigger: "submit" },
      { id: "t4", fromStateId: "s4", toStateId: "s5", trigger: "approve" },
      { id: "t5", fromStateId: "s4", toStateId: "s3", trigger: "reject" },
      { id: "t6", fromStateId: "s5", toStateId: "s1", trigger: "reopen" },
    ],
  },
  {
    id: "wf_project",
    name: "Project Lifecycle",
    entityId: "ent_project",
    states: [
      { id: "s6", name: "Draft", color: "#3B82F6", type: "initial" },
      { id: "s7", name: "Planning", color: "#94A3B8", type: "normal" },
      { id: "s8", name: "Active", color: "#F59E0B", type: "normal" },
      { id: "s9", name: "On Hold", color: "#EF4444", type: "normal" },
      { id: "s10", name: "Completed", color: "#10B981", type: "final" },
    ],
    transitions: [
      { id: "t7", fromStateId: "s6", toStateId: "s7", trigger: "plan" },
      { id: "t8", fromStateId: "s7", toStateId: "s8", trigger: "activate" },
      { id: "t9", fromStateId: "s8", toStateId: "s9", trigger: "pause" },
      { id: "t10", fromStateId: "s9", toStateId: "s8", trigger: "resume" },
      { id: "t11", fromStateId: "s8", toStateId: "s10", trigger: "complete" },
    ],
  },
];
