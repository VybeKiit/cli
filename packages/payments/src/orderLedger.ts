import type { OrderEvent } from './types';

/**
 * Canonical order row derived from a normalized {@link OrderEvent}.
 * Store (D1) and buyer (DataProvider) adapters map this shape to their tables.
 */
export type OrderLedgerRow = {
  /** Vendor order id — upsert key. */
  readonly orderId: string;
  /** Buyer email, or null when the provider omitted it. */
  readonly email: string | null;
  /** Full name as captured at checkout, or null. */
  readonly customerName: string | null;
  /** First whitespace token of {@link customerName}, or null. */
  readonly firstName: string | null;
  /** Remainder of {@link customerName} after the first token, or null. */
  readonly lastName: string | null;
  /** GitHub username carried through checkout metadata, or null. */
  readonly githubUsername: string | null;
  /** Whether this event revokes access (refund). */
  readonly refunded: boolean;
};

/**
 * Split a provider full-name field into first / last.
 *
 * @param fullName - Buyer name as the provider captured it, or null.
 * @returns First and last name, each nullable.
 * @example
 * const { firstName, lastName } = splitCustomerName('Ada Lovelace');
 */
export const splitCustomerName = (
  fullName: string | null,
): { readonly firstName: string | null; readonly lastName: string | null } => {
  const trimmed = fullName?.trim() ?? '';
  if (trimmed.length === 0) {
    return { firstName: null, lastName: null };
  }

  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) {
    return { firstName: trimmed, lastName: null };
  }

  const lastName = trimmed.slice(firstSpace + 1).trim();
  return {
    firstName: trimmed.slice(0, firstSpace),
    lastName: lastName.length > 0 ? lastName : null,
  };
};

/**
 * Map a normalized payment event to the shared ledger row.
 *
 * This is the single OrderEvent → row mapper (deletion test: without it, landing
 * and both buyer fulfillments re-learn the same mapping).
 *
 * @param event - Verified {@link OrderEvent} from a payment provider.
 * @returns Canonical ledger row for store or buyer adapters.
 * @example
 * const row = mapOrderEventToLedgerRow(event);
 */
export const mapOrderEventToLedgerRow = (event: OrderEvent): OrderLedgerRow => {
  const { firstName, lastName } = splitCustomerName(event.customerName);
  return {
    orderId: event.orderId,
    email: event.customerEmail,
    customerName: event.customerName,
    firstName,
    lastName,
    githubUsername: event.githubUsername,
    refunded: event.isRefund,
  };
};

/**
 * OrderLedger port — adapters write the canonical row to their store.
 */
export type OrderLedger = {
  /**
   * Persist one order. Best-effort ledgers may swallow storage errors and
   * return `false`; strict ledgers fail the Effect.
   */
  readonly record: (row: OrderLedgerRow) => Promise<boolean> | boolean;
};
