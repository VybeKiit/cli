import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  PRICE_LADDER,
  type PriceLadderSnapshot,
  priceCentsAfterSales,
  priceUsdAfterSales,
  snapshotFromSaleCount,
} from '@/lib/priceLadder';

/**
 * D1 surface used by the ladder store (structural — no Workers types dependency).
 */
type D1Bound = {
  readonly run: () => Promise<unknown>;
  readonly first: <T extends Record<string, unknown>>() => Promise<T | null>;
};
type D1Prepared = { readonly bind: (...values: readonly unknown[]) => D1Bound };
type D1Like = { readonly prepare: (query: string) => D1Prepared };

/** Result of applying one paid order to the ladder. */
export type PriceLadderApplyResult = {
  /** Whether this order moved the ladder (false = already applied / refund no-op). */
  readonly bumped: boolean;
  /** Snapshot after the call (next buyer price). */
  readonly snapshot: PriceLadderSnapshot;
  /** Whole USD the buyer who just paid was charged (null when not bumped). */
  readonly paidAmount: number | null;
};

type LadderRow = {
  readonly sale_count: number;
  readonly current_price_cents: number;
};

type MemoryState = {
  saleCount: number;
  readonly appliedOrders: Map<string, { readonly paidAmount: number }>;
};

const LADDER_ROW_ID = 'kit';

const SELECT_LADDER = 'SELECT sale_count, current_price_cents FROM price_ladder WHERE id = ?1';

const ENSURE_LADDER_ROW = `
INSERT INTO price_ladder (id, sale_count, current_price_cents, updated_at)
VALUES (?1, 0, ?2, datetime('now'))
ON CONFLICT(id) DO NOTHING`;

const SELECT_APPLIED = 'SELECT order_id FROM price_ladder_orders WHERE order_id = ?1';

const INSERT_APPLIED = `
INSERT INTO price_ladder_orders (order_id, sale_index, price_paid_cents, price_after_cents, created_at)
VALUES (?1, ?2, ?3, ?4, datetime('now'))`;

const UPDATE_LADDER = `
UPDATE price_ladder
SET sale_count = ?2, current_price_cents = ?3, updated_at = datetime('now')
WHERE id = ?1`;

const RESET_LADDER = `
UPDATE price_ladder
SET sale_count = 0, current_price_cents = ?2, updated_at = datetime('now')
WHERE id = ?1`;

const DELETE_APPLIED = 'DELETE FROM price_ladder_orders';

/** Process-local fallback when D1 is unavailable (local `next dev` without bindings, unit tests). */
let memoryState: MemoryState = {
  saleCount: 0,
  appliedOrders: new Map(),
};

/**
 * Reset the in-memory ladder (tests + test-mode reset when D1 is absent).
 *
 * @example
 * resetMemoryPriceLadderForTests();
 */
export const resetMemoryPriceLadderForTests = (): void => {
  memoryState = {
    saleCount: 0,
    appliedOrders: new Map(),
  };
};

/**
 * Try to resolve the Cloudflare D1 binding for the store.
 *
 * @returns The DB binding, or `null` when unavailable.
 */
const tryGetDb = (): D1Like | null => {
  try {
    const { env } = getCloudflareContext();
    const db = (env as { DB?: D1Like }).DB;
    return db ?? null;
  } catch {
    return null;
  }
};

/**
 * Ensure the singleton ladder row exists, then return it.
 *
 * @param db - D1 binding.
 * @returns Current ladder row.
 */
const readLadderRow = async (db: D1Like): Promise<LadderRow> => {
  await db
    .prepare(ENSURE_LADDER_ROW)
    .bind(LADDER_ROW_ID, PRICE_LADDER.startUsd * 100)
    .run();

  const row = await db.prepare(SELECT_LADDER).bind(LADDER_ROW_ID).first<LadderRow>();
  if (row === null) {
    return { sale_count: 0, current_price_cents: PRICE_LADDER.startUsd * 100 };
  }

  return row;
};

/**
 * Build a snapshot from memory state.
 *
 * @returns Live pricing snapshot.
 */
const memorySnapshot = (): PriceLadderSnapshot => snapshotFromSaleCount(memoryState.saleCount);

