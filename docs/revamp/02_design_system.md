# Revamp R2 — Design System Pass

_Deliverable for Phase R2 of the Product OS design revamp._
_Status: shipped — contract for R3+._

## What R2 did

- **Unified two systems.** Both `.tool-*` utility classes (globals.css) and `packages/ui` primitives now consume the same CSS variable layer. No more indigo-500 vs `--accent` drift, no more `#F1F5F9` vs `--text-primary` drift.
- **Editorial/spatial shift.** Base font 13px → 15px. Line-height 1.45 → 1.55. Radii softened. Motion quieter (no bounce, ease-out). Generous padding on cards/modals/empty states.
- **Typographic hierarchy.** Introduced Fraunces serif for display + H1 (editorial feel); Inter for body/UI; JetBrains Mono for code. New scale: Display 48 / H1 32 / H2 24 / H3 18 / Body 15 / Label 13 / Caption 12 / Eyebrow 12uppercase.
- **Icon-size lockdown.** Only `--icon-sm` (16), `--icon-md` (20), `--icon-lg` (24). 9/10/11/12/13/14/18 are deprecated.
- **Canonical primitives.** `<PageHeader>`, `<EmptyState>`, `<Card>`, `<Modal>` (with header/title/description/body/footer), `<Button>`, `<Input>`, `<Textarea>` — all in `packages/ui`, all using CSS vars.
- **Motion tokens.** `--duration-instant` (80ms) · `--duration-fast` (180ms) · `--duration-base` (280ms) · `--duration-slow` (480ms) · `--duration-entrance` (600ms). `--ease-out` = cubic-bezier(0.22, 1, 0.36, 1). No spring.

## Rules of the road

### Typography

- Use **CSS vars** (`var(--font-size-body)`) or **utility classes** (`.t-body`, `.t-h1`, `.t-eyebrow`) — not hardcoded px or Tailwind `text-sm`.
- **Serif** (Fraunces) is reserved for: Mode headers, PageHeader titles, first-run hero moments. **Do not** use serif for long-form body or controls.
- **Eyebrow** caps are `--font-size-caption` + uppercase + `0.08em` letter-spacing. Use `.t-eyebrow`.

### Spacing

- **8px baseline rhythm.** Use `--space-N` CSS vars or the `spacing` token.
- **Vertical rhythm.** Section gaps: 32 (sm) / 48 (md) / 64 (lg). Use `--section-gap-*`.
- **Page padding.** Studios use `px-10 pt-8 pb-6` (PageHeader) and `px-10` (body). Do not use `px-4` / `px-6` at page level.

### Color

- All chromatic decisions route through CSS vars. **Never hardcode hex** in a component.
- Studio accent colors (brand pink, component purple, etc.) go in a future `--studio-<name>-accent` token — do not hardcode until that exists.
- Semantic: `--color-success`, `--color-warning`, `--color-error`, `--color-info`. Always with `-muted` variant for backgrounds.

### Radii

- `--radius-xs` 4 → small chips, kbd
- `--radius-sm` 6 → inputs, segment buttons
- `--radius-md` 10 → cards, panels, dropdowns
- `--radius-lg` 14 → modals, large surfaces
- `--radius-xl` 20 → hero surfaces, first-run
- `--radius-full` → pills, avatars

### Motion

- Editorial = quiet. **No bounce / spring.** Always `--ease-out`.
- Default transition: `180ms ease-out` for color/background/border.
- Entrance: `280ms ease-out` for scale/opacity (modals, dropdowns).
- Slow emphasis: `480ms ease-out` for large layout shifts (Mode transitions — R3+).
- Stagger children by 40–60ms.

### Icons

- Sizes: `16` (default in lists/buttons), `20` (toolbar/card accents), `24` (headers/features).
- Lucide React. Stroke-width `1.75` default.

### Button variants

- `primary` — filled accent, for single key action per screen
- `secondary` — surface-elevated with border, for most actions
- `ghost` — text-only hover-filled, for nav/toolbar
- `danger` — transparent with error tint
- `outline` — transparent with strong border

Sizes: `sm` (h-8) · `md` (h-9, default) · `lg` (h-11).

### Page structure (every studio)

```tsx
import { PageHeader } from '@product-os/ui'

export default function StudioPage() {
  return (
    <div className="tool-workspace">
      <PageHeader
        eyebrow="Build Mode"
        title="Components"
        subtitle="Reusable primitives and variants, bound to brand tokens."
        actions={<Button>New Component</Button>}
      />
      <div className="studio-body">
        <section className="studio-section">…</section>
      </div>
    </div>
  )
}
```

The `.studio-body` + `.studio-section` classes enforce vertical rhythm.

## What's deprecated (do not add new usage)

- Raw hex literals (`#F1F5F9`, `#0C1024`, `#EC4899`) in components — use CSS vars.
- `text-xs` / `text-sm` Tailwind classes at page level — use `.t-body` / `.t-label` / `.t-caption`.
- Icon sizes other than 16 / 20 / 24.
- Motion with `stiffness` / `damping` spring in new code — use duration + ease-out.
- Inline border colors like `border-white/[0.08]` — use `var(--border-default)`.
- `rounded-xl` / `rounded-lg` at page level — use `--radius-*` vars.

## What's not done in R2 (on purpose)

- **Bulk migration of all 193 call sites of `.tool-btn`/`.tool-input`/`.tool-card`.** They still work (restyled in place). Studios will migrate to `<Button>`/`<Input>`/`<Card>` incrementally as each phase touches them (R3 shell, R4 workspace, R5 brand, …). The lint rule to block new `.tool-*` class usage is deferred to R12.
- **Light theme.** The token layer supports it, but no light palette is defined yet. Deferred to R11.
- **Studio accent color tokens.** Current studio hues (brand pink, design blue, etc.) are still hardcoded in graph nodes. Wiring them into `--studio-*-accent` vars is R8 (Graph as Spine).

## Verification

- [x] `globals.css` uses CSS vars consistently; no raw hex in utility classes
- [x] `packages/ui/Button`, `Card`, `Input`, `Textarea`, `Modal`, `EmptyState`, `PageHeader` use CSS vars (no hardcoded hex)
- [x] Typography scale matches between CSS vars and `tokens/typography.ts`
- [x] Editorial shift visible at runtime (confirmed via preview in R2 end-of-phase walkthrough)

## Handoff to R3

R3 (New Shell) should use:
- `<PageHeader>` for any new Mode landing pages
- `--topbar-h` (52px), `--sidebar-w` (236px) for new shell dimensions
- `.tool-list-item` for sidebar entries (restyled, 36px tall)
- `--duration-base` (280ms) for Mode-transition layout shifts
