# API Reference

Product OS uses **tRPC** for all client-server communication. Every procedure is fully type-safe end-to-end — the TypeScript types flow from your database schema all the way to your React components.

---

## Base URL

```
/api/trpc/[procedure]
```

All requests are `POST` with JSON bodies. Authentication is via `Authorization: Bearer <token>` header.

---

## Authentication Procedures (`auth.*`)

### `auth.login`

Sign in with email and password.

**Input:**
```ts
{ email: string; password: string }
```

**Output:**
```ts
{ token: string; user: { id: string; name: string; email: string; avatarUrl: string | null } }
```

---

### `auth.signup`

Create a new account.

**Input:**
```ts
{ name: string; email: string; password: string }
```

**Output:**
```ts
{ token: string; user: User }
```

---

### `auth.logout`

Invalidate the current session.

**Input:** _(none)_

**Output:**
```ts
{ success: boolean }
```

---

## Product Procedures (`product.*`)

### `product.list`

List all products in the current organization.

**Input:**
```ts
{ orgId: string }
```

**Output:**
```ts
Product[]
```

---

### `product.create`

Create a new product.

**Input:**
```ts
{
  orgId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}
```

**Output:**
```ts
Product
```

---

### `product.get`

Get a product by slug.

**Input:**
```ts
{ orgSlug: string; productSlug: string }
```

**Output:**
```ts
Product & { org: Organization }
```

---

## Graph Procedures (`graph.*`)

### `graph.nodes`

List all nodes for a product, optionally filtered by kind.

**Input:**
```ts
{
  productId: string;
  kind?: GraphNodeKind;
  branchId?: string;
}
```

**Output:**
```ts
GraphNode[]
```

---

### `graph.createNode`

Create a new graph node.

**Input:**
```ts
{
  productId: string;
  kind: GraphNodeKind;
  label: string;
  data?: Record<string, unknown>;
  position?: { x: number; y: number };
}
```

**Output:**
```ts
GraphNode
```

---

### `graph.updateNode`

Update a node's label, data, or position.

**Input:**
```ts
{
  id: string;
  label?: string;
  data?: Record<string, unknown>;
  position?: { x: number; y: number };
}
```

**Output:**
```ts
GraphNode
```

---

### `graph.deleteNode`

Soft-delete a node.

**Input:**
```ts
{ id: string }
```

**Output:**
```ts
{ success: boolean }
```

---

### `graph.createEdge`

Create a relationship between two nodes.

**Input:**
```ts
{
  productId: string;
  sourceId: string;
  targetId: string;
  kind: GraphEdgeKind;
  data?: Record<string, unknown>;
}
```

**Output:**
```ts
GraphEdge
```

---

## Task Procedures (`task.*`)

### `task.list`

List tasks for a product, optionally filtered by status or assignee.

**Input:**
```ts
{
  productId: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  assigneeId?: string;
}
```

**Output:**
```ts
Task[]
```

---

### `task.create`

Create a new task.

**Input:**
```ts
{
  productId: string;
  nodeId?: string;          // Optional linked graph node
  title: string;            // Max 500 chars
  description?: string;
  status?: TaskStatus;      // Default: 'todo'
  priority?: TaskPriority;  // Default: 'medium'
  assigneeId?: string;
  dueAt?: Date;
}
```

**Output:**
```ts
Task
```

**Side effects:**
- Emits `task.created` event
- Notification sent to assignee (if different from creator)
- Activity log entry created

---

### `task.update`

Update task fields.

**Input:**
```ts
{
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueAt?: Date | null;
}
```

**Output:**
```ts
Task
```

**Side effects:**
- Emits `task.updated` or `task.completed` event
- Notifications sent as appropriate

---

### `task.delete`

Delete a task permanently.

**Input:**
```ts
{ id: string }
```

**Output:**
```ts
Task
```

---

## Notification Procedures (`notification.*`)

### `notification.list`

Get notifications for the current user.

**Input:**
```ts
{
  limit?: number;   // Default: 50, Max: 100
  offset?: number;  // Default: 0
}
```

**Output:**
```ts
Notification[]
```

---

### `notification.getUnreadCount`

Get count of unread notifications.

**Input:** _(none)_

**Output:**
```ts
number
```

---

### `notification.markRead`

Mark a single notification as read.

**Input:**
```ts
{ id: string }
```

**Output:**
```ts
Notification
```

---

### `notification.markAllRead`

Mark all notifications as read.

**Input:** _(none)_

**Output:**
```ts
{ success: boolean }
```

---

### `notification.getPreferences`

Get notification preferences for a product.

**Input:**
```ts
{ productId: string }
```

**Output:**
```ts
Record<NotificationType, {
  enabled: boolean;
  channel: 'in_app' | 'email' | 'both';
  emailDigestFrequency: 'off' | 'instant' | 'daily' | 'weekly';
}>
```

---

### `notification.setPreferences`

Save notification preferences.

