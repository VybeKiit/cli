# Lean Codebase Refactor Wave 3 Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` and complete each task with focused tests before the repository gate.

**Goal:** Remove unowned package surfaces, split the next cohesive assistant-chat responsibility, and make generated MCP configuration derive from one source.

**Architecture:** Narrow contracts only after proving their consumers, extract one tested business capability at a time, and generate repeated configuration from the existing Agent Kit catalog. Do not perform global syntax replacement or add compatibility wrappers.

## Constraints

- Preserve template output, public package contracts that have verified external consumers, and CLI behavior.
- Treat package-internal self-imports separately from public consumers when auditing exports.
- Add a current consumer or an explicit public-contract note for every retained entrypoint.
- Replace `??` only in reviewed business-logic slices; keep an explicit boundary exception where a falsy value is meaningful.
- Each task ends with focused tests, typecheck, Biome, the code-style checker, and a commit.

### Task 1: Replace wildcard package exports with deliberate entrypoints

**Files:**
- Modify: `packages/auth/package.json`
- Modify: `packages/deploy/package.json`
- Modify: `packages/db/package.json`
- Modify: package source imports exposed by the final consumer inventory
- Test: existing auth, deploy, DB, CLI, and template contract suites

- [x] Build a complete import inventory excluding each package's own source. Record template and CLI consumers separately from tests.
- [x] For auth, retain the observed root, client, HTTP, HTTP/Next, and HTTP/Express contracts; replace `./*`, `./http/*`, and `./providers/*` with only proven public paths.
- [x] For deploy and DB, distinguish provider contracts used by templates/CLI from self-imports. Replace provider, registrar, preset, and root wildcards with explicit exports.
- [x] Review package self-imports. Retain those that express the package boundary required by ADR-0026, with exact runtime exports where Vite resolves them through the manifest.
- [x] Add manifest contract tests that fail when an undocumented wildcard is reintroduced.

### Task 2: Extract assistant conversation selection and resume behavior

**Files:**
- Create: `apps/landing/src/components/tools/assistant-chat/sessionSelection.ts`
- Create: `apps/landing/src/components/tools/assistant-chat/sessionSelection.test.ts`
- Modify: `apps/landing/src/components/tools/assistant-chat/AssistantChatPanel.tsx`

- [x] Characterize the current open/resume decision table, including missing sessions, active sessions, transcript loading, and stale selection.
- [x] Move the business decision and request orchestration out of `handleOpenConversation`; keep React rendering and state application in the panel.
- [x] Delete the replaced inline branch. Do not leave a forwarding hook or wrapper.
- [x] Verify the extracted capability and the full assistant-chat test set. Record the panel's new line and complexity counts.

### Task 3: Generate first-party MCP configuration from Agent Kit

**Files:**
- Modify: `packages/agentKit/src/catalogs/mcpToolsCatalog.ts`
- Modify: `packages/agentKit/src/catalogs/mcpToolsCatalog.test.ts`
- Modify: the existing scaffold writer that emits template `.mcp.json` files
- Regenerate: `templates/{web,backend,extension}/.mcp.json` and any other verified buyer copies

- [x] Inventory every checked-in MCP configuration and classify it as source, generated buyer copy, or unrelated third-party catalog.
- [x] Keep `mcpToolsCatalog.ts` as the first-party server source and expose one serializer for the scaffold layout.
- [x] Make scaffolding and checked-in template fixtures consume that serializer instead of maintaining hand-written copies.
- [x] Add drift tests comparing generated output with every committed buyer copy.

### Task 4: Enforce the remaining orphan rules with evidence

**Files:**
- Modify: `scripts/dev/checks/checkCodeStyleRules.mjs`
- Modify: `scripts/dev/checks/checkCodeStyleRules.test.mjs`
- Modify: `code-style.rules.json` only when the rule can be checked deterministically
- Modify: `apps/componentLibrary` lint configuration if alias inspection confirms a false dependency warning

- [x] Add a deterministic check rejecting wildcard exports in workspace package manifests unless allowlisted with a documented public contract.
- [x] Audit barrels and registries by current consumers; delete confirmed orphans in cohesive package slices rather than by filename pattern.
- [x] Resolve the `@library/*` alias diagnostics as configuration, or replace the aliases if they are not a supported boundary.
- [x] Triage authored files over 500 lines by responsibility count. Do not split files solely to satisfy a line threshold.
- [x] Run `pnpm verify` and commit the Wave 3 completion report only after exit 0.
