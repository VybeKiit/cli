# ADR-0031: Deduplication gate (pre-write + pre-commit)

## Status

Accepted — 2026-07-05

## Context

AI coding agents (Claude Code, Cursor, Codex) frequently create duplicate logic — a second
`formatPrice()` in a new file, a hand-rolled retry loop when `@vybekiit/core` already ships one, a
`src/utils/payments.ts` when `packages/payments` is right there. The vibe coder never notices; the
agent doesn't check. Over time the codebase rots into a maze of near-identical functions that drift
independently.

Three constraints shape the solution:

1. **The vibe coder must experience zero friction.** They never see or answer dedup prompts — the
   gate is agent-to-tool, invisible.
2. **The gate must be blazing fast** — sub-200ms for a typical check, so the agent's flow is
   uninterrupted.
3. **Context is the scarce resource.** A response dumping 100 matches into the agent's window is
   worse than no check at all. Results are capped at 3, paginated, ranked.

## Decision

### Three enforcement layers, same policy

| Layer | When it fires | Mechanism |
|-------|--------------|-----------|
| **CODE-STYLE.md rule** | Agent reads before writing | Instruction: "run `vybekiit dedup` before creating" |
| **CLI tool** (`vybekiit dedup`) | Agent invokes pre-write | Rust binary, AST-based, sub-200ms |
| **Pre-commit git hook** | Developer/agent commits | Extracts new exports from staged files → runs dedup |

### Detection levels (blocking)

| Level | What it catches | Mechanism |
|-------|----------------|-----------|
| **A — Exact/near-exact** | Copy-pasted functions with trivial renames | Body hash + fuzzy name match (Levenshtein on tokenized identifiers) |
| **B — Structural** | Same shape/signature, different body | AST skeleton hash (strip identifiers, keep type shape + control flow) |
| **D — Concern overlap** | New file in a domain that already has a home | Domain map lookup + path/name heuristic + export-name collision |

Level C (semantic/intent) is explicitly **not** in the blocking tier — too slow and too many false
positives for a gate. It may appear later as a `--deep` advisory mode.

### Block policy: block with escape hatch

When dedup returns `"status": "blocked"`:
- The agent MUST reuse or extend the existing match.
- Bypass ONLY with an explicit reason: `// dedup-bypass: <reason>` at the export site.
- The **agent** justifies the bypass, never the vibe coder.
- Bypasses are greppable and auditable.

### Tool implementation

- **Language:** Rust, using `swc_ecma_parser` for full-fidelity TypeScript AST parsing.
- **Benchmark gate:** must be sub-200ms for a typical package scan before shipping.
- **Escape hatch:** if Rust proves too costly to maintain, pivot to Go + tree-sitter.
- **Location:** `tools/dedup/` — Rust crate, private workspace member, own Cargo build.
- **CLI surface:** `vybekiit dedup` subcommand — the Node CLI detects the binary and shells out.
- **Distribution:** prebuilt binary per platform via npm `optionalDependencies` (like biome/turbo).

### CLI interface

```bash
# Agent runs before creating/extending
vybekiit dedup --intent "payment webhook handler" --scope packages/
vybekiit dedup --intent "format currency util" --scope src/

# Hook runs with file target
vybekiit dedup --target src/utils/payments.ts --scope packages/

# Rebuild index manually (rarely needed — auto-rebuilds on stale)
vybekiit dedup --index

# Pagination (agent rarely needs this)
vybekiit dedup --intent "..." --scope ... --limit 3 --offset 3
```

**Flags:**
- `--intent` — natural language description of what's being created (name/keyword matching)
- `--target` — file path being created/modified (structural + path matching)
- `--scope` — directory to scan against (default: current workspace member from cwd)
- `--limit` — max results (default: 3)
- `--offset` — pagination
- `--index` — rebuild the index
- `--json` — machine-readable output (default when non-TTY)

**Output contract:**

```jsonc
// Clear — proceed
{ "status": "clear", "checked": 142 }

// Blocked — dup found
{
  "status": "blocked",
  "total": 47,
  "showing": 3,
  "matches": [
    {
      "level": "A",
      "existing": "packages/payments/src/webhooks/handleEvent.ts:handlePaymentEvent",
      "similarity": 0.94,
      "suggestion": "extend or import from packages/payments"
    }
  ]
}
```

### Index system

- **Contents per export:** symbol name (tokenized), file path, signature skeleton, body hash,
  domain keywords (from path + name).
- **Location:** `.vybekiit/dedup-index.json` (gitignored).
- **Freshness:** auto-rebuilds when stale (mtime of index < latest `.ts` file in scope). No
  manual step required — first run after a code change is slightly slower.
- **CI:** optional explicit `vybekiit dedup --index` step, not required.

### Domain map (Level D)

- **Location:** `.vybekiit/domain-map.json` (committed).
- **Explicit entries** for the 5 published packages (payments, auth, db, core, client-state).
- **Inference fallback:** reads `packages/*/package.json` name + barrel exports for anything not
  in the map.
- **Maintainable:** agent can add entries when new domains emerge.

```jsonc
{
  "domains": {
    "payment": { "home": "packages/payments" },
    "auth": { "home": "packages/auth" },
    "database": { "home": "packages/db" },
    "config": { "home": "packages/core" },
    "http": { "home": "packages/core" },
    "state": { "home": "packages/clientState" }
  }
}
```

### Git hook (pre-commit)

- Extracts new files + new exports in modified files from `git diff --staged`.
- Runs `vybekiit dedup --target <file> --scope <auto>` for each new export.
- Blocks commit if any unresolved match lacks a `// dedup-bypass:` comment.
- Speed target: sub-500ms for a typical 1–5 new exports commit.

### Buyer delivery

Buyers receive the **full tool** — binary + pre-commit hook + CODE-STYLE.md rules:
- Prebuilt binary auto-downloaded on `pnpm install` (optionalDependencies).
- CLI scaffolder sets up the pre-commit hook during initial scaffold.
- Domain map auto-generated from the template's structure on scaffold.
- **Value prop:** "Your AI agent physically cannot duplicate code."

### Scope architecture

- **Default scope:** current workspace member (auto-detected from cwd).
- **Override:** `--scope <dir>` — agent decides what to scan per-invocation.
- **The tool is dumb and fast; the agent is smart about what to compare against.**

## Consequences

- Every new export in the monorepo is verified against the existing surface before landing.
- Agents that forget the instruction are caught by the pre-commit hook.
- The domain map needs updating when a new package is created (rare — ADR-0025 says don't).
- The Rust binary adds a build dependency for contributors (prebuilt for buyers).
- False positives in level B (structural) may need threshold tuning after real-world use.
