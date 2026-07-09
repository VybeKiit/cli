# Page recipe authoring guide

Page recipes (`src/pageRecipes/*.tsx`) are **production-ready, plug-and-play page templates** — a buyer copies one into their app and ships it. They are **not** mockups or brochures. A recipe that only relabels another one's strings, fakes interactivity, or shows edge states as dead cards is **not done**.

The reference exemplar is **`CheckoutPage.tsx`** — copy its shape, not the old `DemoQuickWinPage` wrapper stubs.

## The bar

A recipe is "done" only when **all** of these hold:

1. **Realistic data.** Multi-item, varied, believable — not single-item lists or lorem. (Checkout ships 3 goods across digital/physical/service with real prices + quantities.)
2. **Live, togglable states — not static "variant cards."** Empty, loading, error, and success are *real states the page enters*, reachable by interacting: remove all items → empty; Pay → processing → confirmed; bad coupon → inline error. Never fake them with a grid of mockup cards.
3. **Real local interactivity.** State actually changes: quantities recompute totals, coupons apply/validate, forms submit + validate. Local React state only — no backend needed to demo it. No `1s` fake spinners standing in for real flows.
4. **Accessibility (WCAG AA).** Real `<label>`s (never placeholder-as-label), `aria-invalid` + `aria-describedby` on errors, `aria-live` for values that change (totals), keyboard operable controls, focus moved to the confirmation heading on success, semantic `main`/`h1`/`section`, `role`/`aria-label` on control groups.
5. **Responsive.** Real reflow from mobile to desktop (Checkout: 2-col form + summary on `lg`, single column below, sticky summary).
6. **Concrete integration hooks.** A `<details>` "Plug this into your app" panel with the *actual* contract — the API call, its request/response shape, and what's already wired — **not** a vague "connect your provider." Tie it to real VybeKiit packages (`@vybekiit/payments`, the shipped `/api/webhook`, etc.).
7. **Clean, typed, documented.** JSDoc on the exported component, integer **cents** for money, `useId` for ids, biome-clean (0 errors), passes `typecheck`.

## Structure

```tsx
'use client'; // any recipe with state/hooks
// imports: @vybekiit/ui/<primitive> (lowercase paths), lucide-react, react, ./shared/Demo*
export const XPage = () => {
  /* state + handlers + early-return states (success/empty) + main render */
};
```

- Wrap the view in the gallery controls: `DemoThemeRandomizer` › `DemoTransitionStage` (see Checkout's `Frame` helper).
- Use `@vybekiit/ui` primitives (`button`, `card`, `input`, `radio-group`, `alert`, `separator`, …) — this doubles as a design-system stress test. Don't hand-roll what the kit already provides.

## Manifest + regeneration

Each recipe has an entry in `scripts/data/page-recipe-manifest.json` under `groups[].recipes[]`:

- **`installNotes`** — the real integration steps (API contract + owner), not "connect a provider."
- **`acceptanceChecks`** — *testable* statements ("VYBE20 applies 20% off; an unknown code shows an inline error"), not aspirational prose ("the page shows states").

After editing a recipe or the manifest, regenerate the committed index:

```bash
node scripts/dev/sync/buildPageRecipeIndex.mjs   # writes src/data/pageRecipes.ts + pageRecipeComponents.tsx
```

Those two files are **generated** — don't hand-edit them.

## Done checklist

- [ ] Realistic, multi-item data
- [ ] Empty / loading / error / success are **live** states reachable by interaction
- [ ] Totals / derived values recompute from real state
- [ ] Labels, `aria-invalid`/`aria-describedby`, `aria-live`, keyboard, focus-on-success
- [ ] Responsive reflow (mobile → desktop)
- [ ] `<details>` integration panel with the **real** API contract
- [ ] JSDoc, integer cents, biome-clean, typecheck passes
- [ ] Manifest `installNotes` + `acceptanceChecks` updated; index regenerated
