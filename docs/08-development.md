# Developer Guide

This guide covers conventions, patterns, and workflows for contributing to Product OS.

---

## Project Conventions

### TypeScript

- **Strict mode** is enabled. No `any` unless explicitly justified with a comment.
- All exported functions must have explicit return types.
- Use `interface` for object shapes passed between modules; use `type` for unions and aliases.
- Avoid `as` type assertions; prefer type guards.

### File Naming

| Pattern | Usage |
|---------|-------|
| `kebab-case.ts` | Utility files, hooks, config |
| `PascalCase.tsx` | React components |
| `kebab-case.test.ts` | Test files (co-located with source) |
| `UPPER_CASE.md` | Documentation root files |

### Component Patterns

All React components use:
- **Function components** only (no class components)
- **`'use client'`** directive at the top of any component that uses state, effects, or browser APIs
- **Framer Motion** for animations (not CSS keyframes)
- **Lucide React** for all icons (consistent `size=` prop)
- **Tailwind CSS** for styling with CSS variables for theming

```tsx
// ✅ Good
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  label: string
  onClick: () => void
}

export function MyButton({ label, onClick }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="px-3 py-1.5 rounded bg-[var(--accent)] text-[11px] font-medium"
    >
      <CheckCircle2 size={12} className="mr-1.5" />
      {label}
    </motion.button>
  )
}
```

---

## Adding a New Studio

Follow this checklist to add a new studio page:

### 1. Create the page file

```bash
mkdir -p "apps/web/app/(dashboard)/[orgSlug]/[productSlug]/my-studio/_components"
touch "apps/web/app/(dashboard)/[orgSlug]/[productSlug]/my-studio/page.tsx"
```

### 2. Build the page component

```tsx
// apps/web/app/(dashboard)/[orgSlug]/[productSlug]/my-studio/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { trpc } from '../../../../lib/trpc'
import { useProductId } from '../../../../lib/use-product-id'

export default function MyStudioPage() {
  const productId = useProductId()
  const { data, isLoading } = trpc.graph.nodes.useQuery(
    { productId, kind: 'my-kind' },
    { enabled: !!productId }
  )

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Studio</h1>
      {/* ... */}
    </div>
  )
}
```

### 3. Add to sidebar navigation

In `apps/web/app/components/shell/sidebar.tsx`, add an entry to the appropriate section:

```ts
{ key: 'my-studio', label: 'My Studio', href: 'my-studio' }
```

### 4. Add an icon

In `apps/web/app/components/shell/studio-icon.tsx`:

```ts
import { MyIcon } from 'lucide-react'
// Add to studioIconMap:
'my-studio': MyIcon,
```

### 5. Add to role configs

In `apps/web/app/lib/role-config.ts`, add `'my-studio'` to the `studios` array for each role that should access it.

### 6. Add a tRPC router (if needed)

```ts
// packages/api/src/routers/my-studio.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const myStudioRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // ...
    }),
})
```

Register it in `packages/api/src/root.ts`:
```ts
import { myStudioRouter } from './routers/my-studio'

export const appRouter = router({
  // ...existing routers...
  myStudio: myStudioRouter,
})
```

---

## Adding a New Graph Node Kind

1. Add the kind to `graphNodeKindEnum` in `packages/db/src/schema/graph.ts`
2. Generate and run a migration:
   ```bash
   pnpm --filter @product-os/db drizzle-kit generate
   pnpm db:migrate
   ```
3. Add the node kind to `node-studio-link.ts` so cross-studio links work
4. Update `control-tower.ts` if the new kind should contribute to health scores

---

## Adding a New tRPC Procedure

```ts
// In your router file
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { myTable } from '@product-os/db'

export const myRouter = router({
  myProcedure: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(myTable)
        .values({
          productId: input.productId,
          name: input.name,
          createdBy: ctx.session.userId,
        })
        .returning()
      
      return row!
    }),
})
```

**Key patterns:**
- Always use `protectedProcedure` for authenticated routes
- Validate all input with Zod
- Return the inserted/updated row from `.returning()`
- Emit events for significant state changes (see Events section)

---

## Working with the Event Bus

Emit events from your tRPC mutations:

```ts
// In your mutation
ctx.eventBus.emit('my-entity.created', {
  productId: input.productId,
  actorId: ctx.session.userId,
  payload: {
    entityId: newEntity.id,
    name: newEntity.name,
  },
  metadata: {
    studioOrigin: 'my-studio',
  },
}).catch(() => {})  // Fire-and-forget: don't await, don't fail if handler errors
```

Add a handler in `packages/events/src/handlers/index.ts`:

```ts
export const myEntityHandler: EventHandler = async (event) => {
  if (event.type !== 'my-entity.created') return
  
  const payload = event.payload as { entityId: string; name: string }
  
  // Do something (e.g., create a notification)
  await db.insert(notifications).values({
    userId: event.actorId,
    productId: event.productId,
    type: 'system',
    title: `${payload.name} was created`,
    body: null,
    link: null,
  })
}
```

Register it in `packages/events/src/setup.ts`:
```ts
eventBus.on('my-entity.created', myEntityHandler)
```

---

## Adding a New Zustand Store

```ts
// apps/web/app/lib/my-store.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MyItem {
  id: string
  name: string
}

interface MyState {
  items: MyItem[]
  addItem: (item: MyItem) => void
  removeItem: (id: string) => void
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: 'product-os-my-store' }  // localStorage key
  )
)
```

**When to use Zustand vs tRPC:**
- **Zustand** — cross-studio shared UI state that changes frequently, already-fetched data that needs fast access
- **tRPC queries** — fresh server data, anything that needs to be current with the database

---

## Database Migrations

### Creating a Migration

1. Make changes to the schema file in `packages/db/src/schema/`
2. Generate the migration:
   ```bash
   pnpm --filter @product-os/db drizzle-kit generate
   ```
3. Review the generated SQL in `packages/db/drizzle/`
4. Apply it:
   ```bash
   pnpm db:migrate
   ```

### Rules

- **Never** use `db:push` in staging or production — it bypasses migration history
- **Always** add indexes for columns used in WHERE clauses
- **Always** use `{ onDelete: 'cascade' }` for FK references to `products` and `users`
- New enum values must be added to PostgreSQL enums via migration — they cannot be removed without downtime

---

## CSS Variables and Theming

All colors use CSS custom properties defined in the root stylesheet:

```css
/* Common variables used throughout the codebase */
--bg                /* Page background */
--bg-surface        /* Card/panel background */
--bg-inset          /* Input/code background */
--bg-overlay        /* Modal overlay */

--text-primary      /* Main text */
--text-secondary    /* Subdued text */
--text-tertiary     /* Placeholder / hint text */

--border-default    /* Standard borders */
--border-subtle     /* Light borders */
--border-strong     /* Emphasized borders */

--accent            /* Primary brand color (#6398ff) */
--accent-text       /* Text on accent backgrounds */
--accent-bg         /* Light accent background */
--accent-hover      /* Hover state */

--color-error       /* Danger/error state */
--color-success     /* Success state */
--color-warning     /* Warning state */
```

Use these variables in Tailwind:
```html
<div class="bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-default)]">
```

---

## Performance Guidelines

### Images
- Use `next/image` for all images
- Set explicit `width` and `height` props
- Use `priority` for above-the-fold images

### Queries
- Always include `enabled: !!productId` to prevent queries with empty IDs
- Set `staleTime` on frequently-accessed queries:
  ```ts
  trpc.graph.nodes.useQuery({ productId }, { staleTime: 30_000 })
  ```
- Use `select` option to transform data at the query level and prevent unnecessary re-renders

### Components
- Memoize expensive computations with `useMemo`
- Use `React.memo` for pure components in lists
- Keep each component file under 300 lines — split into subcomponents if longer

---

## Testing

```bash
# Run all unit tests
pnpm test

# Run tests for a specific package
pnpm --filter @product-os/api test

# Run end-to-end tests
pnpm test:e2e

# Type checking only
pnpm typecheck
```

### Test Conventions

- Co-locate tests with source files: `my-utils.test.ts` next to `my-utils.ts`
- Use `describe` + `it` structure
- Mock database calls in unit tests
- Integration tests use a test database (`TEST_DATABASE_URL`)

---

## Common Gotchas

### 1. `'use client'` boundary

Any file that imports `useState`, `useEffect`, browser APIs, or Zustand stores **must** have `'use client'` at the top. Forgetting this causes a Next.js build error.

### 2. Zustand with persist requires hydration guard

Server-side and client-side state can mismatch on first render. Use `useHydrated()` or `suppressHydrationWarning` where needed.

### 3. tRPC type inference is session-wide

If you add a new procedure, run `pnpm typecheck` in the `apps/web` package to regenerate the inferred types. TypeScript won't auto-pick up new procedures without this.

### 4. UUIDs in paths

All dynamic segments expecting UUIDs must be validated. Use Zod `.uuid()` in tRPC inputs — this prevents SQL injection via path manipulation.

### 5. Notification store and timestamp format

The `notification-store.ts` uses `timestamp: new Date().toISOString()`. Always store as ISO string, not a Date object, because Zustand's persist middleware serializes to JSON.
