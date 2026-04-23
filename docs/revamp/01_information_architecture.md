# Revamp R1 — Information Architecture

_Deliverable for Phase R1 of the Product OS design revamp._
_Status: draft — awaiting approval before R2._

## Goal

Redraw the Product OS information architecture so that **the graph is the spine, studios are lenses, and AI is embedded**. Reduce today's 8 workspaces × 36 studios to **5 Modes × ~5 studios each + 5 persistent rails**, without losing any real capability.

## Principles

1. **Graph as spine, studios as lenses.** Navigation is organized around phases of work (Modes), not tool names.
2. **Solo builder + AI first.** Default Role = Solo Builder; every surface has Copilot one click away.
3. **One concept, one door.** Merge fractured surfaces (Brand, Extensions, Work).
4. **Intelligence is a Mode.** AI/MCP/Skills/Computer Log live together as configuration + monitoring; conversation happens in the Copilot rail.
5. **Retire redundant routes.** Every retirement redirects, nothing breaks silently.

---

## Target IA

### Topbar (global)

```
[ Org / Product ▾ ]   [ Role: Solo Builder ▾ ]   [ Mode: Plan ▾ ]   ⌘K   🔔   ◎ Copilot
```

- **Org / Product** — existing breadcrumb, extended with switcher
- **Role** — Solo Builder (default) · Admin · Manager · BA · QA · Designer · Frontend · Backend
- **Mode** — Plan · Build · Ship · Operate · Intelligence
- **⌘K** — command palette (extended in R8 with graph queries)
- **🔔** — notifications (surface, not only dropdown — R4 roll-up)
- **◎ Copilot** — toggle right rail

### Modes × Studios (target)

| Plan           | Build        | Ship       | Operate       | Intelligence    |
|----------------|--------------|------------|---------------|-----------------|
| Workspace      | Workspace    | Releases   | Control Tower | Copilot Home    |
| Planner        | Design       | Testing    | Work          | Skills          |
| Canvas         | Components   | Handoff    | Analytics     | Extensions      |
| Roadmap        | Pages        | Code       | Decisions     | Computer Log    |
| Memory         | Brand        |            |               | Graph Config    |
|                | Workflows    |            |               |                 |
|                | Graphics     |            |               |                 |

**Counts:** 5 · 7 · 4 · 4 · 5 = **25 studios** (was 36). Three studios appear as shared items (Workspace, Living Graph, Memory) — see Persistent Rails.

### Persistent Rails

**Bottom rail** (available across every Mode):
- **Memory** — knowledge + RAG retrieval, cross-cutting context
- **Living Graph** — split-pane overlay on any studio (R8)
- **Extensions** — quick access to installed connectors/MCP/skills
- **Decisions** — decision log surfaced as a rail (shows related decisions for the current object)
- **Work Inbox** — tasks/approvals quick-access drawer

**Right rail** (toggle, persistent across Modes):
- **Copilot thread** (R9) — conversational AI, context-aware
- **Inspector** (R8) — graph context + impact preview for the selected object
- **Computer Mode preview** (R10) — pending AI drafts awaiting approval

---

## Route Map — Before vs After

### New routes (created)

| Route | Purpose |
|-------|---------|
| `/workspace` | Solo-Builder landing (replaces `/home`) |
| `/intelligence` | Intelligence Mode landing |
| `/intelligence/copilot` | Copilot Home (threads, memory scope, pinned prompts) |
| `/intelligence/skills` | AI skill registry |
| `/intelligence/extensions` | Connectors + MCP merged |
| `/intelligence/computer-log` | Immutable Computer Mode action history |
| `/intelligence/graph-config` | Validation rules, readiness scoring, event-bus topics |
| `/operate/work` | Unified Work (tasks + approvals + features) |

### Routes that stay (unchanged path, possibly re-grouped in sidebar)

Plan Mode: `/planner`, `/canvas`, `/roadmap`, `/memory`
Build Mode: `/design`, `/components`, `/pages`, `/brand`, `/workflows`, `/graphics`
Ship Mode: `/releases`, `/testing`, `/handoff`, `/code`
Operate Mode: `/control-tower`, `/analytics`, `/decisions`
Global: `/graph` (Living Graph), `/notifications`

### Routes that retire (redirect, not delete)

