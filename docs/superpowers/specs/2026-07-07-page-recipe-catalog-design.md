# Page Recipe Catalog Design

Date: 2026-07-07
Status: Approved design direction, implementation pending

## Goal

Add a **Pages** tab to `apps/componentLibrary` that lets a vibe coder browse full SaaS page
recipes, preview them in desktop, tablet, and mobile frames, open each recipe on its own route, copy
the ready component source, or copy an agent prompt that installs it into a buyer app.

The catalog is source-backed and functional inside the component library. It is not automatically
scaffolded into `templates/web`; templates consume recipes only when the vibe coder copies one or
asks an agent to install it.

## Decisions

- Use the canonical terms in `LANGUAGE.md`: **Page recipe catalog**, **Page recipe manifest**,
  **Feature recipe group**, **Recipe integration TODO**, and **Recipe install notes**.
- Keep runnable recipe components under `apps/componentLibrary/src/pageRecipes/*`.
- Keep the maintained manifest at `scripts/data/page-recipe-manifest.json`.
- Generate component-library data to `apps/componentLibrary/src/data/pageRecipes.ts`.
- Add `scripts/dev/sync/buildPageRecipeIndex.mjs` for validation and generation.
- Add `scripts/dev/checks/checkPageRecipes.mjs` and wire it into `pnpm verify`.
- Cover every DB preset and buyer-facing goal skill with at least one Feature recipe group in v1.
- Recipes use safe default values, not fake backend records.
- Real app wiring points are explicit `TODO:` comments in the recipe source.
- Install notes are manifest-authored and checked.
- Pricing and other business-owned values must point to the owning provider/config, not tell the
  vibe coder to edit UI literals.

## Source Model

`scripts/data/page-recipe-manifest.json`

- Maintainer-authored versioned manifest.
- Defines Feature recipe groups, display order, labels, recipe IDs, recipe source paths, export
  names, target routes, suggested component IDs, install notes, provider pointers, and acceptance
  checks.
- Maps groups to DB preset IDs from `packages/db/presets/*/preset.manifest.json`.
- Maps groups to buyer-facing goal skill IDs from `packages/agentKit/src/catalogs/goalCatalog.ts`.

`apps/componentLibrary/src/pageRecipes/*`

- Real TSX recipe source rendered by the component library.
- Uses named exports such as `AuthPage`, `PricingPage`, and `SettingsPage`.
- Contains safe defaults for local rendering.
- Contains `TODO:` comments where Supabase, payments, email, Cloudflare, or other services must be
  connected in a real buyer app.

`scripts/dev/sync/buildPageRecipeIndex.mjs`

- Reads the manifest, recipe source paths, DB preset manifests, and goal catalog.
- Validates source paths, export names, duplicate IDs, target routes, provider pointers, and install
  notes.
- Emits `apps/componentLibrary/src/data/pageRecipes.ts` with typed metadata for the app.
- Runs from `apps/componentLibrary` `predev` and `build`, alongside the existing component index
  generator.

`scripts/dev/checks/checkPageRecipes.mjs`

- Runs in `pnpm verify`.
- Fails on missing DB preset coverage.
- Fails on missing buyer-facing goal skill coverage.
- Fails when a pricing/payment recipe lacks a payment-provider pointer.
- Fails when a recipe has integration TODOs in source but no matching install notes.
- Prints a clear missing list so the next agent knows exactly what to add.

## UI Contract

- The component library sidebar gains a top-level **Pages** entry alongside the existing component
  browsing flow.
- The Pages view groups recipes by Feature recipe group.
- Recipe cards show the recipe name, target route, linked feature group, short install notes, and a
  responsive preview.
- Preview cards support desktop, tablet, and mobile frame sizes using the component library's
  existing preview/device-frame patterns where possible.
- Each recipe has a full route, recommended as `/pages/[slug]`, for functional inspection.
- Preview iframes should use a clean embed route, recommended as `/embed/pages/[slug]`, so grid
  cards do not render the full catalog chrome.
- The detail route exposes copy component source and copy agent prompt actions.
- The prompt action should reuse the existing component prompt patterns, but describe the page
  recipe target route, source component, install notes, and provider-owned setup.

## V1 Coverage

V1 is broad before it is deep. Every DB preset and every buyer-facing goal skill gets one functional
Page recipe minimum. Related presets and skills may share a Feature recipe group when they represent
one user-facing capability.

Examples:

- Auth recipes cover sign in, sign up, verify, reset password, email link, phone sign-in, and Google
  sign-in as a Feature recipe group.
- Payments recipes cover pricing and checkout handoff, with provider-owned price notes.
- Teams recipes cover invite/member management.
- Search recipes cover a searchable results page.
- AI recipes cover a simple AI chat or assistant page.
- Blog recipes cover index and article routes.
- Utility skills such as go-live, doctor, harden, update-kit, and check-safety can use checklist or
  status-style pages rather than pretending to be backend integrations.

## Non-Goals

- Do not add all recipes to `templates/web` by default.
- Do not create fake production records to make previews look real.
- Do not make UI card text the source of truth for pricing, plan IDs, emails, webhook URLs, secrets,
  or provider-owned settings.
- Do not duplicate the DB preset or goal skill catalogs inside the page recipe manifest.
- Do not implement route variants for every page before v1 coverage is green.

## Verification

The implementation should add focused tests and checks:

- `node scripts/dev/checks/checkPageRecipes.mjs`
- `node scripts/dev/sync/buildPageRecipeIndex.mjs --check` if the generator supports check mode
- `pnpm --filter vybekiit-component-library typecheck`
- `pnpm --filter vybekiit-component-library build`
- Component-library Playwright smoke coverage for Pages navigation, device previews, full recipe
  route, copy code, and copy prompt
- Full `pnpm verify` after the feature is complete

## Implementation Slices

1. Add the manifest schema shape, generator, generated `pageRecipes.ts`, and hard check.
2. Add the Pages sidebar entry, grouped recipe grid, detail route, and embed route.
3. Add the first broad recipe set until DB preset and buyer skill coverage is green.
4. Add copy-source and copy-agent-prompt actions.
5. Add typecheck, script, and Playwright coverage.

## Worktree Note

The current worktree has many unrelated staged and unstaged changes. Implementation work should stage
and commit only the page-recipe paths it edits.
