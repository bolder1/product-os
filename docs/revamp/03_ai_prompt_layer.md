# Revamp R3 — AI Prompt Layer

_Deliverable for the next phase of the Product OS AI experience._
_Status: draft — awaiting approval before implementation._

## Goal

Every prompt a user sends to Product OS passes through a **pre-flight gate** that offers two explicit affordances:

1. **Enhance** — rewrite a vague/thin prompt into a well-defined, context-aware prompt.
2. **Estimate** — break down the token cost and model routing of the work that prompt would trigger, so the user can decide before spending.

This turns the prompt box from a blind submission into a **decision surface**. It applies everywhere we accept a natural-language instruction: Cortex, Copilot rail, Command Palette (⌘K), Computer Mode, and every studio's inline "Ask" affordance.

---

## Principles

1. **Pre-flight, not post-hoc.** The user sees enhancement and cost *before* the model runs, not after.
2. **Opt-in, never mandatory.** Power users can bypass with ⌘↵. The gate is a tool, not a toll.
3. **One layer, many doorways.** The same enhancer/estimator services every prompt entry point. No per-studio forks.
4. **Transparent routing.** The estimate shows which model(s) will be called, why, and at what unit cost.
5. **Graph-aware enhancement.** Enhancement pulls from the product graph (active studio, selection, recent artifacts) — it is not generic prompt-rewriting.
6. **Deterministic fallback.** If the enhancer/estimator services are unavailable, the prompt passes through unchanged with a quiet indicator.

---

## Feature 1 — Prompt Enhancer

### What it does

Takes a raw user prompt plus the current graph context and returns:
- An **enhanced prompt** — clearer intent, explicit constraints, referenced artifacts, expected output shape.
- A **diff view** — what was added/changed, so the user learns the pattern over time.
- **Variables** — extracted dynamic slots (e.g. `{{studio}}`, `{{selected_component}}`, `{{release_target}}`) the user can edit inline.

### UX flow

```
User types: "make it better"
  ↓
Press ↵  →  gate opens (200ms budget; if slower, pass through)
  ↓
┌─────────────────────────────────────────────────┐
│ Your prompt                                     │
│ ─────────────                                   │
│ make it better                                  │
│                                                 │
│ [ ✨ Enhance ]  [ 📊 Estimate ]  [ Send as-is ] │
└─────────────────────────────────────────────────┘

After Enhance:
┌─────────────────────────────────────────────────┐
│ Enhanced                                        │
│ ─────────────                                   │
│ Revise the {{selected_component}} in the Design │
│ studio to {improve what}: [accessibility /      │
│ performance / visual polish]. Keep the existing │
│ layout. Return: updated JSX + rationale.        │
│                                                 │
│ Variables: selected_component = "HeroSection"   │
│            improve what = [ dropdown ]          │
│                                                 │
│ [ ← Back ]  [ Use original ]  [ Run enhanced ]  │
└─────────────────────────────────────────────────┘
```

### Enhancement strategies

The enhancer chooses a strategy based on context:

| Strategy | Trigger | Example |
|----------|---------|---------|
| `resolve-pronouns` | "it", "this", "that" with active selection | "make it better" → "revise `HeroSection`" |
| `add-constraints` | imperative verb, no acceptance criteria | "fix the bug" → "fix + add regression test" |
| `bind-artifacts` | references a studio-shaped noun | "the roadmap" → `{{roadmap:current}}` link |
| `expand-scope` | terse one-liners on a complex studio | "review" → structured review checklist |
| `extract-variables` | repeated phrase across 3+ recent prompts | converts to reusable template |

### Artifacts to build

- `packages/ai-core/src/prompt-enhancer/` — pure service
  - `enhance(raw: string, context: PromptContext): Promise<EnhancedPrompt>`
  - Strategy registry (one file per strategy)
  - Diff engine (character-level, returns `Segment[]`)
- **Schema** `schemas/enhanced-prompt.schema.json`
- **Zustand store** `apps/web/app/lib/prompt-gate-store.ts`
  - `openGate(raw, entryPoint)`, `applyEnhancement()`, `acceptRaw()`, `cancel()`
  - Persists: `gatePreference: 'always' | 'low-quality-only' | 'never'`
