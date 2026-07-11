/**
 * Format integer cents as a USD currency string.
 * `19900` → `"$199.00"`.
 *
 * @param cents - Amount in integer cents (avoids float drift).
 * @returns Locale-formatted USD string (`en-US`).
 * @example
 * formatUsdCents(19900); // "$199.00"
 */
export const formatUsdCents = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

/**
 * Format integer cents as whole-dollar USD (no fractional digits).
 * `249900` → `"$2,499"`.
 *
 * @param cents - Amount in integer cents.
 * @returns Locale-formatted whole-dollar USD string.
 * @example
 * formatUsdWholeCents(249900); // "$2,499"
 */
export const formatUsdWholeCents = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
