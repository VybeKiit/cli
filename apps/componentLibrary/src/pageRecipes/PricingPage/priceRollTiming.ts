/**
 * Shared NumberFlow spin timing for pricing digits.
 * Snappy enough for monthly ↔ annual toggles without feeling sluggish.
 */
export const PRICE_ROLL_MS = 550;

/** Ease-out curve matched to landing number rolls. */
export const PRICE_ROLL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)' as const;

/** NumberFlow spin + transform timing for every price/seat roll on this page. */
export const priceRollTiming = {
  duration: PRICE_ROLL_MS,
  easing: PRICE_ROLL_EASING,
} as const;

/** USD with cents — matches `formatUsdCents` display. */
export const USD_CENTS_FORMAT = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;
