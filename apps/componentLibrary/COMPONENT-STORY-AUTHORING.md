# Primitive story authoring guide

A **primitive story** is the live, source-derived showcase of one `@vybekiit/ui` primitive in
the component library's **Design system** surface: a **gallery** that lays out every real
variant, size, and state **at once** — real, operable components, never a grid of static mockup
cards. It is the primitive equivalent of a [page recipe](./RECIPE-AUTHORING.md). There is no
click-through playground: the whole surface is visible on load; only **RTL** and **dark** toggle
the whole gallery (the renderer applies them — a module never plumbs them).

The reference exemplars are **`dialog`** (behavioral override) and **`button`** (pure auto). See
ADR-0041 (and its 2026-07-12 gallery-first amendment) for the why.

## Derive-first: most primitives need no file

Variant/size options come from each primitive's `cva` config, and the gallery auto-generates. A
non-`cva` **leaf** primitive still auto-renders from sample config — `sampleChildren` /
`sampleProps` / `sampleClassName` in the generator, plus a generic state→prop map
(`disabled`/`readonly`/`error`). **You only hand-author an override when the auto render can't be
live and operable** — i.e. the primitive is a compound/behavioral Radix wrapper (Dialog, Select,
Table, Tabs, Accordion…) or needs realistic content / a triggered state (Input's `aria-invalid`,
an Empty with real copy).

`buildDesignSystemIndex.mjs` marks those primitives `requiresOverride`; the
`check:component-stories` gate fails if their override module is missing.

## The bar

An override is "done" only when **all** of these hold — the same spirit as the recipe bar:

1. **Live & operable.** The gallery renders the *real* primitive and it actually works — open
   the Dialog, toggle the Switch, type to trip an `aria-invalid` Input. No `1s` fake spinners, no
   dead cards standing in for states.
2. **Everything at once.** `ShowAll` lays out every real variant/size/state simultaneously —
   never mockups, never hidden behind a picker — so a buyer (and the agent) sees the whole surface
   on load.
3. **States from the canonical taxonomy.** Any state you demonstrate is one of
   `default · disabled · loading · error · success · empty · readonly · selected`
   (`src/lib/componentStates.ts`) — never an ad-hoc name.
4. **Options derive from `cva`.** Never hard-code the variant/size list an override shows; read it
   from the generated descriptor so it can't drift from source.
5. **Accessibility (WCAG AA).** Real `<label>`s, `aria-invalid` + `aria-describedby` on errors,
   `aria-live` where values change, keyboard operable, semantic markup — a primitive's story is
   also its accessibility proof.
6. **RTL + dark clean.** The preview must survive the RTL and dark/light toggles without breaking.
7. **Clean, typed, documented.** JSDoc on the exported render, `useId` for ids, one component per
   file, biome-clean (0 errors), passes `typecheck`.

## The override module contract

Overrides live at `src/stories/vybekiit/<primitive>.tsx` and export a `PrimitiveStoryModule`:

```tsx
'use client';
import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
// import the real primitive from @vybekiit/ui/<primitive>

/** Every real variant/size/state of the Dialog primitive, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => {/* every real variant/state at once — real components, never mockups */},
};
export default story;
```

The contract is render-only and gallery-first: `{ ShowAll }`. There is no `Playground`, and a
module never reads RTL/dark — the renderer's preview stage applies `dir` + `.dark` around your
output, so just render in logical order and it survives both.

Render lives in the module; **metadata is derive-first**. Family, applicable states, and any
extra prop docs beyond the `cva` axes are configured for the exceptions in
`buildDesignSystemIndex.mjs` (`FAMILY_BY_PRIMITIVE`, `STATES_BY_PRIMITIVE`, `PROPS_BY_PRIMITIVE`,
`REQUIRES_OVERRIDE`) — node can't import TSX, and centralising the ~20 exceptions keeps the
per-file authoring to just the live render.

## Regeneration + gate

After adding/editing an override or the generator config, regenerate the committed index and run
the gate:

```bash
node scripts/dev/sync/buildDesignSystemIndex.mjs   # writes apps/componentLibrary/src/data/designSystem.ts
pnpm check:component-stories                        # also runs inside pnpm verify
```

`src/data/designSystem.ts` is **generated** — don't hand-edit it.

## Done checklist

- [ ] Auto render insufficient → override added under `src/stories/vybekiit/`
- [ ] `ShowAll` renders the real primitive, operable, with every variant/size/state at once
- [ ] No mockups, no picker — the whole surface is visible on load
- [ ] Every state is a canonical `componentStates` id
- [ ] Variant/size options read from the generated descriptor (not hard-coded)
- [ ] Labels, `aria-invalid`/`aria-describedby`, `aria-live`, keyboard; survives RTL + dark
- [ ] JSDoc, one component per file, biome-clean, typecheck passes
- [ ] Index regenerated; `check:component-stories` green
