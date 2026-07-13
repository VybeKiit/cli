# ADR-0041: Design-system view for `@vybekiit/ui` primitives (primitive stories)

## Status

Accepted.

## Context

`@vybekiit/ui` is the SSOT for web/extension UI (73 primitives), yet the component
library gallery (`apps/componentLibrary`, ui.vybekiit.com) never showed a single one of
them. The gallery index is generated from the `templates/web` third-party mirror plus
`templates/web/.vybekiit/agent/ui-catalog-index.json`; the primitives are in neither —
they ship as a `workspace:*` source package that is deliberately not mirrored into buyer
templates (ADR-0033, ADR-0035). The upshot: the `vybekiit` namespace in the gallery is 213
Claude-octopus mascot poses + 3 tools and **zero primitives**. The one surface that is
supposed to present our design system showed everything except the design system.

The gallery is also one-preview-per-catalog-entry: there is no notion of a component's
variants, sizes, states, or empty states — the exact affordances a professional UI-library
reference (shadcn/Radix/MUI docs) is judged on, and the thing the primitives most needed.

## Decision

Add a first-class **design-system view** for the `@vybekiit/ui` primitives.

1. **Scope: primitives only.** Only the `vybekiit` namespace gets this treatment; the 16
   third-party namespaces stay as-is (a curated grab-bag with no shared variant semantics).
