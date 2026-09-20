# Brand Kit

> A working design system from a short brief — in Figma, in code, and as a brand
> book you can hand to someone.

**Status: pre-MVP, nothing built.** This document is the plan of record for the
next product. It supersedes `00-ground.md` as the active workstream; Ground itself
is paused, not deleted (see *What happens to Ground*).

---

## Where this came from

The ambition is Relume's, applied to products rather than marketing sites: plan
the product, preview it on a canvas, generate its brand, then build it.

Relume is worth copying carefully rather than loosely. It is **not** an OS. It
does one artefact — sitemap to wireframe to Figma — for people who build
marketing sites repeatedly. Narrow job, high frequency, hard deliverable. That
focus is the reason it works, and it is the part that gets copied last.

The four-section shape (Plan / Canvas / Brand / Build) is the 32-studio shape
under better names. The previous product did not fail because those sections were
wrong; it failed because **no single section was worth opening on its own**, so
nothing was ever worth finishing.

Exactly one of the four passes that test. A user who finishes only Plan has a
document. A user who finishes only Canvas has a picture. A user who finishes only
Brand has **a design system they can build with tomorrow.**

So Brand is first, alone, and the rest is sequenced behind evidence.

## The binding rule

Carried over from Ground, because it is the rule that fixed it:

> **Useful to one person, on day one, with no integrations, no teammates, and
> nothing else in the product finished.**

Anything that fails this is not in the MVP.

## The product

Someone answers a short brief about what they are building. They get back a
complete, contrast-verified design system, delivered three ways:

| Output | Why it matters |
| --- | --- |
| **Brand book** | A page that explains the system and can be downloaded and handed over |
| **Figma file** | Real variables with Light and Dark modes, and components bound to them |
| **`tokens.css`** | Drop into a codebase and start building immediately |

The three are generated from one source, so the names match exactly across all of
them.

## The wedge

Every AI brand tool on the market outputs a good-looking PDF. Almost none output
**a working system in both Figma and code that actually drives a build.**

That gap is the whole opportunity, and it is not hypothetical: the Figma
machinery already exists in this repository and was verified by hand — 28 colour
variables across two modes, 11 space and 8 form variables, an 11-style type ramp,
and components bound to variables rather than raw hex. Building it for Ground
turned out to be building the product.

A PDF is a picture of a design system. This is the design system.

## What the MVP does, precisely

**In:** product name, one line on what it is, and a small number of forced
choices — warm or cool, quiet or loud, geometric or humanist, dense or airy. A
handful of decisions, not a forty-field form. Forced choices beat free text here
because they are answerable in seconds and they constrain the generator.

**Out:**

- A palette: canvas, raised, sunken, ink at three weights, lines at three
  weights, one brand colour with wash and line variants, and semantic colours for
  success, warning, danger and info
- The same palette in dark, generated as a **peer** rather than an inversion
- A type pairing — one face for prose, one mono for anything a machine also reads
  — with an eight-step scale
- Space on a 4px grid, three control heights, four radii, three warm-tinted
  elevations
- A typographic **wordmark** set in the chosen display face
- The brand book, the Figma file, and `tokens.css`

## Decisions already made

**Colour is generated in OKLCH, not hex or HSL.** Contrast has to be *guaranteed*,
not hoped for, and only a perceptual space lets you hold lightness steady while
moving hue. Every foreground/background pair is checked against WCAG AA before it
ships, in both modes, and the generator retries rather than emitting a failing
pair.

This is not theoretical. Building Ground's Figma library, filled buttons carried
literal white labels that failed against the lighter moss used in dark mode — a
real contrast defect, caught by eye, in a system that was otherwise carefully
built. A generator that produces that failure at scale is worse than no generator.

**Light and dark are generated together and verified separately.** Dark is not an
inversion. Ground's own token set does this and it is the right shape.

**Token names are the contract.** `canvas`, `ink-muted`, `brand-wash` mean the
same thing in the Figma variable, in `tokens.css`, and in the brand book. Without
that, the three outputs drift apart and the whole claim collapses. A related bug
proved the cost: CSS referencing `--g-moss` and `--g-ink-3`, neither of which
existed, rendered as inherited colour and failed silently. Names are load-bearing.

**No pictorial logo generation.** Generated logos are poor, legally hazardous, and
would be the least credible thing on the page. A typographic wordmark from the
chosen face is honest, genuinely useful, and something a system can actually do
well. If someone wants a mark, they commission one.

## Non-goals

Stated so they can be pointed at later:

- **Not the Canvas.** A template and wireframe library is years of component work
  by a team. Building it before there are users is precisely how the last version
  reached 32 studios with 17 of them mocked.
- **Not the Plan section** — that is Ground, and it is paused.
- **Not the Build.** Deliberately deferred by the same reasoning.
- **Not logos, illustration, or marketing copy.**
- **Not team features.** Multiplayer is an upgrade, never the price of entry.

## What happens to Ground

Paused, not retired. It stays deployed and working at its current URL, with its
database intact. Development stops.

It is worth keeping because the sections fit together later: Ground is a Plan
section that agents can already read. If Brand Kit works, Plan becomes Ground,
Build queries it over MCP, and nothing has to be rebuilt.

What Ground leaves behind, already proven and reusable:

- The Figma variables-and-modes pipeline, including its limits — cross-file
  binding needs a manual library publish the API cannot perform
- The token set and its naming, as a worked reference
- Auth, sessions, the invite gate, CI, and the schema tooling
- The lesson that a surface is not real until it has been run against a live
  database in a real browser

## Phases

1. **The generator.** OKLCH palette synthesis with enforced contrast, type
   pairing, scale. Pure functions, no UI. Verified by asserting contrast across
   many generated systems rather than by looking at one.
2. **`tokens.css` output.** The first thing that is useful alone.
3. **The brief.** The short input form.
4. **The brand book.** Rendered from the same source, downloadable.
5. **Figma export.** Variables with modes, via the API, names matching exactly.
6. **Accounts and persistence** — only once there is something worth saving.

Phase 1 is where the quality lives. Everything after it is delivery.

## Open questions

- **The name.** "Brand Kit" is provisional and almost certainly taken. Naming can
  wait, but not past the point where it enters the codebase — that is the mistake
  `ground.dev`, still unverified, is currently making.
- **Where the type pairing comes from.** A curated set of Google Fonts pairs is
  honest, shippable, and licence-safe. Generating pairings is not obviously
  better and is much harder to make good.
- **How opinionated the generator should be.** A system that produces one strong
  answer is more useful than one producing ten mediocre variants, but it is also
  easier to reject. Probably: one strong answer, with a small number of
  regenerations.
- **Whether the brand book is a page or a file.** A live page is better and
  cheaper; a download is what people ask for. Likely both, from one source.