/**
 * Apply a paid order in memory (idempotent on order id).
 *
 * @param orderId - Vendor order id.
 * @returns Apply result.
 */
const applyPaidSaleMemory = (orderId: string): PriceLadderApplyResult => {
  const existing = memoryState.appliedOrders.get(orderId);
  if (existing !== undefined) {
    return { bumped: false, snapshot: memorySnapshot(), paidAmount: existing.paidAmount };
  }

  const paidAmount = priceUsdAfterSales(memoryState.saleCount);
  const nextCount = memoryState.saleCount + 1;
  memoryState = {
    saleCount: nextCount,
    appliedOrders: new Map(memoryState.appliedOrders).set(orderId, { paidAmount }),
  };

  return {
    bumped: true,
    snapshot: memorySnapshot(),
    paidAmount,
  };
};

/**
 * Read the live ladder snapshot (D1 when bound, otherwise process memory).
 *
 * @returns Snapshot for the next buyer.
 * @example
 * const snap = await getPriceLadderSnapshot();
 */
export const getPriceLadderSnapshot = async (): Promise<PriceLadderSnapshot> => {
  const db = tryGetDb();
  if (db === null) {
    return memorySnapshot();
  }

  try {
    const row = await readLadderRow(db);
    // Prefer sale_count as SSOT; recompute price so math stays consistent if cents drifted.
    return snapshotFromSaleCount(row.sale_count);
  } catch {
    return memorySnapshot();
  }
};

/**
 * Apply one paid order to the ladder. Idempotent on `orderId`. Refunds must not call this
 * (or call with skip — webhook only bumps when `!isRefund`). Never throws.
 *
 * @param orderId - Vendor order id (unique upsert key).
 * @returns Whether the ladder moved and the post-apply snapshot.
 * @example
 * const result = await applyPaidSaleToLadder('ord_123');
 */
export const applyPaidSaleToLadder = async (orderId: string): Promise<PriceLadderApplyResult> => {
  const trimmed = orderId.trim();
  if (trimmed.length === 0) {
    return { bumped: false, snapshot: await getPriceLadderSnapshot(), paidAmount: null };
  }

  const db = tryGetDb();
  if (db === null) {
    return applyPaidSaleMemory(trimmed);
  }

  try {
    const already = await db.prepare(SELECT_APPLIED).bind(trimmed).first<{ order_id: string }>();
    if (already !== null) {
      return { bumped: false, snapshot: await getPriceLadderSnapshot(), paidAmount: null };
    }

    const row = await readLadderRow(db);
    const paidAmount = priceUsdAfterSales(row.sale_count);
    const paidCents = paidAmount * 100;
    const nextCount = row.sale_count + 1;
    const afterCents = priceCentsAfterSales(nextCount);

    await db.prepare(INSERT_APPLIED).bind(trimmed, nextCount, paidCents, afterCents).run();
    await db.prepare(UPDATE_LADDER).bind(LADDER_ROW_ID, nextCount, afterCents).run();

    return {
      bumped: true,
      snapshot: snapshotFromSaleCount(nextCount),
      paidAmount,
    };
  } catch {
    // Soft-fail: mirror the orders ledger — never break the gate for bookkeeping.
    return applyPaidSaleMemory(trimmed);
  }
};

/**
 * Reset the ladder to the first-buyer price. Test / dev only (caller must gate).
 *
 * @returns Snapshot after reset.
 * @example
 * const snap = await resetPriceLadder();
 */
export const resetPriceLadder = async (): Promise<PriceLadderSnapshot> => {
  resetMemoryPriceLadderForTests();

  const db = tryGetDb();
  if (db === null) {
    return memorySnapshot();
  }

  try {
    await db
      .prepare(ENSURE_LADDER_ROW)
      .bind(LADDER_ROW_ID, PRICE_LADDER.startUsd * 100)
      .run();
    // No placeholders — structural D1 type still expects bind; empty call is fine.
    await db.prepare(DELETE_APPLIED).bind().run();
    await db
      .prepare(RESET_LADDER)
      .bind(LADDER_ROW_ID, PRICE_LADDER.startUsd * 100)
      .run();
    return snapshotFromSaleCount(0);
  } catch {
    return memorySnapshot();
  }
};
