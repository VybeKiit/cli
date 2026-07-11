-- Rising sell-price ladder for the VybeKiit store (Model A: +10% per paid sale).
-- sale_count is the number of paid orders already applied; current_price_cents is the
-- next buyer price (derived from sale_count via apps/landing/src/lib/priceLadder.ts).
-- price_ladder_orders makes webhook redeliveries idempotent. See priceLadderStore.ts.

CREATE TABLE IF NOT EXISTS price_ladder (
  id                   TEXT PRIMARY KEY,
  sale_count           INTEGER NOT NULL DEFAULT 0,
  current_price_cents  INTEGER NOT NULL,
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO price_ladder (id, sale_count, current_price_cents, updated_at)
VALUES ('kit', 0, 2900, datetime('now'));

CREATE TABLE IF NOT EXISTS price_ladder_orders (
  order_id           TEXT PRIMARY KEY,
  sale_index         INTEGER NOT NULL,
  price_paid_cents   INTEGER NOT NULL,
  price_after_cents  INTEGER NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_price_ladder_orders_created_at
  ON price_ladder_orders (created_at);
