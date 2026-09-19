# Ground

> Structured product memory for AI coding agents.

**Status: pre-MVP.** This document is the plan of record. It describes what Ground
is, what exists today, and what gets built next — in that order, honestly. Where
something is not built, it says so.

---

## The problem

Every developer now runs coding agents — Claude Code, Cursor, Copilot. All of them
are excellent at the file in front of them and blind to product intent:

- why a flow exists
- what a module is actually for
- which architectural decisions are already settled
- what the product deliberately does *not* do

Lacking that, agents invent architecture, re-litigate settled choices, contradict
prior decisions, and drift from the product's real shape. The developer pays for
this in review time, on every single task, forever.

The gap is not model capability. It is that **product context has nowhere to live
in a form an agent can query.** READMEs rot, Notion is unstructured prose, and the
codebase records what was built but never why.

## The product

Ground is where a product's structure and intent live, in a typed form, with an
MCP server in front of it.

You define your product's context once. Every agent on your machine queries it
before writing code. Work comes back shaped like your actual product.

**The core loop:**

```
define structure  →  agent queries it  →  agent's work fits the product
        ↑                                              │
        └──────────  structure updates from what shipped  ─┘
```

## Why this, and not the previous version

The prior product ("Product OS") was positioned as *the layer between all your
tools* — 27 studios spanning plan, design, build, ship and operate.

That framing has a fatal cold-start problem. A layer between tools is worth
nothing until it is connected to the tools, populated with an entire product, and
adopted by an entire team. Day-one value for one person was zero. The sprawl to 32
studios was a *symptom*: each new studio was an attempt to be useful before the
network existed, and none succeeded.

Ground inverts the constraint. The binding rule for every decision from here:

> **It must be useful to one person, on day one, with no integrations and no teammates.**

Anything that fails that test does not go in the MVP, regardless of how good it is.

## What carries over

The old repository's genuinely valuable asset is its data layer, which is invisible
to users and therefore has no "look" to revamp:

| Kept | Why |
|------|-----|
| `packages/db` — Drizzle schema, typed graph nodes and edges | This *is* the product's substrate under the new concept |
| `packages/api` — tRPC routers, session auth | Working auth and CRUD; reshaped, not rewritten |
| `packages/events`, `packages/memory`, `packages/ai` | Directly relevant to context storage and retrieval |

Everything user-facing is discarded: all 32 studios, all mock data, the entire
visual language, the old brand. Nothing of the old interface survives.

## Brand

**Name:** Ground. *Grounding* is the established technical term for supplying a
model with real context; the name states the mechanism in language the audience
already uses. It works as both noun and verb — *ground your agents*.

**Visual direction:** deep earth-dark and warm bone, with a signal green for
grounded state and amber for drift. Grotesque type throughout, mono for structured
graph content. Restrained, technical, unhurried — not another cold dev tool.

## MVP

One complete task a single person can finish, alone, in one sitting:

> Define your product's context in Ground, connect your agent to it over MCP, ask
> the agent a question about your product, and get an answer grounded in what you
> defined.

**In scope**

1. Auth and a workspace
2. A single surface for defining product context as typed entries
3. Persistence to Postgres
4. An MCP server exposing search and retrieval over that context
5. A landing page

**Explicitly out of scope for MVP** — named here so they do not creep back in:
multiple studios, role-based dashboards, real-time collaboration, approvals,
releases, testing, analytics, template galleries, team invitations, integrations
with Figma/GitHub/Slack, and any AI feature beyond retrieval.

**Done means:** a developer who has never seen Ground can sign up, enter context,
point Claude Code at it, and observe the agent answer correctly about their product
— with no help.

## Roadmap

Deliberately slow and sequenced. Each phase ends in something usable; no phase
begins before the previous one is genuinely finished.

| Phase | Outcome | Gate to pass |
|-------|---------|--------------|
| 0 | Concept, name, plan of record | This document |
| 1 | Design system — tokens, type, primitives, light and dark | A page can be built without inventing new styles |
| 2 | App shell and auth on the new system | Sign up, land in an empty workspace |
| 3 | Context surface — define, edit, persist | Refresh the page; the data is still there |
| 4 | MCP server | Claude Code answers a product question correctly |
| 5 | Landing page | Explains Ground truthfully, with real screenshots |
| 6 | First outside users | Five developers use it on a real project |

Phases 1–4 are the MVP. Phase 5 ships alongside. Phase 6 decides what comes next —
nothing beyond this table is committed, on purpose.

## Principles

1. **Day-one solo value or it does not ship.** The cold-start rule, applied to every feature.
2. **One surface, not many.** Breadth was the previous failure mode.
3. **Honest documentation.** Docs describe what is built. Plans are labelled as plans.
4. **Retrieval before generation.** Ground's job is to supply truth, not to author it.
5. **Finish before starting.** A phase is done when it works, not when it compiles.
