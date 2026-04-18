# Architecture Overview

Product OS is built on a **five-layer architecture** with a central product graph as the source of truth. Every studio, AI skill, and workflow reads from and writes to this graph.

---

## System Layers

```
Layer 5: Intelligence
  OpsPilot (AI Copilot) · AI Skills · Computer Mode

Layer 4: Publishing
  Releases · Handoff · Changelog · Deploy

Layer 3: Execution
  Tasks · Approvals · Decisions · Notifications

Layer 2: Studios
  27 specialized workspaces (Plan → Build → Ship)

Layer 1: Product Graph
  Typed nodes + edges · Source of truth · AI-navigable
```

---

## Monorepo Package Map

```
product-os/
│
├── apps/
│   ├── web/                       Next.js 15 App Router frontend
│   │   ├── app/(dashboard)/       All studio pages + home
│   │   ├── app/components/shell/  Topbar, Sidebar, OpsPilot
│   │   └── app/lib/               Zustand stores, tRPC client, auth
│   │
│   └── yjs-server/                WebSocket server for real-time collab
│
└── packages/
    ├── api/                       tRPC router + all procedures
    │   └── src/routers/           One file per domain
    ├── ai/                        AI skill invocation (invokeSkill)
    ├── auth/                      JWT + OAuth helpers
    ├── config/                    Shared TypeScript/ESLint configs
    ├── db/                        Drizzle ORM schema + client
    │   └── src/schema/            Split by domain
    ├── events/                    Event bus + domain event handlers
    ├── graph/                     Graph traversal utilities
    ├── templates/                 Template bundle engine
    └── ui/                        Shared React component library
```

---

## The Product Graph

The graph is the heart of Product OS. Every product entity is a **node**, and every relationship is a **typed edge**.

### Node Kinds

| Kind | Studio | Purpose |
|------|--------|---------|
| `module` | Planner | Top-level product area |
| `feature` | Features | Specific capability |
| `page` | Pages | UI screens/routes |
| `component` | Components | Reusable UI parts |
| `token` | Brand | Design tokens (colors, fonts, spacing) |
| `workflow` | Workflow | Business logic flows |
| `entity` | Workflow | Data model entities |
| `handoff_item` | Handoff | Design to dev specs |
| `release` | Releases | Versioned deployments |
| `test_suite` | Testing | Test groupings |
| `analytics_dashboard` | Analytics | Metric views |
| `task` | Tasks | Work items |
| `approval` | Approvals | Review requests |

### Edge Kinds

| Kind | Meaning |
|------|---------|
| `contains` | Parent to child hierarchy |
| `depends_on` | Feature A requires Feature B |
| `references` | Soft link (e.g., page references component) |
| `implements` | Component implements a token spec |
| `triggers` | Workflow A triggers Workflow B |
| `routes_to` | Page A navigates to Page B |
| `uses_token` | Component uses a design token |
| `blocks` | Task A blocks Task B |

---

## Request Flow

### Standard API Request

```
Browser
  → Next.js Component
  → tRPC client (apps/web/app/lib/trpc.ts)
  → HTTP POST /api/trpc/[procedure]
  → tRPC server (packages/api/src/root.ts)
  → Individual router (e.g., packages/api/src/routers/task.ts)
  → Drizzle ORM query
  → PostgreSQL
  → Response back up the chain
```

### AI Skill Request

```
User triggers an AI action (OpsPilot chat, scaffold, suggest)
  → tRPC mutation calls invokeSkill()
  → packages/ai resolves the correct skill handler
  → Builds structured prompt with product graph context
  → Calls Anthropic API (Claude)
  → Parses JSON response
  → Router writes results to graph (scaffold) or returns text (chat)
  → AI interaction logged to ai_skill_history table
```

### Event Flow

```
Mutation occurs (e.g., task created)
  → ctx.eventBus.emit('task.created', { ... })
  → Event dispatched to registered handlers
  → notificationHandler → creates notifications record
  → auditHandler → appends to activity_log
  → aiTriggerHandler → suggests follow-up AI skill
```

---

## State Management

### Server State (tRPC + React Query)

All API data is fetched via tRPC queries/mutations using React Query:
- Automatic caching and invalidation
- `staleTime` configured per query for freshness
- Optimistic updates where needed

### Client State (Zustand)

| Store | Data |
|-------|------|
| `task-store` | All tasks for current product |
| `notification-store` | Notifications + unread count |
| `approval-store` | Approval requests |
| `graph-store` | Graph nodes cache |
| `auth-store` | Current user session |
| `command-palette-store` | Search palette state |
| `version-store` | Version panel state |

---

## Authentication Architecture

```
User Login
  → POST /api/trpc/auth.login
  → Validates email + password hash (bcrypt)
  → Creates sessions row (token, expiresAt)
  → Returns token to client
  → Stored in localStorage via auth-store

Subsequent requests
  → auth-store injects Authorization: Bearer <token>
  → createTRPCContext validates token + expiry
  → Attaches { userId, orgId, role } to context
```

---

## Security Model

### RBAC

All API procedures check user role against the resource organization. The `role` from the session determines access.

| Org Role | Studio Access |
|----------|---------------|
| `owner` / `admin` | Full access to all studios |
| `editor` | Read + write on role-specific studios |
| `viewer` | Read-only on dashboards and analytics |

### Data Isolation

All graph data is scoped by `productId`. API procedures enforce that the requesting user belongs to the organization. Cross-organization data access is prevented at the query level.

---

## Performance

| Metric | Target | Approach |
|--------|--------|---------|
| Graph query (100 nodes) | < 10ms | Indexed productId + kind |
| AI skill invocation | 1–5s | Streamed responses |
| Notification delivery | < 500ms | Event bus async |
| Page load (initial) | < 2s | Next.js + SSR |

---

## Deployment Topology

```
CDN (Vercel / Cloudflare)
        |
  Next.js App (apps/web)
        |  tRPC
  API Server (packages/api)
        |  Drizzle ORM
  PostgreSQL (Supabase / RDS)

  Yjs Server (apps/yjs-server)  -- WebSocket for real-time collab
```

---

## Design Principles

1. **Graph-first** — Every product entity is a graph node. All studios are views into the same underlying graph.
2. **AI-first** — AI capabilities are first-class. Every studio has at minimum one AI-assisted action.
3. **Event-driven** — Side effects (notifications, audit logs, AI suggestions) happen via event handlers, not inline code.
4. **Role-aware** — The UI adapts completely to the viewer role. No generic dashboards.
5. **Type-safe end-to-end** — TypeScript, Zod, tRPC, and Drizzle ORM provide full type safety from database to browser.
