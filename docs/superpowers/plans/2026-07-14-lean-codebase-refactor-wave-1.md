# Lean Codebase Refactor Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish VybeKiit's enforceable lean-code contract, then remove duplicated sources of truth from the CLI create surface and local-development daemon protocol without changing public behavior.

**Architecture:** This wave starts with one concise human contract and a machine-readable enforcement mirror. It then applies the contract to two independent vertical slices: the CLI derives parsing, prompts, usage, and compatibility copy from one surface registry; the local-development browser and daemon import one wire contract from a process-neutral module.

**Tech Stack:** TypeScript, Effect where maintained runtime workflows already use it, Biome 2.5, Vitest, pnpm, Turbo.

## Global Constraints

- Preserve CLI output, API response shapes, template behavior, and generated artifacts.
- Use const-arrow functions, guard clauses, domain names, and flat control flow.
- Prefer `!value`; use explicit checks when `0`, `false`, or `''` are valid values.
- Do not introduce routine `??`, nested ternaries, dense parenthesized conditions, pass-through wrappers, or single-implementation interfaces.
- Explicit multi-step business loops receive a comment that explains the business rule.
- Keep Effect as the maintained-package workflow model.
- Every slice ends with focused tests, focused typecheck/lint, and the repository verification gate.

---

### Task 1: Lean style contract and enforcement mirror

**Files:**
- Modify: `CODE-STYLE.md`
- Modify: `AGENTS.md`
- Create: `code-style.rules.json`
- Create: `scripts/dev/checks/checkCodeStyleRules.mjs`
- Create: `scripts/checkCodeStyleRules.test.ts`
- Modify: `package.json`
- Modify: `biome.json`

**Interfaces:**
- Consumes: the approved rules in `docs/superpowers/specs/2026-07-14-lean-codebase-refactor-design.md`.
- Produces: `pnpm check:code-style`, a JSON rule catalog with `id`, `summary`, `scope`, and `enforcedBy`, plus the concise daily contract linked from `AGENTS.md`.

- [ ] **Step 1: Write failing structural tests**

Add tests that load `code-style.rules.json`, assert unique rule IDs and non-empty enforcement channels, and run the checker against fixtures containing a nested ternary and an authored declaration named `data`.

```ts
it('requires every rule to name an enforcement channel', () => {
  const ruleCatalog = JSON.parse(readFileSync(ruleCatalogPath, 'utf8')) as RuleCatalog;
  expect(ruleCatalog.rules.every((rule) => rule.enforcedBy.length > 0)).toBe(true);
});

it('reports nested ternaries in authored TypeScript', () => {
  const violations = checkSource('const label = ready ? active ? "on" : "off" : "wait";');
  expect(violations.map((violation) => violation.ruleId)).toContain('control-flow.no-nested-ternary');
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `pnpm vitest run --root scripts scripts/checkCodeStyleRules.test.ts`

Expected: FAIL because the catalog and checker do not exist.

- [ ] **Step 3: Write the contract and checker**

Rewrite `CODE-STYLE.md` around these daily sections: boundaries, naming, control flow, defaults and absence, Effects and errors, contracts and validation, comments and docs, testing, generated/template exceptions, and enforcement. Move historical explanations to existing ADR links instead of retaining migration narratives in the style guide.

Create a versioned JSON catalog shaped as:

```json
{
  "$schema": "./docs/code-style-rules.schema.json",
  "version": 1,
  "rules": [
    {
      "id": "control-flow.no-nested-ternary",
      "summary": "Name business facts and branch with guard clauses instead of nesting ternaries.",
      "scope": "authored",
      "enforcedBy": ["biome:style/noNestedTernary"]
    },
    {
      "id": "naming.no-vague-local",
      "summary": "Use the domain noun, such as bodyRequest or checkoutResponse, instead of data or result.",
      "scope": "authored",
      "enforcedBy": ["scripts/dev/checks/checkCodeStyleRules.mjs", "review"]
    }
  ]
}
```

The checker accepts `--files <path...>` for focused use, ignores generated/vendor/framework exception paths declared in the catalog, prints `path:line rule-id message`, and exits 1 only for catalog rules whose enforcement channel is the checker. It must parse declarations conservatively and avoid flagging property names or third-party/generated code.

Add `check:code-style` to `package.json`, include it in `verify`, and promote `noNestedTernary` from warning to error. Do not promote unrelated warning rules in this task.

- [ ] **Step 4: Run focused verification and confirm GREEN**

Run:

```bash
pnpm vitest run --root scripts scripts/checkCodeStyleRules.test.ts
pnpm check:code-style -- --files cli/src/commands/createApp.ts
pnpm biome check CODE-STYLE.md AGENTS.md code-style.rules.json scripts/dev/checks/checkCodeStyleRules.mjs scripts/checkCodeStyleRules.test.ts package.json biome.json
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit the contract**

