# Role-Based Access Control (RBAC)

Product OS implements a comprehensive RBAC system with 8 distinct roles, each configured with specific studio access, dashboard widgets, and UI adaptations.

---

## Overview

RBAC operates at two levels:

1. **Organization level** — basic membership roles (`owner`, `admin`, `editor`, `viewer`, `guest`) stored in the `memberships` table
2. **Application level** — product-specific roles defined in `role-config.ts` that determine UI access and dashboard layouts

---

## Application Roles

These roles are the primary access control mechanism for the Product OS UI.

### Admin

**Color:** `#EF4444` (Red)  
**Icon:** Shield  
**Description:** Full access to all studios, settings, and admin panel

**Studio access:** All 27 studios + admin panel  
**Dashboard widgets:** Overview, analytics, tasks, approvals, releases, team, settings

The Admin role has unconditional access to everything. `hasStudioAccess('admin', any)` always returns `true`.

---

### Manager

**Color:** `#3B82F6` (Blue)  
**Icon:** Briefcase  
**Description:** Oversee planning, templates, tasks, approvals, and releases

**Studios:** Home, Planner, Templates, Control Tower, Tasks, Approvals, Decisions, Analytics, Releases  
**Dashboard widgets:** Overview, analytics, tasks, approvals, releases

Managers see the executive view — health scores, module readiness, approval queues, and release status.

---

### Business Analyst

**Color:** `#8B5CF6` (Purple)  
**Icon:** BarChart3  
**Description:** Analyze requirements, build canvases, and review templates

**Studios:** Home, Planner, Templates, Canvas, Analytics, Tasks, Approvals, Decisions  
**Dashboard widgets:** Overview, analytics, tasks, approvals

BAs focus on requirements definition and analysis — they can create features in Planner, build product canvases, manage templates, and track approvals.

---

### Product Designer

**Color:** `#EC4899` (Pink)  
**Icon:** Palette  
**Description:** Design brand, components, pages, and graphics

**Studios:** Home, Brand, Components, Design, Graphics, Pages, Tasks  
**Dashboard widgets:** Design, components, tasks, brand

Designers own the visual layer — design tokens, component library, pages, and graphics. Their dashboard shows design health, component coverage, and brand completeness.

---

### Frontend Dev

**Color:** `#06B6D4` (Cyan)  
**Icon:** Code2  
**Description:** Build components, pages, and implement handoff specs

**Studios:** Home, Components, Pages, Code, Handoff, Tasks  
**Dashboard widgets:** Code, components, tasks, handoff

Frontend devs see the implementation view — handoff queue, component implementation status, and code health.

---

### Backend Dev

**Color:** `#10B981` (Green)  
**Icon:** Server  
**Description:** Build workflows, APIs, and implement handoff specs

**Studios:** Home, Workflow, Code, Handoff, Tasks  
**Dashboard widgets:** Code, workflows, tasks, handoff

Backend devs focus on data models and APIs — workflow nodes, entity definitions, and code health.

---

### QA Engineer

**Color:** `#F59E0B` (Amber)  
**Icon:** Bug  
**Description:** Manage testing, track bugs, and verify releases

**Studios:** Home, Testing, Tasks, Approvals, Releases  
**Dashboard widgets:** Testing, tasks, approvals, releases

QA engineers see testing coverage, release readiness, and bug tracking. They approve releases after verifying test coverage.

---

### Viewer

**Color:** `#64748B` (Slate)  
**Icon:** Eye  
**Description:** Read-only access to dashboards and analytics

**Studios:** Home, Control Tower, Analytics  
**Dashboard widgets:** Overview, analytics

Viewers can see product health and metrics but cannot create, edit, or delete anything. Appropriate for stakeholders, clients, or executives who need visibility without editing access.

---

## Role Configuration Reference

The full configuration lives in `apps/web/app/lib/role-config.ts`:

```ts
export type OrgRole =
  | 'admin'
  | 'manager'
  | 'business_analyst'
  | 'qa'
  | 'product_designer'
  | 'frontend_dev'
  | 'backend_dev'
  | 'viewer'

export interface RoleConfig {
  label: string
  description: string
  icon: string             // Lucide icon name
  color: string            // Hex color for role badge
  studios: string[]        // Accessible studio keys
  dashboardWidgets: string[]
}
```

---

## Utility Functions

### `getStudioAccess(role: OrgRole): string[]`

Returns the list of studio keys accessible to a given role.

```ts
import { getStudioAccess } from '@/lib/role-config'

getStudioAccess('product_designer')
// → ['home', 'brand', 'components', 'design', 'graphics', 'pages', 'tasks']
```

### `hasStudioAccess(role: OrgRole, studioKey: string): boolean`

Check if a role can access a specific studio.

```ts
import { hasStudioAccess } from '@/lib/role-config'

hasStudioAccess('qa', 'testing')   // → true
hasStudioAccess('qa', 'brand')     // → false
hasStudioAccess('admin', 'brand')  // → true (admin always true)
```

### `getRoleLabel(role: OrgRole): string`

Get the human-readable label for a role.

```ts
getRoleLabel('business_analyst')  // → 'Business Analyst'
```

---

## Home Dashboard Layouts by Role

The home dashboard renders different panel grids based on the user's role:

### PM (admin, manager)
```
[Health: 3cols] [Stats: 9cols]
[Readiness: 7cols] [Blockers: 5cols]
[Tasks: 4cols] [Approvals: 4cols] [Insights: 4cols]
```

### Business Analyst
```
[Stats: 12cols]
[Focus: 4cols] [Readiness: 8cols]
[Activity: 7cols] [Tasks: 5cols]
[Approvals: 6cols] [Insights: 6cols]
```

### Product Designer
```
[Stats: 12cols]
[Focus: 4cols] [Activity: 8cols]
[Tasks: 6cols] [Approvals: 6cols]
[Blockers: 12cols]
```

### Frontend Dev
```
[Health: 3cols] [Stats: 9cols]
[FE Focus: 5cols] [Tasks: 7cols]
[Handoff Queue: 5cols] [Blockers: 7cols]
```

### Backend Dev
```
[Health: 3cols] [Stats: 9cols]
[BE Focus: 7cols] [Tasks: 5cols]
[Handoff Queue: 5cols] [Blockers: 7cols]
```

### QA Engineer
```
[Stats: 12cols]
[QA Focus: 5cols] [Readiness: 7cols]
[Tasks: 6cols] [Approvals: 6cols]
[Blockers: 12cols]
```

### Viewer
```
[Health: 3cols] [Stats: 9cols]
[Readiness: 12cols]
```

---

## Sidebar Navigation Badges

The sidebar automatically shows badge counts for actionable items:

| Studio | Badge Source |
|--------|-------------|
| Notifications | Unread notification count |
| Approvals | Pending approval requests |
| Tasks | Open (non-done) tasks |

---

## Role Switcher (Admin Only)

Admins can preview any role's dashboard via the Role Switcher component in the home page header. This allows admins to verify that role-specific layouts are correct without logging in as different users.

---

## Adding a New Role

1. Add the role to `OrgRole` union type in `role-config.ts`
2. Add a `RoleConfig` entry in `roleConfigs`
3. Add the role to `roleConfigs[...].studios` as needed
4. Add a `dashboardWidgets` array
5. Update the home dashboard layout grid in `home/page.tsx`
6. Add a `RoleFocusPanel` variant in `role-focus-panel.tsx`
7. Add the role label and tagline to `role-greeting.tsx`

---

## Database-Level Roles

The `memberships.role` enum controls API-level access:

| DB Role | Access Level |
|---------|-------------|
| `owner` | Same as admin — full access |
| `admin` | Full access to all tRPC procedures |
| `editor` | Read + write on own resources |
| `viewer` | Read-only on shared resources |
| `guest` | Limited read access to public resources |

The `role` from the session context is compared against these values in `protectedProcedure` middleware within tRPC.
