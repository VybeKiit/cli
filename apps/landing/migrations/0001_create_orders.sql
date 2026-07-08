-- VybeKiit's money-pipeline ledger: one row per Lemon Squeezy order, upserted by the
-- payment webhook (apps/landing/app/api/webhook/route.ts). Mirrors the shape SSOT in
-- packages/db/presets/orders, trimmed to what the GitHub gate needs, plus first_name /
-- last_name split from the buyer's name. See docs/adr/0037-landing-orders-d1.md.
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id        TEXT NOT NULL UNIQUE,
  email           TEXT,
  first_name      TEXT,
  last_name       TEXT,
  github_username TEXT,
  refunded        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_github_username ON orders (github_username);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
