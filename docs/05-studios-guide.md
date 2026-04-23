# Studios Guide

Product OS provides **27 specialized studios** organized across five phases of product development: Plan, Build, Ship, Operate, and System.

Each studio is a dedicated workspace that reads from and writes to the product graph. Studios are role-filtered — users only see studios relevant to their role.

---

## Studio Navigation

URL pattern: `/{orgSlug}/{productSlug}/{studioKey}`

Example: `https://app.product-os.io/acme/dashboard/planner`

---

## HOME

### Home Dashboard

**Path:** `/home`  
**Roles:** All roles  
**Purpose:** Role-specific landing page with personalized panels.

The home dashboard is fully role-aware — every role sees a different layout:

| Role | Key Panels |
|------|-----------|
| Admin / PM | Health score, stats, module readiness, blockers, tasks, approvals, AI insights |
| Business Analyst | Stats, focus panels, readiness, activity, tasks, approvals |
| Product Designer | Stats, design focus, activity, tasks, approvals, blockers |
| Frontend Dev | Health, code focus, tasks, handoff queue, blockers |
| Backend Dev | Health, workflow focus, tasks, handoff queue, blockers |
| QA Engineer | Stats, testing focus, readiness, tasks, approvals, blockers |
| Viewer | Health, stats, readiness (read-only) |

**Key components:**
- `RoleGreeting` — time-aware greeting with role badge and studio quick-jump
- `RoleFocusPanel` — role-specific health and status data
- `MyTasksPanel` — priority-sorted task list with inline creation
- `HandoffQueuePanel` — pending design-to-dev handoff items

---

## PLAN

### Planner

**Path:** `/planner`  
**Roles:** Admin, Manager, Business Analyst  
**Purpose:** High-level product structure — modules, features, journeys.

The Planner is where products are architected. Teams define modules (major product areas), features (specific capabilities), and user journeys. Everything created here becomes a node in the product graph.

**AI capabilities:**
- `Scaffold` skill: describe a product vision and get a full module/feature breakdown generated
- Template application: bootstrap an entire product structure from a template
- Completeness scoring: AI-generated health metrics per module

---

### Features

**Path:** `/features`  
**Roles:** Admin, Manager, Business Analyst, Product Designer  
**Purpose:** Individual feature management — specifications, status, cross-studio links.

Features are the core deliverable unit. Each feature node connects to related pages, components, workflows, and tasks.

**Key capabilities:**
- Feature card with status, priority, assignee, and linked nodes
- Deep-link to Graph Explorer via "View in Graph" button
- Cross-studio navigation: click a feature → jump to its related page/component
- AI feature description generation

---

### Templates

**Path:** `/templates`  
**Roles:** Admin, Manager, Business Analyst  
**Purpose:** Browse, apply, and remix pre-built product structure templates.

The Template Gallery provides curated bundles for common product types (SaaS, mobile app, API service, e-commerce). Templates are applied to a product in a 5-step flow:

1. **Preview** — see what nodes/edges will be created
2. **Personalise** — fill in template variables (product name, domain, etc.)
3. **Conflicts** — resolve any naming conflicts with existing nodes
4. **Applying** — watch the progress as nodes are created
5. **Done** — success summary with links to new content

**AI Remix:** Describe how you want to adapt a template and OpsPilot rewrites the variables before applying.

**Save as Template:** Export any product's current graph as a reusable template bundle.

---

### Canvas

**Path:** `/canvas`  
**Roles:** Admin, Product Designer  
**Purpose:** Free-form visual canvas for product ideation, journey mapping, and diagrams.

Canvas supports multi-page projects with drag-and-drop shapes, text, and connections. Coming in Phase 39: real-time multi-user collaboration with cursors, design token sync from Brand studio, and version history.

---

## BUILD

### Brand

**Path:** `/brand`  
**Roles:** Admin, Product Designer  
**Purpose:** Design tokens — colors, typography, spacing, shadows.