| Old route | Redirects to | Reason |
|-----------|--------------|--------|
| `/home` | `/workspace` | Rename + rebuild as Solo-Builder landing (R4) |
| `/graph-explorer` | `/graph` | Merged into Living Graph |
| `/brand/voice` | `/brand?tab=voice` | Brand merge (R5) |
| `/brand-compliance` | `/brand?tab=compliance` | Brand merge (R5) |
| `/ai-skills` | `/intelligence/skills` | Moved under Intelligence Mode |
| `/connectors` | `/intelligence/extensions` | Extensions merge (R6) |
| `/tasks` | `/operate/work?view=tasks` | Work merge (R7) |
| `/approvals` | `/operate/work?view=approvals` | Work merge (R7) |
| `/features` | `/operate/work?view=features` | Work merge (R7) |
| `/templates` | remains, but accessible from every Create flow | Templates are a pattern, not a destination |
| `/agenda` | absorbed into `/workspace` (timeline widget) | Home-level concept |

### Agenda — decision

Today's `/agenda` is a timeline of upcoming work. It's not a creation surface. **Decision:** absorb into `/workspace` as a "What's next" widget. Retire the route.

### Templates — decision

Today's `/templates` is a browser + apply wizard. Templates should be accessible from any Create action across Modes, not a standalone destination. **Decision:** keep the route for now as a directory/browser, but demote from sidebar — surface inside every "+ Create" flow via Templates drawer. Revisit in R12.

---

## Mode Definitions

Each Mode has a purpose, an entry surface, and a typical cadence.

### Plan Mode
**Purpose:** define what we're building and why.
**Entry:** `/workspace` → Planner.
**Typical studios:** Planner (7-step intent capture — upgrade in R12), Canvas (strategy + sitemap), Roadmap (release timeline), Memory (knowledge base).
**Cadence:** early-project heavy, then weekly revisit.

### Build Mode
**Purpose:** create the product surfaces.
**Entry:** `/workspace` → Design or Pages.
**Typical studios:** Design, Components, Pages, Brand, Workflows, Graphics.
**Cadence:** daily, for designers + devs.

### Ship Mode
**Purpose:** move work from Build into production.
**Entry:** `/workspace` → Handoff or Releases.
**Typical studios:** Handoff, Code, Testing, Releases.
**Cadence:** release-bound; quiet between releases.

### Operate Mode
**Purpose:** run what's shipped.
**Entry:** `/workspace` → Control Tower.
**Typical studios:** Control Tower, Work (tasks/approvals/features), Analytics, Decisions.
**Cadence:** daily, post-launch.

### Intelligence Mode
**Purpose:** configure and monitor AI.
**Entry:** `/intelligence` → Copilot Home.
**Typical studios:** Copilot Home, Skills, Extensions, Computer Log, Graph Config.
**Cadence:** infrequent — setup + audit, not daily work.
**Important:** Intelligence Mode is where AI is **configured**, not where you **talk to it**. Conversation = Copilot rail, everywhere.

---

## Role × Mode Visibility Matrix

What sidebar each role sees per Mode. Empty cells = Mode not applicable for that role (hidden from switcher).

| Role / Mode      | Plan | Build | Ship | Operate | Intelligence |
|------------------|------|-------|------|---------|--------------|
| Solo Builder     | ✓ all | ✓ all | ✓ all | ✓ all | ✓ all |
| Admin            | ✓ | ✓ | ✓ | ✓ | ✓ (incl. Graph Config) |
| Manager / PO     | ✓ | ✓ read | ✓ read | ✓ | ✓ Copilot/Skills read |
| Business Analyst | Canvas, Memory | Workflows | — | Work, Analytics | Copilot, Skills |
| QA               | Memory | — | Testing, Handoff read | Work | Copilot, Skills |
| Designer         | Canvas, Memory | Design, Brand, Components, Pages, Graphics | Handoff read | Work | Copilot |
| Frontend Dev     | Memory | Components, Pages, Design read | Handoff, Code | Work | Copilot, Extensions |
| Backend Dev      | Memory | Workflows | Handoff, Code | Work | Copilot, Extensions |

- Solo Builder is the universal role (default) — sees everything, minimal permissions gate.
- Read-only access indicated by "read" — studio is visible but write actions are gated.
- Computer Log + Graph Config are Admin-only by default.

---

## Persistent Rails — Behavior

### Bottom rail

- Fixed to the bottom edge, ~28px tall, icon + label.
- **Memory** opens a slide-up panel with search + upload, no route change.
- **Living Graph** toggles a split pane on the current studio (R8) — not a route.
- **Extensions** shows a quick-switch drawer of installed items; "Manage" deep-links to `/intelligence/extensions`.
- **Decisions** shows decisions related to the current object (R18 fix — Decisions surface context-aware); "Manage" deep-links to `/decisions`.
- **Work Inbox** shows tasks/approvals assigned to current user; deep-links to `/operate/work`.

