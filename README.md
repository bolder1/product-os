# Ground

> Structured product memory for AI coding agents.

Your coding agents are excellent at the file in front of them and blind to why any
of it exists. Ground is where product context lives — typed, queryable, and one MCP
call away.

**Status: pre-MVP, under active rebuild.** See [`docs/00-ground.md`](docs/00-ground.md)
for the concept, scope and roadmap. That document is the plan of record.

---

## What is here today

| Area | State |
|------|-------|
| Design system (`packages/ui`) | Built — tokens, primitives, light and dark |
| Landing page | First pass |
| Data layer (`packages/db`, `packages/api`) | Carried over from the previous product; being reshaped |
| Context surface | Not built |
| MCP server | Not built |

Everything user-facing from the previous product ("Product OS") has been removed.
The data layer was kept deliberately — it is invisible plumbing, and it is the
substrate the new concept needs.

## Develop

```bash
pnpm install
pnpm --filter @product-os/web dev
```

Requires Node ≥ 22 and pnpm ≥ 10. A `DATABASE_URL` is needed for anything that
touches persistence; copy `.env.example` to `.env.local` and fill it in.

## Layout

```
apps/web         Next.js 15 app — the only frontend
packages/ui      Ground design system
packages/db      Drizzle schema and client
packages/api     tRPC routers
packages/ai      Model invocation
packages/memory  Context storage primitives
docs/            Plan of record
```