Brand is the source of truth for design system tokens. Tokens defined here propagate automatically to Components, Design, Pages, Graphics, Code, and Handoff studios when changed.

**Token categories:**
- Colors (primary, secondary, neutrals, semantic states)
- Typography (font families, sizes, weights, line heights)
- Spacing (grid, component padding, layout gaps)
- Shadows, border radius, animation durations

---

### Components

**Path:** `/components`  
**Roles:** Admin, Product Designer, Frontend Dev  
**Purpose:** UI component library — atoms, molecules, organisms.

Each component node stores:
- Component name and category
- Variants and states
- Token bindings (which tokens it uses)
- Handoff spec link
- Code implementation status

**AI capabilities:** Scaffold a new component with correct token bindings from a text description.

---

### Design

**Path:** `/design`  
**Roles:** Admin, Product Designer  
**Purpose:** Design system health, page design tracking, design review.

Design studio provides an overview of the design system completeness — which pages have approved designs, which components are fully speced, and which tokens are undefined.

---

### Workflow

**Path:** `/workflows`  
**Roles:** Admin, Backend Dev, Business Analyst  
**Purpose:** Business logic — workflows, entities, fields, state machines.

Workflow nodes model the back-end data model and processes:
- **Entities** — database models (User, Order, Product, etc.)
- **Fields** — entity properties with types and constraints
- **Workflows** — sequences of steps and transitions
- **Triggers** — events that start a workflow

---

### Pages

**Path:** `/pages`  
**Roles:** Admin, Product Designer, Frontend Dev  
**Purpose:** All screens and routes in the product.

Page nodes represent every screen in the UI — from onboarding flows to settings panels. Each page links to:
- Its parent route and navigation flow
- Components used on the page
- Design file reference
- Handoff spec link

---

### Graphics

**Path:** `/graphics`  
**Roles:** Admin, Product Designer  
**Purpose:** Image assets, illustrations, icons, and media.

Graphics studio manages visual assets. Assets can be tagged with usage context (hero image, empty state, icon set) and linked to specific pages or components.

---

## SHIP

### Code

**Path:** `/code`  
**Roles:** Admin, Frontend Dev, Backend Dev  
**Purpose:** Code health, repository links, implementation tracking.

Code studio shows the technical implementation status of all product features — which features have corresponding code, what the test coverage is, and where the implementation lags behind the spec.

---

### Handoff

**Path:** `/handoff`  
**Roles:** Admin, Product Designer, Frontend Dev, Backend Dev  
**Purpose:** Design-to-development specifications.

Handoff items bridge design and development. Each handoff node contains:
- Component/page being handed off
- Design measurements (spacing, colors, fonts)
- Interactive spec viewer
- Developer implementation notes
- Accept/reject workflow

**Coming in Phase 37:** Rich spec editor with real-time multi-user collaboration, inline commenting with @mentions, version history with diffs, and live TypeScript prop type documentation.

---

### Releases

**Path:** `/releases`  
**Roles:** Admin, Manager, QA  
**Purpose:** Release planning, readiness scoring, and publishing.

**Coming in Phase 38:** Full release management with feature selection, readiness scoring, auto-generated release notes, QA sign-off, and one-click publish.

**Current state:** Basic release node tracking with status and version metadata.

---

### Testing

**Path:** `/testing`  
**Roles:** Admin, QA  
**Purpose:** Test suites, coverage tracking, and release verification.

Testing studio manages the QA process:
- Test suite nodes (unit, integration, e2e)
- Test run history and pass/fail rates
- Coverage percentage per module/feature
- Blocker tracking for release

---

## OPERATE

### Tasks

**Path:** `/tasks`  
**Roles:** All roles (filtered by role)  
**Purpose:** Full task management board.

Tasks provide a Kanban-style board with columns for each status:
- To Do → In Progress → In Review → Done