```bash
git add CODE-STYLE.md AGENTS.md code-style.rules.json scripts/dev/checks/checkCodeStyleRules.mjs scripts/checkCodeStyleRules.test.ts package.json biome.json
git commit -m "docs: enforce lean code style contract"
```

### Task 2: Singular CLI create-surface registry

**Files:**
- Create: `cli/src/commands/createSurfaceRegistry.ts`
- Modify: `cli/src/commands/scaffoldOutput.ts`
- Modify: `cli/src/commands/createApp.ts`
- Modify: `cli/src/commands/new.ts`
- Modify: `cli/src/cliHelp.ts`
- Modify: `cli/test/createApp.test.ts`
- Modify: `cli/test/cliHelp.test.ts`

**Interfaces:**
- Consumes: `TemplateName` from `cli/src/lib/scaffold.ts`.
- Produces: `CREATE_SURFACES`, `CreateSurface`, `isCreateSurface(value)`, `createSurfaceFlagList`, `createSurfacePromptOptions`, and `surfaceToTemplate(surface)`.

- [ ] **Step 1: Add registry characterization tests**

Assert that the registry preserves the exact order `web`, `mobile`, `extension`, `backend`; parsing accepts every registered flag; prompt labels match current labels; usage and deprecated help still contain the same four public flags.

```ts
it('keeps every create-app surface in one buyer-facing order', () => {
  expect(CREATE_SURFACES.map((surface) => surface.id)).toEqual([
    'web',
    'mobile',
    'extension',
    'backend',
  ]);
});
```

- [ ] **Step 2: Run CLI tests and confirm RED**

Run: `pnpm --filter vybekiit test -- createApp.test.ts cliHelp.test.ts`

Expected: FAIL because `createSurfaceRegistry.ts` and its exports do not exist.

- [ ] **Step 3: Implement the registry and derive consumers**

Create an `as const satisfies` registry whose records contain `id`, `label`, `hint`, and `template`. Derive the union type from `CREATE_SURFACES[number]['id']`. Use one explicit loop in argument parsing to match a registered `--${surface.id}` flag; place this business comment above it:

```ts
// A create command selects exactly one buyer surface; all other flags fail before scaffolding.
for (const argument of argumentsToParse) {
```

Use domain names such as `argumentsToParse`, `selectedSurfaces`, `destinationArguments`, and `selectedSurface`. Remove the `surface === undefined ||` condition after the length guard and use `if (!selectedSurface)` because an empty surface ID is not valid. Derive prompt options, usage rows, flag-list error copy, and deprecated-command copy from registry functions without adding formatting wrappers that have only one caller.

- [ ] **Step 4: Run focused verification and confirm GREEN**

Run:

```bash
pnpm --filter vybekiit test -- createApp.test.ts cliHelp.test.ts
pnpm --filter vybekiit typecheck
pnpm biome check cli/src/commands/createSurfaceRegistry.ts cli/src/commands/scaffoldOutput.ts cli/src/commands/createApp.ts cli/src/commands/new.ts cli/src/cliHelp.ts cli/test/createApp.test.ts cli/test/cliHelp.test.ts
pnpm check:code-style -- --files cli/src/commands/createSurfaceRegistry.ts cli/src/commands/scaffoldOutput.ts cli/src/commands/createApp.ts cli/src/commands/new.ts cli/src/cliHelp.ts
```

Expected: all commands exit 0 and public CLI snapshots are unchanged.

- [ ] **Step 5: Commit the CLI slice**

```bash
git add cli/src/commands/createSurfaceRegistry.ts cli/src/commands/scaffoldOutput.ts cli/src/commands/createApp.ts cli/src/commands/new.ts cli/src/cliHelp.ts cli/test/createApp.test.ts cli/test/cliHelp.test.ts
git commit -m "refactor(cli): derive create surfaces from one registry"
```

### Task 3: Singular local daemon wire contract

**Files:**
- Create: `apps/localDevelopmentWebsite/src/daemon/contract.ts`
- Modify: `apps/localDevelopmentWebsite/daemon/protocol.ts`
- Modify: `apps/localDevelopmentWebsite/daemon/server.ts`
- Modify: `apps/localDevelopmentWebsite/src/hooks/useDaemon.ts`
- Create: `apps/localDevelopmentWebsite/src/daemon/contract.test.ts`

