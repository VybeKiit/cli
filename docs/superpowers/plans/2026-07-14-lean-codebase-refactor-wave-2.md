# Lean Codebase Refactor Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a deterministic repository gate, decode local live-work HTTP responses once, and begin reducing the assistant-chat god file along a tested business boundary.

**Architecture:** First fix the existing DB unit-test seam so `pnpm verify` never contacts fixture hosts. Then introduce one shared local live-work response decoder used by the data, host, and payments clients. Finally extract transcript/session loading from `AssistantChatPanel.tsx` into a cohesive capability without changing UI behavior.

**Tech Stack:** TypeScript, Effect, Effect Schema, React, Vitest, Biome, pnpm, Turbo.

## Global Constraints

- Preserve public API response shapes, CLI output, template behavior, and generated artifacts.
- Use const-arrow functions, domain names, guard clauses, and flat conditions.
- Do not introduce `??` fallback chains, nested ternaries, vague locals, pass-through wrappers, or speculative validation.
- Parse untrusted values once at the boundary and keep Effect workflows intact.
- Each task ends with focused verification and a commit.

---

### Task 1: Isolate live-work database verification tests

**Files:**
- Modify: `packages/db/src/liveWork/runDataLiveWork.test.ts`
- Modify: `packages/db/src/liveWork/runDataLiveWork.ts` only if dependency injection is not already exposed
- Test: `packages/db/src/liveWork/runDataLiveWork.test.ts`

**Interfaces:**
- Consumes: the existing database verification operation used by `runDataLiveWork`.
- Produces: a test-owned verifier that returns deterministic health outcomes without opening DNS or database connections.

- [ ] **Step 1: Reproduce the baseline failure**

Run: `pnpm --dir packages/db exec vitest run src/liveWork/runDataLiveWork.test.ts`

Expected before the fix: six failures with `getaddrinfo ENOTFOUND existing|test|neon|pinned`.

- [ ] **Step 2: Make verification an explicit test seam**

Pass the existing verifier through the live-work dependency object. If the dependency object already supports it, use that seam directly and do not add another wrapper. In the test, provide a verifier that records the requested URL and returns the health result required by each scenario.

```ts
const verifiedDatabaseUrls: string[] = [];
const verifyDatabase = (databaseUrl: string) => {
  verifiedDatabaseUrls.push(databaseUrl);
  return Effect.succeed({ ok: true as const });
};
```

Assert the selected provider URL and call count so the test still protects the ladder business rule.

- [ ] **Step 3: Verify the isolated suite**

Run:

```bash
pnpm --dir packages/db exec vitest run src/liveWork/runDataLiveWork.test.ts
pnpm --dir packages/db typecheck
pnpm biome check packages/db/src/liveWork/runDataLiveWork.ts packages/db/src/liveWork/runDataLiveWork.test.ts
```