Tasks can be:
- Created manually or via AI (OpsPilot can generate tasks from context)
- Linked to graph nodes (features, components, pages)
- Assigned to team members
- Prioritized (low/medium/high/urgent)
- Tagged with a studio origin

---

### Approvals

**Path:** `/approvals`  
**Roles:** Admin, Manager, Business Analyst, QA  
**Purpose:** Review and approval workflows.

**Coming in Phase 36:** Full multi-step approval workflow engine with conditional routing, decision log, and bulk actions.

**Current state:** Basic approval creation and decision tracking.

---

### Decisions

**Path:** `/decisions`  
**Roles:** Admin, Manager, Business Analyst  
**Purpose:** Product decision log — architectural choices, scope changes, pivots.

Decisions are immutable records of significant product choices. Each decision captures:
- What was decided
- Why it was decided
- Who made the decision
- What it affects (linked graph nodes)
- Whether it's reversible

---

### Notifications

**Path:** `/notifications`  
**Roles:** All roles  
**Purpose:** Notification inbox with filtering and preferences.

Notifications are generated by the event bus when:
- Tasks are assigned or updated
- Approvals are requested or decided
- Comments mention a user
- Releases are ready
- System events occur

Users can configure per-event preferences (in-app vs. email, digest frequency) via the Preferences modal.

---

### Analytics

**Path:** `/analytics`  
**Roles:** Admin, Manager, Business Analyst  
**Purpose:** Product metrics, studio usage trends, and team velocity.

**Coming in Phase 40:** Studio usage line charts, most-edited features, team velocity gauges, and collaboration metrics.

**Current state:** Basic metrics panels.

---

## SYSTEM

### Control Tower

**Path:** `/control-tower`  
**Roles:** Admin, Manager  
**Purpose:** Executive health overview of the entire product.

Control Tower provides a single-pane view of product health:

- **Health Score** — 0-100 overall score, animated gauge, per-studio breakdown
- **Module Readiness** — per-module cards showing feature/page/entity counts and readiness %
- **Blockers Panel** — grouped by severity (error/warning/info), links to relevant studios
- **AI Insights** — on-demand health analysis with actionable recommendations

All data is live from the product graph — no manual input required.

---

### Graph Explorer

**Path:** `/graph-explorer`  
**Roles:** Admin, Manager  
**Purpose:** Visual interactive graph of all product nodes and their relationships.

The Graph Explorer renders the full product graph as a force-directed network diagram. Features:
- Zoom, pan, and click to inspect any node
- Node detail panel with properties and linked studios
- "Open in Studio" button — navigates directly to the node's home studio
- Deep-link focus: `/graph-explorer?focus={nodeId}` pre-selects a node
- Filter by node kind, search by label

---

## Studio Access by Role

| Studio | Admin | Manager | BA | Designer | FE Dev | BE Dev | QA | Viewer |
|--------|-------|---------|----|---------|----|-----|----|----|
| Home | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Planner | ✅ | ✅ | ✅ | | | | | |
| Features | ✅ | ✅ | ✅ | ✅ | | | | |
| Templates | ✅ | ✅ | ✅ | | | | | |
| Canvas | ✅ | | ✅ | | | | | |
| Brand | ✅ | | | ✅ | | | | |
| Components | ✅ | | | ✅ | ✅ | | | |
| Design | ✅ | | | ✅ | | | | |
| Workflow | ✅ | | | | | ✅ | | |
| Pages | ✅ | | | ✅ | ✅ | | | |
| Code | ✅ | | | | ✅ | ✅ | | |
| Handoff | ✅ | | | | ✅ | ✅ | | |
| Releases | ✅ | ✅ | | | | | ✅ | |
| Testing | ✅ | | | | | | ✅ | |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| Approvals | ✅ | ✅ | ✅ | | | | ✅ | |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | | | | | ✅ |
| Control Tower | ✅ | ✅ | | | | | | ✅ |
| Graph Explorer | ✅ | ✅ | | | | | | |