- **UI component** `packages/ui/src/components/prompt-gate.tsx`
  - Headless; rendered in a portal above any prompt entry point
- **AI Skill** `ai-skills/enhance-prompt.skill.json`
  - Registered in Cortex; lets users call enhancer as a tool

---

## Feature 2 — Token Budget Preview

### What it does

Before a prompt runs, estimate:
- **Model routing** — which models will be called (plan, main, critic, embedding), based on the skill and Computer Mode.
- **Token breakdown** — input tokens (prompt + retrieved context + tool definitions) + estimated output tokens, per model.
- **Cost** — total $ at current rate; compared against the user's daily/monthly budget.
- **Alternatives** — "Use Haiku instead → -62% cost, -8% quality estimate."

### UX flow

```
After clicking [ 📊 Estimate ]:

┌──────────────────────────────────────────────────┐
│ Estimate — "Revise the HeroSection…"             │
│ ──────────────────────────────────────────────── │
│                                                  │
│  Routing                                         │
│  ─────────                                       │
│   Planner       Opus 4.7    ~1,200 tok   $0.018 │
│   Generator     Sonnet 4.6  ~8,400 tok   $0.025 │
│   Critic        Haiku 4.5   ~2,100 tok   $0.002 │
│   Embedding     voyage-3    ~600  tok    $0.001 │
│                                                  │
│  Total          ~12,300 tok              $0.046 │
│                                                  │
│  Budget: $2.40 used of $10.00 today (24%)        │
│  After this run: 24.5%                           │
│                                                  │
│  Alternatives                                    │
│   • Haiku-only    -72%   $0.013            [ → ]│
│   • Skip critic   -18%   $0.038            [ → ]│
│   • Use cache     -40%   $0.028            [ → ]│
│                                                  │
│  [ ← Back ]  [ Change plan ]  [ Run ]            │
└──────────────────────────────────────────────────┘
```

### Estimation method

Token counts are **estimated, not measured** — we cannot run the model to know. We use:

1. **Tokenizer** (`@anthropic-ai/tokenizer` / `tiktoken`) for the input prompt and retrieved context.
2. **Historical coefficient per skill.** Every skill run records `(input_tok, output_tok, model)`. The estimator reads the rolling median from the last 20 runs of that skill and uses it as the output predictor. Cold-start skills use a static prior from the skill manifest.
3. **Tool overhead.** Tool definitions add a fixed per-tool token count (measured once per SDK version).
4. **Retrieval preview.** If the skill retrieves from the graph, we run the retrieval (cheap) and count the resulting tokens — the retrieval itself is charged in the estimate.

Estimates carry a **confidence band** (p10 / p50 / p90) displayed as a thin range bar.

### Budget model

- Daily + monthly cap, per user and per product.
- Caps: soft warning at 80%, hard block at 100% (overridable per-run for admins).
- Stored in `packages/ai-core/src/budget/budget-store.ts`.
- Surfaces in topbar (`$2.40 / $10.00` pill) and in Cortex.

### Artifacts to build

- `packages/ai-core/src/token-estimator/`
  - `estimate(plan: ExecutionPlan, graph: GraphSnapshot): Estimate`
  - `ModelPricing` registry (one source of truth for per-model $/tok)
  - `UsageHistoryStore` — rolling median per skill
- **Schema** `schemas/execution-plan.schema.json` — the plan the estimator consumes
- **Schema** `schemas/token-estimate.schema.json` — the result shape
- **Zustand store** `apps/web/app/lib/budget-store.ts`
- **UI component** `packages/ui/src/components/token-estimate.tsx`
- **Cortex panel** — budget + routing history (extends existing Cortex page)
- **AI Skill** `ai-skills/estimate-cost.skill.json`

---

## Integration points

The gate attaches to every prompt entry point. Ranked by priority:

