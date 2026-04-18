# Database Schema Reference

Product OS uses PostgreSQL with Drizzle ORM. All schema files live in `packages/db/src/schema/`.

---

## Schema Files

| File | Tables |
|------|--------|
| `users.ts` | users, sessions, accounts |
| `organizations.ts` | organizations, memberships |
| `products.ts` | products |
| `graph.ts` | graph_nodes, graph_edges |
| `collaboration.ts` | comments, tasks, approvals, approval_decisions, notifications, notification_preferences |
| `versioning.ts` | versions, branches |
| `audit.ts` | activity_log, ai_skill_history |
| `templates.ts` | template_bundles, template_nodes, template_edges |
| `connectors.ts` | connectors, connector_bindings |

---

## Users & Auth

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Auto-generated |
| `email` | text UNIQUE | Login identifier |
| `name` | text | Display name |
| `avatar_url` | text | Profile image URL |
| `email_verified` | boolean | Default: false |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-updated |

### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `token` | text UNIQUE | Bearer token |
| `expires_at` | timestamptz | Session expiry |
| `created_at` | timestamptz | |

### `accounts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `provider` | text | `github`, `google` |
| `provider_account_id` | text | Provider's user ID |
| `access_token` | text | OAuth access token |
| `refresh_token` | text | OAuth refresh token |

---

## Organizations

### `organizations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text | Display name |
| `slug` | text UNIQUE | URL slug |
| `plan` | enum | `free`, `starter`, `pro`, `enterprise` |
| `settings` | jsonb | Arbitrary org settings |
| `logo_url` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `memberships`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `org_id` | uuid FK → organizations | |
| `role` | enum | `owner`, `admin`, `editor`, `viewer`, `guest` |
| `invited_at` | timestamptz | When invite was sent |
| `accepted_at` | timestamptz | When user accepted |

---

## Products

### `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | |
| `name` | text | Product display name |
| `slug` | text | URL slug (unique per org) |
| `description` | text | |
| `icon` | text | Emoji or URL |
| `status` | enum | `draft`, `active`, `archived` |
| `settings` | jsonb | Product-level settings |
| `created_by` | uuid FK → users | |

---

## Product Graph

### `graph_nodes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | Scopes data to product |
| `kind` | enum | See Node Kinds below |
| `label` | text | Human-readable name |
| `data` | jsonb | Kind-specific properties |
| `position` | jsonb | `{x, y}` for canvas layout |
| `created_by` | uuid FK → users | |
| `version` | integer | Default: 1 |
| `branch_id` | uuid | For versioned branches |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |

**Indexes:**
- `(product_id, kind)` — fast studio queries
- `(product_id, branch_id)` — branch-scoped queries

**Node Kind Enum:**
```
product, plan, template_bundle, module, feature, journey,
page, route, screen, workflow, entity, field, component,
variant, token, asset, task, approval, insight, release,
connector_binding, mcp_binding, skill_action, computer_action,
handoff_item, analytics_dashboard, analytics_event,
experiment, test_suite, test_run, test_coverage
```

### `graph_edges`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `source_id` | uuid FK → graph_nodes | Edge origin |
| `target_id` | uuid FK → graph_nodes | Edge destination |
| `kind` | enum | See Edge Kinds below |
| `data` | jsonb | Edge metadata |
| `created_at` | timestamptz | |

**Indexes:**
- `(product_id)` — list all edges for product
- `(source_id)` — outbound traversal
- `(target_id)` — inbound traversal
- `(source_id, kind)` — typed edge queries

**Edge Kind Enum:**
```
contains, depends_on, references, implements, inherits,
triggers, routes_to, uses_token, uses_component,
assigned_to, approves, blocks, has_handoff, has_run
```

---

## Collaboration

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `node_id` | uuid FK → graph_nodes | Optional linked node |
| `title` | text | |
| `description` | text | |
| `status` | enum | `todo`, `in_progress`, `review`, `done`, `cancelled` |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `assignee_id` | uuid FK → users | Optional assignee |
| `due_at` | timestamptz | Optional deadline |
| `studio_origin` | text | Studio that created the task |
| `created_by` | uuid FK → users | |