**Input:**
```ts
{
  productId: string;
  preferences: Record<string, {
    enabled: boolean;
    channel: 'in_app' | 'email' | 'both';
    emailDigestFrequency: 'off' | 'instant' | 'daily' | 'weekly';
  }>;
}
```

**Output:**
```ts
{ success: boolean }
```

---

## Approval Procedures (`approval.*`)

### `approval.list`

List approvals for a product.

**Input:**
```ts
{
  productId: string;
  status?: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  requestedBy?: string;
}
```

**Output:**
```ts
Approval[]
```

---

### `approval.create`

Submit something for approval.

**Input:**
```ts
{
  productId: string;
  nodeId: string;
  approvers: string[];     // User IDs
  mode: 'sequential' | 'parallel';
}
```

**Output:**
```ts
Approval
```

---

### `approval.decide`

Approve or reject a pending approval.

**Input:**
```ts
{
  approvalId: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
}
```

**Output:**
```ts
ApprovalDecision
```

---

## Control Tower Procedures (`controlTower.*`)

### `controlTower.getHealthSummary`

Get product health scores, module readiness, and blockers.

**Input:**
```ts
{ productId: string }
```

**Output:**
```ts
{
  overall: number;                           // 0–100
  studioScores: Array<{
    studio: string;
    label: string;
    score: number;
    nodeCount: number;
    route: string;
  }>;
  moduleSummaries: Array<{
    moduleId: string;
    label: string;
    readiness: number;
    featureCount: number;
    pageCount: number;
    entityCount: number;
    blockers: string[];
  }>;
  topBlockers: Array<{
    id: string;
    kind: string;
    label: string;
    severity: 'error' | 'warning' | 'info';
    reason: string;
    studioRoute: string;
  }>;
}
```

---

### `controlTower.getAIHealthRecs`

Get AI-generated health recommendations.

**Input:**
```ts
{ productId: string }
```

**Output:**
```ts
{
  success: boolean;
  insights: Array<{
    type: 'critical' | 'warning' | 'suggestion' | 'positive';
    text: string;
    action?: string;
    studio?: string;
  }>;
}
```

---

## OpsPilot Procedures (`opsPilot.*`)

### `opsPilot.chat`

Send a message to the AI copilot.

**Input:**
```ts
{
  productId: string;
  currentStudio: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;   // Min 1 message
}
```

**Output:**
```ts
{
  reply: string;
  intent: IntentKind;
  intentConfidence: number;
  action: {
    type: 'task_created' | 'navigate' | 'nodes_created' | 'stats' | 'none';
    data: Record<string, unknown>;
  };
  graphSummary: string;
}
```

**Intent Kinds:**
- `answer_question` — general Q&A about the product graph
- `create_task` — task creation intent
- `navigate_to` — navigation intent
- `scaffold_nodes` — create graph nodes from prompt
- `run_analysis` — deep product analysis
- `show_stats` — graph statistics

---

### `opsPilot.getSuggestions`

Get contextual prompt suggestions for the current studio.

**Input:**
```ts
{
  productId: string;
  currentStudio: string;
}
```

**Output:**
```ts
{
  suggestions: string[];    // 4–6 prompt suggestions
  isEmpty: boolean;
  kindCounts: Record<string, number>;
}
```

---

## Template Procedures (`template.*`)

### `template.listBundles`

Browse available template bundles.

**Input:**
```ts
{
  category?: string;
  search?: string;
}
```

**Output:**
```ts
TemplateBundle[]
```

---

### `template.applyBundle`

Apply a template bundle to a product.

**Input:**
```ts
{
  bundleId: string;
  productId: string;
  variables?: Record<string, string>;
}
```

**Output:**
```ts
{
  nodesCreated: number;
  edgesCreated: number;
  summary: string;
}
```

---

### `template.previewConflicts`

Check for naming conflicts before applying a template.

**Input:**
```ts
{
  bundleId: string;
  productId: string;
  variables?: Record<string, string>;
}
```

**Output:**
```ts
{
  conflicts: Array<{
    tempNodeId: string;
    kind: string;
    label: string;
    existingNodeId: string;
  }>;
}
```

---

## Error Handling

All errors follow the tRPC error format:

```ts
{
  error: {
    code: string;        // TRPC error code
    message: string;     // Human-readable message
    data?: {
      httpStatus: number;
      path: string;
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid session token |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `BAD_REQUEST` | 400 | Invalid input (Zod validation failed) |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Using the API Client

### React (tRPC Hooks)

```tsx
import { trpc } from '../lib/trpc'

// Query
const { data: tasks, isLoading } = trpc.task.list.useQuery({
  productId: 'your-product-id',
  status: 'todo',
})

// Mutation
const createTask = trpc.task.create.useMutation({
  onSuccess: (task) => {
    console.log('Created:', task.id)
  },
})

createTask.mutate({
  productId: 'your-product-id',
  title: 'Build login page',
  priority: 'high',
})
```

### Server-Side (tRPC Caller)

```ts
import { createCallerFactory } from '@product-os/api'

const caller = createCallerFactory(appRouter)(context)
const tasks = await caller.task.list({ productId: 'abc' })
```