**Interfaces:**
- Produces: `AgentId`, `WorkflowStepStatus`, `ClientMessage`, and `DaemonMessage` from a browser-and-Node-safe type-only module.
- Consumers: daemon server and browser hook import the same wire unions; `daemon/protocol.ts` is deleted if usage mapping proves it has no remaining runtime responsibility.

- [ ] **Step 1: Add contract characterization tests**

Add compile-time `satisfies` fixtures for every client and daemon message variant, plus a runtime test proving the contract module has no emitted runtime exports.

```ts
const outputMessage = {
  type: 'agent.output',
  chunk: 'working',
  sessionId: 'session-1',
} satisfies DaemonMessage;

expect(outputMessage.type).toBe('agent.output');
```

- [ ] **Step 2: Run local-development tests and confirm RED**

Run: `pnpm --filter vybekiit-local-development-website test -- contract.test.ts`

Expected: FAIL because `src/daemon/contract.ts` does not exist.

- [ ] **Step 3: Move the protocol contract and update both runtimes**

Move only wire types into `src/daemon/contract.ts`. Import them with `import type` from the daemon and hook. Delete the hook-local `DaemonMessage` union. Preserve optional `sessionId` fields exactly. If `daemon/protocol.ts` has no consumers after the move, delete it; otherwise leave only a direct domain responsibility and do not retain a re-export wrapper.

Rename the hook callback parameter from `msg` to `daemonMessage`, the parsed WebSocket value from an inline assertion to `daemonMessage`, and `lower` to `normalizedChunk`. Keep malformed-frame behavior unchanged.

- [ ] **Step 4: Run focused verification and confirm GREEN**

Run:

```bash
pnpm --filter vybekiit-local-development-website test -- contract.test.ts
pnpm --filter vybekiit-local-development-website typecheck
pnpm biome check apps/localDevelopmentWebsite/src/daemon/contract.ts apps/localDevelopmentWebsite/src/daemon/contract.test.ts apps/localDevelopmentWebsite/daemon/server.ts apps/localDevelopmentWebsite/src/hooks/useDaemon.ts
pnpm check:code-style -- --files apps/localDevelopmentWebsite/src/daemon/contract.ts apps/localDevelopmentWebsite/daemon/server.ts apps/localDevelopmentWebsite/src/hooks/useDaemon.ts
```

Expected: all commands exit 0 and both process halves compile against the same contract.

- [ ] **Step 5: Commit the daemon slice**

```bash
git add apps/localDevelopmentWebsite/src/daemon/contract.ts apps/localDevelopmentWebsite/src/daemon/contract.test.ts apps/localDevelopmentWebsite/daemon/protocol.ts apps/localDevelopmentWebsite/daemon/server.ts apps/localDevelopmentWebsite/src/hooks/useDaemon.ts
git commit -m "refactor(local): share the daemon wire contract"
```

### Task 4: Wave verification and next-wave inventory

**Files:**
- Create: `docs/superpowers/plans/2026-07-14-lean-codebase-refactor-wave-2.md`

**Interfaces:**
- Consumes: violations reported by `pnpm check:code-style`, package import maps, and first-wave verification evidence.
- Produces: the exact next vertical slices for HTTP response decoding, package entrypoints, template drift generation, and the first cohesive extraction from `AssistantChatPanel.tsx`.

- [ ] **Step 1: Run the repository gate**

Run: `pnpm verify`

Expected: exit 0. If an unrelated pre-existing gate fails, record the exact command and evidence separately; do not change unrelated code to hide it.

- [ ] **Step 2: Inventory the next violations without bulk edits**

Run focused read-only queries for unchecked `response.json()` assertions, package self-imports and broad barrels, repeated template MCP/config content, and responsibility clusters in `AssistantChatPanel.tsx`. Record exact consumers and focused test commands in the wave-2 plan.

- [ ] **Step 3: Self-review the next-wave plan**

Check every task against the design spec, remove placeholders and unnamed error-handling steps, and ensure every task has exact files, interfaces, RED/GREEN commands, and a commit.

- [ ] **Step 4: Commit verification evidence and the next plan**

```bash
git add docs/superpowers/plans/2026-07-14-lean-codebase-refactor-wave-2.md
git commit -m "docs: plan lean codebase refactor wave two"
```
