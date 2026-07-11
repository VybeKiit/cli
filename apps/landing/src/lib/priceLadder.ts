/**
 * Rising price ladder for the VybeKiit store.
 *
 * Fixed compare-at (value stack) stays at the ceiling. The live sell price starts
 * at `startUsd` and multiplies by `multiplier` after every paid sale, rounded to
 * the nearest dollar and floored at the ceiling. Refunds never lower the price.
 *
 * Formula: price after `completedSales` paid orders =
 *   min(ceiling, round(startUsd * multiplier^completedSales))
 * so the first buyer (0 sales) pays startUsd.
 */

/** Ladder knobs — single source of truth for math, store seed, and marketing fallbacks. */
export const PRICE_LADDER = {
  /** First buyer pay amount in whole USD. */
  startUsd: 29,
  /** Compare-at / max sell price (value stack). */
  ceilingUsd: 655,
  /** Multiplier applied after each paid sale (10% rise). */
  multiplier: 1.1,
} as const;

/** Snapshot of the ladder for API + UI consumers. */
export type PriceLadderSnapshot = {
  /** Whole USD the next buyer pays. */
  readonly amount: number;
  /** Same amount in cents (Lemon Squeezy `custom_price`). */
  readonly amountCents: number;
  /** Display string, e.g. `$29`. */
  readonly display: string;
  /** Fixed compare-at USD. */
  readonly compareAt: number;
  /** Compare-at display, e.g. `$655`. */
  readonly compareAtDisplay: string;
  /** Percent off compare-at (ceil), for “96% off” style copy. */
  readonly savingsPercent: number;
  /** Paid sales already applied to the ladder. */
  readonly saleCount: number;
  /** What the buyer after the next one would pay. */
  readonly nextAmount: number;
  /** Display for {@link nextAmount}. */
  readonly nextDisplay: string;
  /** True when the live price is at the ceiling. */
  readonly isAtCeiling: boolean;
};

/**
 * Format a whole-USD amount as a store display string.
 *
 * @param usd - Whole dollars (no cents).
 * @returns Display like `$29`.
 * @example
 * formatUsd(29); // '$29'
 */
export const formatUsd = (usd: number): string => `$${usd}`;

/**
 * Sell price in whole USD after `completedSales` paid orders have been applied.
 *
 * @param completedSales - Non-negative count of paid sales already on the ladder.
 * @returns Whole-USD price for the next buyer, capped at the ceiling.
 * @example
 * priceUsdAfterSales(0); // 29
 * priceUsdAfterSales(1); // 32
 */
export const priceUsdAfterSales = (completedSales: number): number => {
  const safeCount = Number.isFinite(completedSales) && completedSales > 0 ? completedSales : 0;
  if (safeCount === 0) {
    return PRICE_LADDER.startUsd;
  }

  const raw = PRICE_LADDER.startUsd * PRICE_LADDER.multiplier ** safeCount;
  return Math.min(PRICE_LADDER.ceilingUsd, Math.round(raw));
};

/**
 * Sell price in cents after `completedSales` paid orders (for checkout overrides).
 *
 * @param completedSales - Non-negative count of paid sales already on the ladder.
 * @returns Price in US cents.
 * @example
 * priceCentsAfterSales(0); // 2900
 */
export const priceCentsAfterSales = (completedSales: number): number =>
  priceUsdAfterSales(completedSales) * 100;

/**
 * Discount percent off the fixed compare-at ceiling (ceiled, never negative).
 *
 * @param priceUsd - Live sell price in whole USD.
 * @returns Integer percent, e.g. 96 for $29 vs $655.
 * @example
 * savingsPercentOffCeiling(29); // 96
 */
export const savingsPercentOffCeiling = (priceUsd: number): number => {
  const clamped = Math.min(PRICE_LADDER.ceilingUsd, Math.max(0, priceUsd));
  return Math.ceil(((PRICE_LADDER.ceilingUsd - clamped) / PRICE_LADDER.ceilingUsd) * 100);
};

/**
 * Build a full ladder snapshot from a completed-sales count.
 *
 * @param saleCount - Paid sales already applied.
 * @returns Snapshot for the next buyer and the one after.
 * @example
 * const snap = snapshotFromSaleCount(0);
 * snap.display; // '$29'
 */
export const snapshotFromSaleCount = (saleCount: number): PriceLadderSnapshot => {
  const safeCount = Number.isFinite(saleCount) && saleCount > 0 ? Math.floor(saleCount) : 0;
  const amount = priceUsdAfterSales(safeCount);
  const nextAmount = priceUsdAfterSales(safeCount + 1);
  return {
    amount,
    amountCents: amount * 100,
    display: formatUsd(amount),
    compareAt: PRICE_LADDER.ceilingUsd,
    compareAtDisplay: formatUsd(PRICE_LADDER.ceilingUsd),
    savingsPercent: savingsPercentOffCeiling(amount),
    saleCount: safeCount,
    nextAmount,
    nextDisplay: formatUsd(nextAmount),
    isAtCeiling: amount >= PRICE_LADDER.ceilingUsd,
  };
};

/**
 * Generate the first `steps` rungs of the ladder (for docs / e2e tables).
 *
 * @param steps - How many sale indices to list (default 34 covers start → ceiling).
 * @returns Array of `{ saleIndex, amount, savingsPercent }` where saleIndex 0 is first buyer.
 * @example
 * const table = ladderJumpTable(5);
 */
export const ladderJumpTable = (
  steps = 34,
): readonly {
  readonly saleIndex: number;
  readonly amount: number;
  readonly savingsPercent: number;
}[] => {
  const count = Math.max(1, Math.min(100, Math.floor(steps)));
  return Array.from({ length: count }, (_, saleIndex) => {
    const amount = priceUsdAfterSales(saleIndex);
    return {
      saleIndex,
      amount,
      savingsPercent: savingsPercentOffCeiling(amount),
    };
  });
};