2. **Live, and all at once.** Each primitive renders a **gallery** that lays out every real
   variant, size, and state *simultaneously* — real, operable components, never static mockup
   grids (consistent with the recipe standard,
   [RECIPE-AUTHORING.md](../../apps/componentLibrary/RECIPE-AUTHORING.md), which bans dead
   "variant cards"). RTL and dark are the only controls; they flip the whole gallery. See the
   [2026-07-12 amendment](#amendment-2026-07-12--gallery-first-not-a-picker) — the original
   decision was a single-instance *playground* with variant/size/state pickers, which buried
   the surface behind clicks.
3. **Derive-first authoring.** Variant/size options are derived from each primitive's `cva`
   config (SSOT, no drift). Playgrounds auto-generate; a hand-authored live **override** is
   required only for behavioral/degenerate primitives (Dialog, Select, Table, Form, Tabs,
   Input's invalid state…). Only 12 of 73 primitives use `cva`, and the compound Radix
   wrappers can't render live from types alone, so pure auto-gen would produce lifeless
   shells for the other 61.
4. **Overrides live in the showcase app** (`apps/componentLibrary/src/stories/vybekiit/`),
   never in `packages/ui`. The design-system package stays pure and unshipped-to-buyers
   (the sync already skips `*.story.tsx` / `*.demo.tsx`).
5. **One shared state taxonomy.** `apps/componentLibrary/src/lib/componentStates.ts` defines
   the canonical set — `default · disabled · loading · error · success · empty` plus
   control-specific `readonly`/`selected` — used by BOTH primitive stories and the
   page-recipe state index, so the whole gallery speaks one vocabulary. Every preview also
   carries RTL + dark/light toggles (RTL is a product differentiator, per COMPETITIVE-FEATURES).
6. **A generator + gate mirror the page-recipe pipeline.**
   `scripts/dev/sync/buildDesignSystemIndex.mjs` emits the generated
   `apps/componentLibrary/src/data/designSystem.ts`; `check:component-stories`
   (`scripts/dev/checks/checkComponentStories.mjs`, wired into `verify`) fails when a
   primitive lacks a live preview, a behavioral primitive lacks its override, `cva` options
   drift from the generated index, or a declared state falls outside the taxonomy.

### Considered options

- **Pure auto-gen from `cva` + TS types** (no hand-authoring): rejected — 61/73 primitives
  have no `cva`, and compound Radix wrappers can't produce an operable preview from types,
  yielding lifeless shells across 84% of the library.
- **Colocate stories in `packages/ui/src/*.stories.tsx`**: rejected — injects showcase
  harness into the lean owned design-system package and diverges from where every other
  namespace's demos live (`apps/componentLibrary/src/demos/<namespace>/`).
- **Static variant matrices** (shadcn-docs style side-by-side): rejected — contradicts the
  recipe standard and the "everything live" decision; "show all" renders real components, not
  mockups.

## Consequences

- Editing a primitive updates the gallery from `cva` for free; only behavioral primitives
  need a hand-authored override, and the gate enforces that they have one.
- Trade-off accepted: ~20 override render modules maintained by hand, in exchange for
  genuinely live/operable previews across the whole library.
- `packages/ui` stays pure; all showcase concerns live in `apps/componentLibrary`.
- The state taxonomy is now a shared contract — recipe `statesCovered` and primitive `states`
  both validate against `componentStates.ts`, so recipes and primitives read as one system.

## Amendment (2026-07-12): gallery-first, not a picker

The first cut shipped decision #2 as a single-instance **playground** — one preview plus
variant/size/state pickers you clicked through, with a collapsible "show all". In review that
inverted the point of a design-system reference: the whole surface was hidden behind clicks, so
the page didn't *read* as a professional library. Corrected:

- **The gallery is the page.** Every variant, size, and state renders at once, labelled and
  sectioned (Variant / Size / State). The pickers and the "show all" toggle are gone; **RTL and
  dark** are the only remaining controls, and they re-render the whole gallery in that mode.
- **The override contract drops `Playground`.** A `PrimitiveStoryModule` is now just
  `{ ShowAll }` — a module lays out all of its states at once and never plumbs RTL/dark (the
  renderer's preview stage applies `dir` + `.dark`). The 4 original overrides were migrated.
- **Leaf auto-render gained sample config.** Non-`cva` leaf primitives (Textarea, Progress,
  Skeleton, Separator, Kbd…) auto-render from `sampleChildren` / `sampleProps` / `sampleClassName`
  plus a generic state→prop map (`disabled`/`readonly`/`error`), so breadth no longer requires an
  override per primitive.
- **Fan-out is incremental behind the gate.** The tracer bullet's 5 primitives grew to **26**
  across 7 families (added a **Brand** family for vybekiit's bespoke flair). Each further
  primitive is added by extending the `PRIMITIVES` array; `check:component-stories` still fails a
  behavioral primitive that lacks its override, so coverage can only grow correctly.

## Amendment (2026-07-12b): full coverage — all 69 primitives

The fan-out is complete: the gallery now covers **all 69 `@vybekiit/ui` primitives** (6 further
auto leaves + 37 further hand-authored overrides on top of the 26). Every `/design-system/[slug]`
route renders 200. This clarified two things and added one tradeoff:

- **Two surfaces, not one.** The design-system gallery is *only* our own 69 primitives (the
  `vybekiit` namespace). The ~1,973 components across the 16 third-party libraries (coss, magicui,
  tailark, cult, ai-elements, …) are **already** presented in the **catalog browser** — they are a
  curated grab-bag with no shared variant semantics, so they intentionally do not get the
  all-variants-at-once gallery treatment (decision #1). "More components" = finishing *our*
  primitives, which this did.
- **Three showcase-only deps.** `form`, `chart`, and `sonner` demos need the underlying lib
  imported directly, so `react-hook-form`, `recharts`, and `sonner` were added to the
  **componentLibrary app** `dependencies` (the primitives already depend on them in
  `packages/ui`; the app couldn't resolve them because pnpm keeps node_modules isolated). Every
  other override composes only `@vybekiit/ui/*` sub-components, whose internal deps resolve from
  `packages/ui`.
- **Tradeoff — the registry is eager.** `designSystemStories.tsx` imports all 69 story modules
  statically, so the shared `/design-system/[slug]` bundle now pulls recharts + embla +
  react-day-picker + cmdk + vaul into one chunk (~4.4k modules; a slow one-time dev cold-compile).
  Functionally fine and cached after first hit, but a **follow-up should lazy-load each story via
  `next/dynamic`** so a slug only ships its own component. Deferred (bigger change: the override
  default export is a `{ ShowAll }` object, not a component, so `dynamic()` needs a `.then()` map).