| # | Surface | File | Effort |
|---|---------|------|--------|
| 1 | Cortex prompt box | `apps/web/app/(dashboard)/[orgSlug]/[productSlug]/cortex/page.tsx` | S |
| 2 | Copilot rail | `apps/web/app/components/shared/ops-pilot.tsx` | S |
| 3 | Command palette (⌘K) | `apps/web/app/components/command-palette.tsx` | M |
| 4 | Computer Mode quick action | `apps/web/app/components/shared/computer-mode-panel.tsx` | S |
| 5 | Inline "Ask" in studios | Every studio header | M (via shared component) |
| 6 | AI Skill manual invoke | Skills studio | S |

All six use `<PromptGate />` from `packages/ui`, so wiring is mechanical once the gate is built.

---

## Data contracts

```ts
interface PromptContext {
  entryPoint: 'cortex' | 'copilot' | 'palette' | 'computer-mode' | 'studio-ask' | 'skill-invoke'
  studioKey?: string
  selection?: GraphNodeRef[]
  activePlanId?: string
  recentArtifacts?: GraphNodeRef[]
  computerMode: 'suggest' | 'assist' | 'autopilot'
}

interface EnhancedPrompt {
  raw: string
  enhanced: string
  diff: DiffSegment[]
  variables: TemplateVariable[]
  strategiesApplied: StrategyKey[]
  confidence: number // 0-1
}

interface ExecutionPlan {
  skillId: string
  steps: ExecutionStep[] // each step binds a model + approximate input shape
}

interface TokenEstimate {
  steps: Array<{
    label: string
    model: ModelId
    inputTokens: TokenRange // { p10, p50, p90 }
    outputTokens: TokenRange
    cost: CostRange
  }>
  total: { tokens: TokenRange; cost: CostRange }
  budget: { usedToday: number; capToday: number; projectedAfter: number }
  alternatives: Alternative[]
}
```

---

## Phasing

Five phases. Each phase ends in a shippable, user-visible increment. No phase depends on an unshipped phase.

### Phase A — Foundations (artifacts only, no UI)
- Schemas (`enhanced-prompt`, `execution-plan`, `token-estimate`)
- `packages/ai-core` scaffold with unit tests
- Model pricing registry
- Usage history store (writes only; nothing reads yet)

### Phase B — Token Estimator
- Estimator service
- `<TokenEstimate />` component
- Wire into Cortex (read-only panel showing estimate for the active plan)
- Budget pill in topbar

### Phase C — Prompt Enhancer
- Enhancer service + 5 strategies above
- `<PromptGate />` component
- Wire into Cortex prompt box (first surface)
- Gate preference setting in user menu

### Phase D — Gate everywhere
- Wire the gate into the other 5 entry points
- Shared "ask anywhere" component factored out

### Phase E — Learning loop
- Usage history drives per-skill output-token priors
- Variables extracted across prompts become suggested templates
- Budget alerts (topbar toast at 80%, block at 100%)

---

## Open questions

1. **Enhancer model.** Local Haiku call, or a deterministic rule-based engine, or both (rules first, model fallback)? Recommend hybrid — rules for the 5 strategies, Haiku call only if rules return no change.
2. **Estimator for multi-step plans.** How do we estimate a plan whose later steps depend on earlier outputs? Recommend: estimate step 1 deterministically, estimate later steps with a wider confidence band.
3. **Privacy.** Is the raw prompt ever stored for history / learning? Default to "no, only the enhanced prompt + usage coefficients."
4. **Budget ownership.** Per-user, per-product, or per-org? Recommend per-user by default, with per-product caps for Admin.
5. **Bypass shortcut.** `⌘↵` to send raw is standard — confirm.

---

## Success criteria

- 80%+ of users see the gate at least once per session (measured).
- 40%+ of shown gates result in an enhanced prompt being used (vs. "send as-is").
- <200ms p95 to display the gate after ↵.
- Estimate accuracy: actual tokens within p10-p90 band 80%+ of runs.
- Zero new prompt-entry surfaces added without going through `<PromptGate />` (enforced by lint rule on prompt-submitting handlers).

---

## Out of scope (for now)

- Multi-model ensembling beyond simple routing.
- User-authored enhancement strategies (admin-only initially).
- Cross-product budget pooling.
- Retrospective cost analytics — that lives in Analytics, not here.
