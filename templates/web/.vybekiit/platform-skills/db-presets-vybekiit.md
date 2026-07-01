# Platform: DB feature presets

Agent-only. Applies composable SaaS table bundles from `@vybekiit/db` presets.

## When to use

- A buyer skill needs kit-owned tables (orders, teams, search, AI, audit).
- `vybekiit doctor` reports missing DB presets.
- Before wiring `@vybekiit/*` package code that expects preset collections.

## Commands

```bash
vybekiit list-presets
vybekiit apply-preset <feature> [--provider=supabase|neon|railway] [--dry-run]
vybekiit verify-presets [--fix]
```

## Skill → preset map

| Skill | Presets |
|---|---|
| `add-signin` | `auth-bridge` |
| `setup-payments` | `orders`, `webhook_events` |
| `add-teams` | `organizations` |
| `add-search` | `search_documents` |
| `add-ai` | `embeddings`, `ai_conversations` |
| `add-realtime` | `realtime_publications` |
| `add-notifications` | `notifications_log` |
| `add-files` | `file_metadata` |
| `harden` | `audit_log` |
| `go-live` | `job_runs` |

## Verify-before-advance

After each `apply-preset`, run `vybekiit verify-presets <feature>` (or `--fix` from doctor).
Translate errors to plain language — never say "migration" or "RLS" to the builder.

## Postgres providers

Full SQL + indexes for `supabase`, `neon`, `railway`. Requires `DATABASE_URL`.

## NoSQL (v1.1)

`renderPreset` emits collection/index notes for `mongodb`, `firebase`, `aws` — apply manually
via provider CLI until v1.1 renderers ship.
