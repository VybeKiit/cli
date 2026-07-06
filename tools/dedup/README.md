# vybekiit-dedup

Blazing-fast deduplication gate for VybeKiit — detects exact, structural, and concern-overlap
duplicates in TypeScript codebases before they land.

## Design

See [ADR-0031](../../docs/adr/0031-dedup-gate.md) for the full design rationale.

## Detection Levels

| Level | What it catches | Mechanism |
|-------|----------------|-----------|
| **A** | Exact/near-exact duplicates | Body hash + fuzzy name match (Levenshtein) |
| **B** | Structural duplicates | AST skeleton hash (stripped identifiers, type shape + control flow) |
| **D** | Concern overlap | Domain map + path heuristic + export-name collision |

## Usage

```bash
# Check before creating (agent runs this)
vybekiit-dedup --intent "payment webhook handler" --scope packages/

# Check a specific file (hook runs this)
vybekiit-dedup --target src/utils/payments.ts --scope packages/

# Rebuild index manually
vybekiit-dedup --index --scope .

# With pagination
vybekiit-dedup --intent "format date" --scope src/ --limit 3 --offset 3
```

## Output

```jsonc
// Clear — proceed
{ "status": "clear", "checked": 142 }

// Blocked — dup found
{
  "status": "blocked",
  "total": 5,
  "showing": 3,
  "matches": [
    {
      "level": "A",
      "existing": "packages/payments/src/webhooks.ts:handlePaymentEvent",
      "similarity": 0.94,
      "suggestion": "reuse or extend `handlePaymentEvent` from packages/payments/src/webhooks.ts"
    }
  ]
}
```

Exit code: `0` = clear, `1` = blocked.

## Building

```bash
cargo build --release
# Binary at target/release/vybekiit-dedup
```

## Index

The tool maintains a dedup index at `.vybekiit/dedup-index.json` (gitignored). It auto-rebuilds
when stale (any `.ts`/`.tsx` file newer than the index). No manual step needed.

## Domain Map

`.vybekiit/domain-map.json` (committed) declares which domains live where. The tool checks it
for Level D detection and falls back to inference from package barrel exports.

## Integration

- **Agent instruction:** CODE-STYLE.md requires running `vybekiit dedup` before creating exports
- **CLI wrapper:** `vybekiit dedup` subcommand shells out to this binary
- **Pre-commit hook:** extracts new exports from staged files, runs dedup against each
