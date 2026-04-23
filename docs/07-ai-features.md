# AI Features

Product OS integrates AI at every level — from the floating copilot to automated task enrichment and product graph scaffolding.

---

## OpsPilot: The AI Copilot

OpsPilot is the floating AI assistant embedded in the Product OS shell. It provides a conversational interface to your product graph.

### Accessing OpsPilot

- Click the floating purple button (bottom-right of screen)
- Keyboard shortcut: `Cmd+Shift+O` (Mac) / `Ctrl+Shift+O` (Windows)

### What OpsPilot Can Do

| Intent | Example Prompt | Action |
|--------|----------------|--------|
| Answer questions | "What features are in the payment module?" | Queries graph, returns summary |
| Create tasks | "Create a task to fix the login bug" | Inserts task in database |
| Navigate | "Take me to the Components studio" | Triggers navigation |
| Show stats | "What's my product health score?" | Returns graph statistics |
| Scaffold nodes | "Build a checkout workflow with 5 steps" | Creates graph nodes + edges |
| Run analysis | "Why is my design health score low?" | Deep AI analysis with recommendations |

### How Intent Classification Works

OpsPilot uses a two-pass system:

**Pass 1: Regex classification** (fast, deterministic)
- Checks the message against keyword patterns
- Categories: task creation, navigation, stats, scaffolding, analysis
- Returns with confidence score (0.7–0.95)

**Pass 2: AI enrichment** (for complex intents)
- For `scaffold_nodes` and `answer_question` intents, calls Claude
- Full product graph summary is injected as context
- Last 6 messages included for conversation history

### Context Injection

Every AI call includes:
```
Product graph: {nodeCount} nodes, {edgeCount} edges.
  X features, Y components, Z pages...
Current studio: {studioName}
Conversation history: last 6 messages
```

This ensures Claude has full product context without manual copy-paste.

### Contextual Suggestions

When OpsPilot opens, it shows 4–6 contextual suggestions based on:
- The current studio (different suggestions per studio)
- What's missing from the product graph (if no features, suggests scaffolding)
- Product completeness state (empty graph vs. partially built)

---

## AI Skills System

The `@product-os/ai` package provides the `invokeSkill()` function used throughout the API layer.

### Available Skills

| Skill | Used By | Purpose |
|-------|---------|---------|
| `scaffold` | OpsPilot, Planner | Generate graph nodes from a natural language description |
| `suggest` | Task creation, Templates | Enrich entities with AI-generated descriptions and metadata |
| `analyze` | Control Tower, OpsPilot | Deep product health analysis and recommendations |
| `auto-tag` | Graph node creation | Automatically tag new nodes with relevant labels |
| `estimate-effort` | Task creation | Estimate complexity/effort for new tasks |
| `sentiment-analysis` | Comment creation | Detect sentiment in comments |
| `seo-suggestions` | Page publishing | SEO optimization suggestions |
| `brand-compliance-check` | Token updates | Check brand consistency across components |

### Invoking a Skill

```ts
import { invokeSkill } from '@product-os/ai'

const result = await invokeSkill({
  skill: 'scaffold',
  productId: 'abc123',
  prompt: 'Build a user authentication flow with login, signup, and password reset',
  context: {
    graphSummary: '12 nodes, 8 edges. 3 features, 2 pages',
    studioOrigin: 'planner',
    targetStructure: 'feature_breakdown',
  },
  userId: 'user123',
})

// result.success: boolean
// result.data: { nodes[], edges[], summary: string }
// result.rawText: string (if not JSON)
```

### Scaffold Skill Response Format

When the scaffold skill runs successfully, it returns:

```json
{
  "nodes": [
    { "tempId": "n1", "kind": "feature", "label": "Login", "data": { "description": "..." } },
    { "tempId": "n2", "kind": "page", "label": "Login Page", "data": {} }
  ],
  "edges": [
    { "sourceTempId": "n1", "targetTempId": "n2", "kind": "contains" }
  ],
  "summary": "Created 2 nodes: 1 feature, 1 page. Login feature contains Login Page."
}
```

The API layer maps `tempId` references to real database UUIDs during insertion.

