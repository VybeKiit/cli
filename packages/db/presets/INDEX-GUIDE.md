# DB Preset Index Guide (agent-only)

Each preset manifest declares indexes with a `reason` field. Doctor and `verify-presets` surface
those reasons when something is missing.

## Index when

| Pattern | Example | Why |
|---|---|---|
| Upsert / conflict keys | `order_id`, `event_id` | Required for idempotent writes |
| FK columns in JOINs or RLS subqueries | `organization_members.org_id` | Avoid seq scans on ownership checks |
| Admin list sort columns | `created_at DESC` | Paginated dashboards |
| Full-text / vector search | GIN on `search_vector`, HNSW on `embedding` | Query-driven access paths |
| Composite AND filters | `(user_id, status)` | Common filtered list queries |

## Skip when

| Pattern | Example | Why |
|---|---|---|
| Tiny enums | `role` with 2 values | Sequential scan is cheaper |
| Columns never filtered | `updated_at` alone | No query uses it |
| Duplicate of UNIQUE constraint | index on `order_id` when column is UNIQUE | Postgres already indexes UNIQUE |
| Low-cardinality booleans alone | `refunded` without composite | Poor selectivity |
| Over-indexing every FK | indexing unused relations | Write amplification |

Every index in a manifest must document its query in `reason`.
