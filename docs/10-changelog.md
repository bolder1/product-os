# Changelog

All notable changes to Product OS are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### In Progress

- **Phase 36**: Approvals & Decision Workflows — multi-step approval workflows with conditional routing, decision log, and audit trail
- **Phase 37**: Handoff Specs Enhancement — real-time collaborative spec editor with Yjs CRDT, inline commenting, spec versioning
- **Phase 38**: Release Management & QA Dashboards — release planning, readiness scoring, test coverage dashboards, auto-generated release notes
- **Phase 39**: Canvas & Template Collaboration — multi-page canvas, real-time collaboration, brand token sync, template composer
- **Phase 40**: Real-Time Presence, Analytics & Activity Feed — workspace activity feed, studio presence indicators, analytics dashboard

---

## [0.35.0] — 2026-04-18

### Phase 35: Notifications System Redesign

#### Added

- **Notification Preferences** — per-user, per-event notification settings
  - 7 configurable event types (task assignments, approvals, comments, releases)
  - Channel selection: in-app only, email only, or both
  - Email digest frequency: off, instant, daily, or weekly
  - Stored in new `notification_preferences` table

- **Notifications Inbox Page** — full `/notifications` studio page
  - Filter by event type (All, Task Assigned, Approval Requested, etc.)
  - Date-grouped notification list
  - Mark as read on click
  - Delete individual notifications
  - Unread count from tRPC query

- **Notification Preferences Modal** — accessible from Notifications page header
  - Toggle each event type on/off
  - Select delivery channel per event type
  - Save via `notification.setPreferences` tRPC procedure

- **Enhanced Event Handling** — notifications now sent to affected users
  - Task assignees receive `task_assigned` notifications (not just the creator)
  - Assignment changes trigger notifications to new assignees
  - Multiple target users supported per event

- **tRPC Procedures** — `notification.getPreferences` and `notification.setPreferences`

#### Changed

- Notification inbox is now accessible via sidebar navigation under OPERATE section
- `notificationHandler` updated to resolve multiple target users per event

---

## [0.34.0] — 2026-04-17

### Phase 34: RBAC Role Dashboard

#### Added

- **Home Dashboard** — role-specific landing page (`/home`) for all 8 roles
  - PM/Admin layout: health, stats, readiness, blockers, tasks, approvals, AI insights
  - Business Analyst layout: stats, focus, readiness, activity, tasks, approvals
  - Product Designer layout: design focus, activity, tasks, approvals, blockers
  - Frontend/Backend Dev layouts: health, code focus, tasks, handoff queue, blockers
  - QA layout: stats, QA focus, readiness, tasks, approvals, blockers
  - Viewer layout: health, stats, readiness (read-only)

- **RoleGreeting** — time-aware greeting with role badge and quick-jump studio pills
  - "Good morning/afternoon/evening, {name}"
  - Role-specific taglines (e.g., "Design systems that scale." for Product Designer)
  - Primary studio quick-access buttons per role

- **RoleFocusPanel** — polymorphic panel showing relevant health bars per role
  - Designer: brand, design, component studio health
  - Frontend Dev: components, code studio health
  - Backend Dev: workflow, code studio health
  - QA: test coverage, release readiness, blocker count
  - Business Analyst: overall score and top 3 studio scores

- **MyTasksPanel** — live task list from Zustand store
  - Priority-sorted (critical/urgent → high → medium → low)
  - Inline quick-create form
  - Filter to user's own tasks vs. all open tasks

- **HandoffQueuePanel** — pending handoff items from `trpc.handoff.list`

- **RoleSwitcher** — admin-only dropdown to preview any role's dashboard

#### Changed

- `role-config.ts`: Added `'home'` to all roles' studio access lists
- `sidebar.tsx`: Added HOME section at top of navigation with Home icon
- `studio-icon.tsx`: Added `Home` icon mapping

---

## [0.33.0] — 2026-04-16

### Phase 33: OpsPilot AI Copilot

#### Added

- **OpsPilot floating panel** — AI copilot accessible from bottom-right FAB
  - `Cmd+Shift+O` keyboard shortcut
  - Expandable from 360×500 to 480×640
  - Welcome screen with capability grid and contextual suggestions

- **Chat interface** — multi-turn conversation with the product graph
  - User/assistant message bubbles
  - Full conversation history (last 6 messages sent to AI)
  - Loading states and error handling

- **Intent classification engine** — fast regex-based routing
  - `create_task` — creates tasks in the database
  - `navigate_to` — triggers cross-studio navigation
  - `show_stats` — returns graph statistics
  - `scaffold_nodes` — creates graph nodes from description
  - `run_analysis` / `answer_question` — full AI analysis

- **Action cards** — structured UI cards for each intent outcome
  - Task card with title, priority, and status
  - Navigate button for studio navigation
  - Stats grid for graph health
  - Nodes badge for scaffold results

- **Contextual suggestions** — 4–6 prompts based on current studio and graph state
  - Different suggestions per studio (planner, features, brand, etc.)
  - Empty graph prompts (scaffold, apply template)
  - Missing-node-kind prompts (add features, components, pages)

