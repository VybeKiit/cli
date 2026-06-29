# Platform wrapper: data modeling (agent-only)

**Invoked by:** `design-my-data` buyer skill · inline from `save-data` for trivial cases.

## When to use

| Situation | Action |
|-----------|--------|
| Multiple entities or relationships | Run `design-my-data` first |
| Single simple list/table | Inline `planDataModel()` in `save-data` |
| Builder already agreed on shape | Jump to `save-data` |

## Workflow

1. Infer entities from product language (customers, orders, posts, etc.)
2. `planDataModel(entities, DATA_PROVIDER)` — PK/FK stay in agent output only
3. Read `buyerSummary` to builder; confirm
4. `save-data` provisions via MCP path for active provider (merge via `agent/mcp-setup.md`):
   - Supabase → `mcp-supabase.json` + Supabase CLI
   - Neon → `mcp-neon.json`
   - Firebase → `mcp-firebase.json`

## Never say to builder

primary key, foreign key, migration, schema, normalization, SQL, NoSQL

## MCP tier

Document login-once paths in `onboarding.md`. MongoDB and AWS are advanced (maintainer docs only).