### Right rail

- Fixed to the right edge, ~360px when open, collapsible to ~48px rail with icons.
- **Copilot** — default open on first run, remembers last state per-user.
- **Inspector** — automatically focuses on the currently-selected graph object.
- **Computer Mode preview** — only visible when pending drafts exist; badge count on the rail.

---

## Unified Surfaces — Tab Layouts

### Brand (`/brand`) — R5
- **Foundations** — colors, typography, spacing, effects (today's `/brand`)
- **Voice** — personality, tone sliders, dos/don'ts, live preview (today's `/brand/voice`)
- **Compliance** — checker + drift flags (today's `/brand-compliance`)

Shared: header, breadcrumb, AI action surface, `useBrandVoiceStore` + brand-foundations store.

### Extensions (`/intelligence/extensions`) — R6
- **Connectors** — Figma, GitHub, Slack, Jira, Linear, Google Analytics, etc.
- **MCP Servers** — pluggable external intelligence
- **Skills** — AI actions (registry, install, enable)

Shared: install flow, permissions model, health view, action log.

### Work (`/operate/work`) — R7
- **View modes** — Kanban · List · Timeline (selected via URL param)
- **Type filter** — Tasks · Approvals · Features (checkboxes; by default all three)
- **Role filter** — scoped to current role in topbar; override via filter chip
- **Studio filter** — scoped by studio of origin

---

## Deprecations (code-level, executed across R5–R10)

| Artifact | Action | Phase |
|----------|--------|-------|
| `components/shell/activity-bar.tsx` | Delete | R3 |
| `.tool-btn`, `.tool-btn-primary` CSS classes | Remove from `globals.css`, migrate call sites to `<Button>` | R2 |
| `.tool-input` CSS class | Remove, migrate call sites to `<Input>` | R2 |
| `components/primitives/ai-action-bar.tsx` | Replace with Copilot scoped context | R9 |
| `components/primitives/ai-assistant-panel.tsx` | Folded into Copilot | R9 |
| `components/primitives/ai-remix-engine.tsx` | Folded into Copilot skills | R9 |
| `components/primitives/ops-pilot.tsx` | Folded into Copilot skills | R9 |
| `/graph-explorer` route | Redirect to `/graph` | R8 |
| `/brand/voice`, `/brand-compliance` | Tabs inside `/brand` | R5 |
| `/ai-skills`, `/connectors` | Under `/intelligence` | R6 |
| `/tasks`, `/approvals`, `/features` | Views inside `/operate/work` | R7 |
| `/agenda` | Widget inside `/workspace` | R4 |
| `/home` | Rename to `/workspace` | R4 |

All route retirements are **redirects**, not deletions, so external links don't break.

---

## Visual Map (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Org/Product]  [Role]  [Mode]              ⌘K  🔔  ◎Copilot            │  ← Topbar
├───────────────┬─────────────────────────────────────────┬───────────────┤
│ Sidebar       │                                         │ Right rail    │
│ (Mode-driven) │           Studio content                │ (toggle)      │
│               │                                         │               │
│ Workspace     │                                         │ Copilot       │
│ Planner       │                                         │ Inspector     │
│ Canvas        │                                         │ Computer Mode │
│ Roadmap       │                                         │ preview       │
│ Memory        │                                         │               │
│               │                                         │               │
├───────────────┴─────────────────────────────────────────┴───────────────┤
│ Memory · Living Graph · Extensions · Decisions · Work Inbox            │  ← Bottom rail
└─────────────────────────────────────────────────────────────────────────┘
```

- Activity rail (48px) is **removed**. Mode switcher lives in the topbar.
- Sidebar width stays 220px but shows ~5 items instead of 8+ nested.
- Bottom rail is new.
- Right rail is the Copilot-led pane (was AI Assistant Panel).

---

## Verification (R1 end)

- [ ] Reviewer can trace every existing route to either (a) a kept route, (b) a redirect target, or (c) a deliberate retirement with a widget home.
- [ ] No capability in today's app is dropped without a new home.
- [ ] Mode × Role matrix is complete for all 8 roles × 5 Modes.
- [ ] Retirement list is aligned with the redirects list.

## Open for R2

- Final typography scale (H1–Caption + serif vs sans for Mode headers) decided in R2.
- Icon size lockdown (16/20/24) decided in R2.
- Motion tokens (editorial ease-out, 300–500ms) decided in R2.

---

_Next: R2 — Design System Pass. Requires this IA doc approved first._