- **`opsPilot` tRPC router** — `chat` and `getSuggestions` procedures

- **OpsPilot integration** — mounted in dashboard layout when `dbProductId` exists

---

## [0.32.0] — 2026-04-15

### Phase 32: Control Tower Deep Wiring

#### Added

- **`controlTower` tRPC router** — real data from product graph
  - `getHealthSummary` — computes per-studio scores, module readiness, blockers
  - `getAIHealthRecs` — on-demand AI analysis with insight types

- **HealthScore widget** — fully rewritten
  - Live data from `controlTower.getHealthSummary`
  - Animated gauge circle (0–100)
  - Clickable studio bar chart → navigates to studio
  - Color-coded (green/amber/red thresholds)

- **ModuleReadiness panel** — new component
  - Per-module cards with readiness progress bars
  - Feature, page, and entity counts
  - Blocker tags on each module card

- **BlockersPanel** — new component
  - Grouped by severity (error → warning → info)
  - Collapsible accordion groups
  - "Fix" button navigates to relevant studio

- **AiInsights** — fully rewritten
  - 4 states: pre-generate → loading → error → insights
  - Critical/warning/suggestion/positive insight types

---

## [0.31.0] — 2026-04-14

### Phase 31: Template Gallery Full Implementation

#### Added

- **5-step apply modal** — preview → personalise → conflicts → applying → done
- **ConflictPreview** component — per-conflict resolution (Skip/Rename/Overwrite)
- **AiRemixPanel** — context pills + textarea → before/after variable diff
- **TemplateBasket** — multi-template queue with "Apply All" button
- **"My Templates" tab** — products saved as templates
- **Enhanced TemplateCard** — tags, badges, preview count

- **`template.previewConflicts`** — server-side O(1) conflict detection
- **`template.remixWithAI`** — AI-suggested variable overrides for remix
- **`template.saveAsBundle`** — export product graph as reusable template

---

## [0.30.0] — 2026-04-13

### Phase 30: Cross-Studio Deep Linking

#### Added

- **`node-studio-link.ts`** — centralized node kind → studio route mapping
  - `nodeStudioHref(basePath, kind, nodeId)` returns `{ href, label, studio }`

- **Graph Explorer focus** — `?focus={nodeId}` URL param pre-selects a node
- **Features page** — `?nodeId={id}` URL param pre-selects a feature
- **Components page** — `?nodeId={id}` URL param pre-selects a component

- **ViewInGraphLink** — reusable button component for deep-linking to Graph Explorer
  - Available throughout all studios
  - Routes to `/{orgSlug}/{productSlug}/graph-explorer?focus={nodeId}`

- **"Open in Studio" button** — in Graph Explorer node detail panel
  - Shows for every node kind that has a home studio
  - Navigates to the correct studio with the node pre-selected

---

## [0.29.0] — 2026-04-10

### Phase 29: Graph Explorer + Remaining Studios

#### Added

- Analytics studio with metric panels
- Testing studio with test suite tracking
- Graphics studio with asset management
- Graph Explorer with force-directed visualization and node inspection

---

## [0.20.0] — 2026-03-15

### Phase 20: AI Skills Layer

#### Added

- `@product-os/ai` package with `invokeSkill()` function
- Skills: scaffold, suggest, analyze, auto-tag, estimate-effort
- AI skill history logging to `ai_skill_history` table
- Event-triggered AI suggestions via `aiTriggerHandler`

---

## [0.10.0] — 2026-02-01

### Phase 10: Core Platform Foundation

#### Added

- Next.js 15 App Router setup with Turborepo monorepo
- PostgreSQL + Drizzle ORM schema (users, organizations, products, graph)
- tRPC with full type-safety end-to-end
- JWT authentication with session management
- Zustand stores for client state (tasks, notifications, approvals, auth)
- Core studios: Planner, Features, Brand, Components, Design, Workflow, Pages, Code
- Handoff studio and releases studio
- Control Tower (initial version)
- Sidebar navigation with RBAC filtering
- Command Palette (Cmd+K)
- Version panel

---

## [0.1.0] — 2026-01-15

### Initial Release

#### Added

- Project scaffolding with Turborepo + pnpm workspaces
- Database schema design
- Authentication system
- Basic product graph CRUD
- Minimal UI shell (topbar, sidebar)

---

## Planned Phases

| Phase | Feature | Est. Start |
|-------|---------|-----------|
| 36 | Approvals & Decision Workflows | Q2 2026 |
| 37 | Handoff Specs Real-Time Collaboration | Q2 2026 |
| 38 | Release Management & QA Dashboards | Q2 2026 |
| 39 | Canvas & Template Collaboration | Q3 2026 |
| 40 | Activity Feed, Real-Time Presence & Analytics | Q3 2026 |
| 41 | Webhooks & External Integrations | Q3 2026 |
| 42 | Audit Logging & Compliance | Q4 2026 |