### `approvals`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `node_id` | uuid FK → graph_nodes | What is being approved |
| `requested_by` | uuid FK → users | Who submitted |
| `status` | enum | `pending`, `approved`, `rejected`, `changes_requested` |
| `routing` | jsonb | `{approvers: string[], mode: 'sequential'|'parallel'}` |
| `decided_at` | timestamptz | When decision was made |

### `approval_decisions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `approval_id` | uuid FK → approvals | |
| `approver_id` | uuid FK → users | |
| `decision` | enum | `approved`, `rejected`, `changes_requested` |
| `comment` | text | Optional rationale |

### `comments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `node_id` | uuid FK → graph_nodes | What is being commented on |
| `author_id` | uuid FK → users | |
| `body` | text | Comment content (supports markdown) |
| `parent_id` | uuid | For threaded replies |
| `resolved` | boolean | Thread resolved flag |

---

## Notifications

### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | Recipient |
| `product_id` | uuid FK → products | Context product |
| `type` | enum | See types below |
| `title` | text | Short notification title |
| `body` | text | Longer description |
| `link` | text | Deep link URL |
| `read` | boolean | Default: false |
| `created_at` | timestamptz | |

**Notification Type Enum:**
```
task_assigned, task_updated, approval_requested, approval_decided,
comment_mention, comment_reply, ai_completed, release_ready,
analytics_alert, system
```

### `notification_preferences`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `product_id` | uuid FK → products | |
| `type` | enum | Same as notification types |
| `enabled` | boolean | Default: true |
| `channel` | enum | `in_app`, `email`, `both` |
| `email_digest_frequency` | text | `off`, `instant`, `daily`, `weekly` |
| `updated_at` | timestamptz | |

---

## Versioning

### `versions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `label` | text | e.g., `v1.2.0` or `Sprint 4` |
| `parent_id` | uuid | Previous version |
| `created_by` | uuid FK → users | |
| `created_at` | timestamptz | |

### `branches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `name` | text | Branch name |
| `base_version_id` | uuid FK → versions | Starting point |
| `status` | enum | `active`, `merged`, `archived` |

---

## Audit & AI History

### `activity_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `actor_id` | uuid FK → users | Who did it |
| `action` | text | Event type string (e.g., `task.created`) |
| `entity_type` | text | Domain (e.g., `task`, `graph`) |
| `entity_id` | uuid | Affected record |
| `diff` | jsonb | What changed |
| `studio_origin` | text | Source studio |
| `created_at` | timestamptz | |

### `ai_skill_history`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `product_id` | uuid FK → products | |
| `skill` | text | Skill name invoked |
| `input_context` | jsonb | Prompt context sent |
| `output` | jsonb | AI response |
| `model` | text | Claude model used |
| `tokens_used` | integer | Token consumption |
| `actor_id` | uuid FK → users | Who triggered |
| `studio_origin` | text | Source studio |

---

## Templates

### `template_bundles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `name` | text | Template name |
| `description` | text | |
| `category` | text | `saas`, `mobile`, `api`, etc. |
| `tags` | jsonb | Array of tag strings |
| `is_public` | boolean | Available to all orgs |
| `created_by` | uuid FK → users | |

### `template_nodes` / `template_edges`

Mirror the graph_nodes/graph_edges structure but without a product_id. Applied to a product when a template is instantiated.

---

## Migrations

All migrations are tracked in the `packages/db/drizzle/` directory.

```bash
# Generate a migration from schema changes
pnpm --filter @product-os/db drizzle-kit generate

# Apply pending migrations
pnpm db:migrate

# Push schema directly (dev only — no migration file)
pnpm db:push
```

> **Production rule:** Always use `db:migrate` (not `db:push`) in production environments to maintain migration history.
