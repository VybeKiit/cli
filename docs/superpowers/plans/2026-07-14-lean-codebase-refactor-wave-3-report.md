# Lean Codebase Refactor Wave 3 Report

## Outcome

Wave 3 removed wildcard entrypoints from auth, deploy, and DB; extracted assistant session-selection logic; made checked-in MCP configuration derive from Agent Kit; and added a deterministic package-surface gate.

The first full verification run exposed a missed deploy runtime contract: Vite resolves deploy's package-internal self-imports through `exports` when browser automation imports deploy. The final manifest names those 11 entrypoints explicitly. The isolated browser-automation rerun passed 34 files and 140 tests before the full gate passed.

## Changed boundaries

- Auth exposes only root, client, HTTP, Express, and Next entrypoints.
- DB exposes only its root entrypoint. Its isolated suite passes 19 files and 132 tests, with the existing live tests skipped.
- Deploy has no wildcard. It exposes root plus the exact effect, provider, registrar, resolver, type, and GitHub Pages paths used by runtime self-imports.
- `handleOpenConversation` delegates its decision table to `planSessionSelection`. The panel fell from 3,381 to 3,358 lines; the component still has a repository warning at cognitive complexity 134, so later work must continue by capability rather than chase a line threshold.
- Agent Kit remains the MCP server source. Scaffold writes use its formatter, and drift tests compare all five template copies plus both root copies to the catalog model.

## Orphan-surface findings

No additional barrel or registry was deleted without a proven unused contract. Sixteen legacy wildcard entrypoints remain and are frozen as exact exceptions in `code-style.rules.json`. The checker now rejects any new wildcard in all 23 package manifests. Each exception must be removed after its consumers are inventoried; adding exceptions is prohibited by `CODE-STYLE.md`.

The `@library/*` warnings were confirmed as Biome treating a TypeScript alias like an npm scope. A component-library-only lint override removes that false diagnostic without renaming the established alias or changing generated catalogs and CLI recipe rewriting.

## Large-file triage

Line count alone did not justify a split. The responsibility review produced these priorities:

1. `AssistantChatPanel.tsx` (3,358): multiple panel capabilities; continue extracting tested business decisions such as attachment planning and message dispatch.
2. `PageRecipeCard.tsx` (1,798): presentation, interaction, and recipe state share one file; review as the next UI capability slice.
3. `loadSessionTranscript.ts` (929) and `listSessions.ts` (705): native-session parsing and provider discovery are meaningful candidates if their decision tables can be characterized first.
4. `mcpWire.ts` (577): parsing, merging, registration, and discovery form separable MCP responsibilities, but require contract tests before movement.
5. DB preset rendering, core configuration, and Agent MCP server composition are large but cohesive enough to keep until a real responsibility boundary is proven.

Generated component-library indexes and vendored UI files were excluded from authored-code triage.

## Where the old CODE-STYLE content went

The guide was 1,002 lines immediately before the lean rewrite and is 204 lines after Wave 3 hardening. The removed text was not copied wholesale elsewhere:

- Daily authored-code rules and examples stayed in `CODE-STYLE.md`.
- Maintained-versus-buyer boundaries, package kinds, scripts, release policy, UI rules, and the quality gate are owned by `AGENTS.md`.
- Import vocabulary, CLI publication, Effect/dependency decisions, and package shapes remain in ADR-0026 and ADR-0033 through ADR-0035.
- Repeated dependency tables, migration narration, recipes, exemplars, and duplicated framework guidance were intentionally deleted. Their history remains in Git.

The reduction therefore removed duplication and historical prose while routing durable contracts to their existing owners. The current file is above the earlier approximate 180 lines because orphan, comment, testing, CLI, and wildcard-entrypoint rules were added during hardening.

## Verification

- `pnpm verify`: exit 0.
- Workspace lint, code-style, typecheck, unit tests, script tests, builds, safety, provider, package, recipe, component-story, and single-component checks passed.
- Local-development Playwright: 56 of 56 passed in 5.0 minutes.
- Component-library Playwright: skipped by the repository unless `PLAYWRIGHT_ENABLED=true`.
- Agent-config audit: 0 errors, 520 existing advisory warnings, 2 informational messages.
