# Page Recipe Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the component-library Pages tab with source-backed SaaS page recipes, responsive
previews, full routes, copy source, copy prompt, and hard coverage checks.

**Architecture:** A maintained JSON manifest drives generated typed app data. Runnable recipe
components live only in `apps/componentLibrary/src/pageRecipes/*`; the component library renders
them in grid, detail, and embed routes. Script validation reads DB preset manifests and
`goalCatalog.ts` so coverage cannot drift.

**Tech Stack:** TypeScript, Next.js App Router, React 19, shadcn-style `@vybekiit/ui`, Node `.mjs`
maintainer scripts, Vitest script tests, Playwright smoke tests.

## Global Constraints

- Follow `CODE-STYLE.md` exactly: camelCase authored files, `.mjs` maintainer scripts, no `any`,
  named exports, TSDoc on exported functions, and narrow path-scoped edits.
- Do not scaffold recipes into `templates/web`.
- Recipes use safe default values, not fake backend records.
- Integration points use explicit `TODO:` source comments.
- Install notes are manifest-authored and checked.
- Pricing and payment notes point to the active payment provider/config, not UI literals.
- `pnpm verify` must include the page-recipe hard check.

---

### Task 1: Manifest Validation And Generated Data

**Files:**
- Create: `scripts/data/page-recipe-manifest.json`
- Create: `scripts/dev/sync/buildPageRecipeIndex.mjs`
- Create: `scripts/dev/sync/buildPageRecipeIndex.test.mjs`
- Create: `scripts/dev/checks/checkPageRecipes.mjs`
- Modify: `package.json`
- Modify: `apps/componentLibrary/package.json`

**Interfaces:**
- Produces: `PAGE_RECIPE_GROUPS`, `PAGE_RECIPES`, `PAGE_RECIPE_BY_SLUG`,
  `FEATURE_RECIPE_GROUPS`, `type PageRecipe`, `type PageRecipeGroup` in
  `apps/componentLibrary/src/data/pageRecipes.ts`.
- Produces: CLI command `node scripts/dev/checks/checkPageRecipes.mjs`.

- [ ] **Step 1: Write failing tests**

Create `scripts/dev/sync/buildPageRecipeIndex.test.mjs` with tests that assert:
- DB preset IDs are discovered from `packages/db/presets/*/preset.manifest.json`.
- Web-facing goal IDs are discovered from `packages/agentKit/src/catalogs/goalCatalog.ts`.
- A manifest missing a preset, goal, payment provider pointer, or matching install note throws a
  useful error.
- A valid manifest emits typed generated data containing a recipe source string.

- [ ] **Step 2: Run tests red**

Run: `pnpm exec vitest run --root scripts scripts/dev/sync/buildPageRecipeIndex.test.mjs`

Expected: fails because the generator module does not exist yet.

- [ ] **Step 3: Implement generator and check script**

Implement exported helpers in `buildPageRecipeIndex.mjs`:
- `readDbPresetIds`
- `readWebGoalIds`
- `validatePageRecipeManifest`
- `buildPageRecipeIndex`
- `main`

Implement `checkPageRecipes.mjs` as a thin wrapper that calls `buildPageRecipeIndex({ check: true
})`.

- [ ] **Step 4: Add initial manifest**

Create `scripts/data/page-recipe-manifest.json` with broad v1 groups covering every current DB
preset and every current web-facing goal ID.

- [ ] **Step 5: Run tests green**

Run: `pnpm exec vitest run --root scripts scripts/dev/sync/buildPageRecipeIndex.test.mjs`

Expected: pass.

- [ ] **Step 6: Wire scripts**

Add `check:page-recipes` to root `package.json` and include it in `verify`. Add
`buildPageRecipeIndex.mjs` to `apps/componentLibrary` `predev` and `build`.

---

### Task 2: Runnable Recipe Components

**Files:**
- Create: `apps/componentLibrary/src/pageRecipes/*.tsx`

**Interfaces:**
- Consumes: manifest `sourcePath` and `exportName` values.
- Produces: named React exports such as `AuthPage`, `PricingPage`, `LaunchChecklistPage`.

- [ ] **Step 1: Create source-backed recipes**

Add a broad starter set of functional recipe pages. Each page must render with safe defaults, have
responsive layout, and include `TODO:` comments for real app wiring.

- [ ] **Step 2: Generate data**

Run: `node scripts/dev/sync/buildPageRecipeIndex.mjs`

Expected: writes `apps/componentLibrary/src/data/pageRecipes.ts`.

- [ ] **Step 3: Validate source coverage**

Run: `node scripts/dev/checks/checkPageRecipes.mjs`

Expected: pass.

---

### Task 3: Pages UI Routes And Copy Actions

**Files:**
- Create: `apps/componentLibrary/app/pages/page.tsx`
- Create: `apps/componentLibrary/app/pages/[slug]/page.tsx`
- Create: `apps/componentLibrary/app/embed/pages/[slug]/page.tsx`
- Create: `apps/componentLibrary/src/components/PageRecipeBrowser.tsx`
- Create: `apps/componentLibrary/src/components/PageRecipeCard.tsx`
- Create: `apps/componentLibrary/src/components/PageRecipeDetail.tsx`
- Create: `apps/componentLibrary/src/components/PageRecipeFrame.tsx`
- Create: `apps/componentLibrary/src/components/CopyPageRecipeSourceButton.tsx`
- Create: `apps/componentLibrary/src/components/CopyPageRecipePromptButton.tsx`
- Modify: `apps/componentLibrary/src/components/CatalogSidebar.tsx`
- Modify: `apps/componentLibrary/src/lib/agentPrompt.ts`
- Modify: `apps/componentLibrary/src/lib/theme.ts`
- Modify: `apps/componentLibrary/tsconfig.typecheck.json`

**Interfaces:**
- Consumes: generated `PageRecipe` metadata.
- Produces: `/pages`, `/pages/[slug]`, `/embed/pages/[slug]`.
- Produces: `buildPageRecipeAgentPrompt(recipe: PageRecipe): string`.

- [ ] **Step 1: Add sidebar navigation**

Extend the existing sidebar with top-level Component and Pages navigation while keeping category
filtering for the component catalog.

- [ ] **Step 2: Add Pages grid and detail views**

Implement the Pages grid, cards, responsive iframe previews, detail route, install notes, acceptance
checks, copy source, and copy prompt.

- [ ] **Step 3: Add embed route**

Render the recipe component by slug inside a clean embed route for desktop, tablet, and mobile
previews.

---

### Task 4: Smoke Coverage And Verification

**Files:**
- Modify: `apps/componentLibrary/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `/pages`, `/pages/auth`, `/embed/pages/auth`.
- Produces: Playwright coverage for the Pages tab.

- [ ] **Step 1: Add Playwright checks**

Assert that the Pages nav opens the grid, a recipe card has responsive previews, the full route
renders, and copy-source/copy-prompt buttons work.

- [ ] **Step 2: Run focused verification**

Run:
- `pnpm exec vitest run --root scripts scripts/dev/sync/buildPageRecipeIndex.test.mjs`
- `node scripts/dev/checks/checkPageRecipes.mjs`
- `pnpm --filter vybekiit-component-library typecheck`
- `pnpm --filter vybekiit-component-library build`
- `pnpm --filter vybekiit-component-library test:e2e`

- [ ] **Step 3: Run final gate if practical**

Run: `pnpm verify`

If unrelated existing failures remain, report the exact failing command and focused verification
evidence.
