-- Ground — full schema.
--
-- Idempotent: safe to run against an empty database or an existing one.
--   psql "$DATABASE_URL" -f packages/ground/schema.sql
--
-- Five tables. If a sixth appears, something has gone wrong.

create extension if not exists "pgcrypto";

-- ── Accounts ──────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Every request resolves a session by token, so this is the hot path.
create index if not exists sessions_token_idx on sessions (token);
-- Postgres does not index foreign keys automatically; without this the
-- cascade from a deleted user scans the whole table.
create index if not exists sessions_user_idx on sessions (user_id);

-- ── Workspaces ────────────────────────────────────────────────────
create table if not exists workspaces (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references users(id) on delete cascade,
  name       text not null,
  slug       text not null unique,
  -- Bearer token the MCP server authenticates with. One per workspace.
  mcp_token  text not null unique,
  -- An entry not confirmed within this many days counts as drifted.
  stale_after_days integer not null default 90,
  created_at timestamptz not null default now(),

  constraint workspaces_stale_after_days_positive check (stale_after_days > 0)
);

create index if not exists workspaces_owner_idx on workspaces (owner_id);

-- ── Context entries ───────────────────────────────────────────────
do $$ begin
  create type entry_kind as enum ('decision', 'constraint', 'convention', 'glossary', 'nongoal');
exception when duplicate_object then null;
end $$;

create table if not exists entries (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  kind              entry_kind not null,
  title             text not null,
  body              text not null default '',
  -- Kind-specific required fields, e.g. {"chose": "...", "because": "..."}.
  fields            jsonb not null default '{}'::jsonb,
  -- Visible ageing is the feature: this is what makes drift detectable.
  last_confirmed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint entries_title_not_blank check (length(btrim(title)) > 0)
);

-- Searching "retry" must find an entry about "retries", so the vector is
-- stemmed rather than matched with LIKE. Stored and generated, so it is
-- computed on write instead of on every row at query time.
alter table entries
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', title || ' ' || body || ' ' || fields::text)
  ) stored;

create index if not exists entries_search_idx    on entries using gin (search_vector);
create index if not exists entries_workspace_idx on entries (workspace_id);
create index if not exists entries_confirmed_idx on entries (workspace_id, last_confirmed_at desc);

-- ── Agent reads ───────────────────────────────────────────────────
-- Every MCP read is logged, so the app can show an agent actually used it.
create table if not exists agent_queries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool         text not null,
  query        text,
  result_count integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists agent_queries_workspace_idx
  on agent_queries (workspace_id, created_at desc);

-- Which entries a query actually returned. agent_queries records the question;
-- this records the answer, so the app can say when an entry was last relied on
-- and which entries nothing has ever asked for.
create table if not exists agent_reads (
  id         uuid primary key default gen_random_uuid(),
  query_id   uuid not null references agent_queries(id) on delete cascade,
  entry_id   uuid not null references entries(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agent_reads_entry_idx on agent_reads (entry_id, created_at desc);
create index if not exists agent_reads_query_idx on agent_reads (query_id);

-- ── Row-level security ────────────────────────────────────────────
-- Ground connects as the table owner over a direct Postgres connection, which
-- bypasses RLS. Enabling it with no policies therefore changes nothing for the
-- app while closing off the anon and authenticated roles that Supabase client
-- libraries use — so an exposed publishable key reads nothing.
alter table users         enable row level security;
alter table sessions      enable row level security;
alter table workspaces    enable row level security;
alter table entries       enable row level security;
alter table agent_queries enable row level security;
alter table agent_reads   enable row level security;