---

## Task Enrichment

When OpsPilot creates a task (or when triggered by the `estimate-effort` skill), the task is automatically enriched with:

- **Description** — 1–2 sentence AI-generated description based on the title and product context
- **Priority** — AI-suggested priority based on the task title and graph state

```ts
// From ops-pilot.ts
const aiResult = await invokeSkill({
  skill: 'suggest',
  productId,
  prompt: `Generate description and priority for task: "${title}". Context: ${graphSummary}`,
  ...
})
// Returns: { description: "...", priority: "high" }
```

---

## AI Health Analysis

The Control Tower's AI Insights panel calls `invokeSkill('analyze')` with `analysisType: 'copilot_health'`:

**Prompt includes:**
- Complete graph summary (node counts by kind)
- Studio scores (0–100 per studio)
- Top blockers
- Module readiness data

**Response format:**
```json
{
  "insights": [
    {
      "type": "critical",
      "text": "Your Components studio has 0 component nodes — design-to-dev handoff will be blocked.",
      "action": "Scaffold core UI components",
      "studio": "components"
    }
  ]
}
```

Insight types: `critical`, `warning`, `suggestion`, `positive`

---

## AI Skill History

Every AI invocation is logged to the `ai_skill_history` table:

| Field | Content |
|-------|---------|
| `skill` | Skill name + intent (e.g., `ops_pilot:scaffold_nodes`) |
| `inputContext` | Full context object sent to AI |
| `output` | AI response object |
| `model` | Claude model used (e.g., `claude-3-5-haiku-20241022`) |
| `tokensUsed` | Token count for cost tracking |
| `actorId` | User who triggered the skill |
| `studioOrigin` | Which studio the request came from |

This history enables:
- Debugging AI responses
- Cost analysis and optimization
- Replay and audit of AI actions
- Fine-tuning improvements

---

## Event-Triggered AI

The `aiTriggerHandler` in the events package automatically suggests AI skills in response to user actions:

| Event | Suggested Skill |
|-------|----------------|
| `graph.node.created` | `auto-tag` — add relevant tags to the node |
| `task.created` | `estimate-effort` — assess complexity |
| `comment.created` | `sentiment-analysis` — detect tone |
| `page.published` | `seo-suggestions` — optimize for search |
| `brand.token.updated` | `brand-compliance-check` — verify consistency |

These suggestions are currently logged as debug messages. In a future phase, they will surface as AI action prompts in the relevant studio.

---

## AI Model Configuration

All AI calls go through the `@product-os/ai` package which uses the Anthropic SDK. Current defaults:

| Setting | Value |
|---------|-------|
| Default model | `claude-3-5-haiku-20241022` |
| Max tokens | 4096 |
| Temperature | 0.4 (balanced) |
| Top-P | 1.0 |

The model can be overridden per skill by updating the skill handler in `packages/ai/src/`.

---

## Brand Token Propagation

When a brand token changes, the `brandTokenPropagationHandler` notifies downstream studios:

```
brand.token.updated event fires
  → activityLog entry created
  → Downstream studios notified: components, design, pages, graphics, code, handoff
  → Client-side Zustand graph store auto-invalidates
  → Next query to any affected studio re-fetches fresh token values
```

This ensures design tokens stay consistent across the entire product without manual updates.

---

## AI Limits and Error Handling

All AI calls have graceful fallbacks:

- **Network errors** — return deterministic fallback content based on graph data
- **Invalid JSON response** — attempt to extract JSON with regex, otherwise fall back to raw text
- **Timeout** — caught and handled with user-friendly error message
- **Rate limiting** — 429 responses are caught and surfaced as "AI busy, try again shortly"

No AI failure causes a critical error in the UI.

---

## Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and verify your email
3. Go to API Keys → Create Key
4. Copy the key (starts with `sk-ant-api03-...`)
5. Add to `.env.local` as `ANTHROPIC_API_KEY`

**Recommended tier for development:** Claude Claude 3.5 Haiku — fast and affordable for development iteration.

**Recommended tier for production:** Claude 3.5 Sonnet — better quality for scaffold and analysis tasks.