Expected: 9 tests pass and no network lookup occurs.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/liveWork/runDataLiveWork.ts packages/db/src/liveWork/runDataLiveWork.test.ts
git commit -m "test(db): isolate live-work database verification"
```

### Task 2: Decode local live-work responses at one boundary

**Files:**
- Create: `apps/localDevelopmentWebsite/src/lib/liveWorkApiResponse.ts`
- Create: `apps/localDevelopmentWebsite/src/lib/liveWorkApiResponse.test.ts`
- Modify: `apps/localDevelopmentWebsite/src/lib/liveWorkDataClient.ts`
- Modify: `apps/localDevelopmentWebsite/src/lib/liveWorkHostClient.ts`
- Modify: `apps/localDevelopmentWebsite/src/lib/liveWorkPaymentsClient.ts`
- Modify: their three colocated client tests

**Interfaces:**
- Produces: `decodeLiveWorkApiResponse(responseBody, schema)` returning the schema-derived success/error union already exposed by each client.
- Consumers: data, host, and payments clients decode `await response.json()` through their concrete Effect Schema instead of asserting a union.

- [ ] **Step 1: Add malformed-response tests**

For each client, mock a `200` response with an invalid body and assert a stable client failure rather than an unchecked cast. Keep existing success and API-error assertions unchanged.

- [ ] **Step 2: Confirm RED**

Run: `pnpm --dir apps/localDevelopmentWebsite exec vitest run src/lib/liveWorkDataClient.test.ts src/lib/liveWorkHostClient.test.ts src/lib/liveWorkPaymentsClient.test.ts`

Expected: malformed response tests fail because asserted JSON is returned unchecked.

- [ ] **Step 3: Add one schema decoder and concrete schemas**

The decoder accepts `unknown`, calls `Schema.decodeUnknown`, and maps parse failure to the existing local client error shape. Each client owns its domain schema and names its body `responseBody`, not `body` or `data`. Do not add a generic HTTP-client abstraction.

- [ ] **Step 4: Verify and commit**

Run focused tests, local-development typecheck, Biome on the touched files, and `pnpm check:code-style -- --files` for the three clients.

```bash
git add apps/localDevelopmentWebsite/src/lib/liveWorkApiResponse.ts apps/localDevelopmentWebsite/src/lib/liveWorkApiResponse.test.ts apps/localDevelopmentWebsite/src/lib/liveWorkDataClient.ts apps/localDevelopmentWebsite/src/lib/liveWorkDataClient.test.ts apps/localDevelopmentWebsite/src/lib/liveWorkHostClient.ts apps/localDevelopmentWebsite/src/lib/liveWorkHostClient.test.ts apps/localDevelopmentWebsite/src/lib/liveWorkPaymentsClient.ts apps/localDevelopmentWebsite/src/lib/liveWorkPaymentsClient.test.ts
git commit -m "refactor(local): decode live-work responses once"
```

### Task 3: Extract assistant session transcript loading

**Files:**
- Create: `apps/landing/src/components/tools/assistant-chat/sessionTranscript.ts`
- Create: `apps/landing/src/components/tools/assistant-chat/sessionTranscript.test.ts`
- Modify: `apps/landing/src/components/tools/assistant-chat/AssistantChatPanel.tsx`

**Interfaces:**
- Produces: `loadSessionTranscript(sessionId, agentId, signal): Effect.Effect<SessionTranscript, SessionTranscriptError>` using the existing route contract.
- Consumer: `AssistantChatPanel` invokes the capability and only owns React state transitions/rendering.

- [ ] **Step 1: Characterize transcript behavior**

Cover successful transcript loading, abort, non-2xx response, invalid response shape, and stale-session protection. Assert observable state inputs/outputs rather than helper call order.

- [ ] **Step 2: Confirm RED**

Run: `pnpm --dir apps/landing exec vitest run src/components/tools/assistant-chat/sessionTranscript.test.ts`

Expected: FAIL because the capability module does not exist.

- [ ] **Step 3: Move only the transcript responsibility**

Move request construction, response decoding, and tagged expected failures. Leave selection state, scrolling, rendering, and unrelated chat actions in the panel. Delete the old inline branch completely; do not retain a forwarding wrapper.

- [ ] **Step 4: Verify and commit**

Run the new suite, existing assistant-chat suites, landing typecheck, Biome on touched files, and the focused style checker.

```bash
git add apps/landing/src/components/tools/assistant-chat/sessionTranscript.ts apps/landing/src/components/tools/assistant-chat/sessionTranscript.test.ts apps/landing/src/components/tools/assistant-chat/AssistantChatPanel.tsx
git commit -m "refactor(landing): extract session transcript loading"
```

### Task 4: Full gate and Wave 3 boundary inventory

**Files:**
- Create: `docs/superpowers/plans/2026-07-14-lean-codebase-refactor-wave-3.md`

- [ ] **Step 1: Run `pnpm verify`**

Expected: exit 0. Rerun load-sensitive MCP tests in isolation only as supporting evidence, not as a substitute for the repository gate.

- [ ] **Step 2: Map deliberate package entrypoints**

Inventory actual external consumers of `packages/auth`, `packages/deploy`, `packages/db`, and `packages/agentKit`; plan entrypoint changes only where exports can be narrowed without breaking consumers.

- [ ] **Step 3: Plan the next cohesive AssistantChatPanel extraction and template drift source**

Use current responsibilities and tests to choose one UI/business boundary. Separately locate the singular source for repeated MCP/template agent configuration before editing buyer copies.

- [ ] **Step 4: Commit the Wave 3 plan**

```bash
git add docs/superpowers/plans/2026-07-14-lean-codebase-refactor-wave-3.md
git commit -m "docs: plan lean codebase refactor wave three"
```
