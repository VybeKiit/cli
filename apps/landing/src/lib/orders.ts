import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * The single prepared-statement surface this module uses, declared structurally so the
 * landing needs no `@cloudflare/workers-types` dependency for one upsert. Matches the
 * `DB` D1 binding declared in `wrangler.jsonc`.
 */
type D1Bound = { readonly run: () => Promise<unknown> };
type D1Prepared = { readonly bind: (...values: readonly unknown[]) => D1Bound };
type D1Like = { readonly prepare: (query: string) => D1Prepared };

/** A buyer order to record, normalized from the payment webhook's {@link OrderEvent}. */
export type OrderRecord = {
  /** Vendor order id — the unique upsert key. */
  readonly orderId: string;
  /** Buyer email, if the provider sent one. */
  readonly email: string | null;
  /** Buyer full name as the provider captured it (split into first/last on write). */
  readonly customerName: string | null;
  /** GitHub username carried through checkout — the gate key. */
  readonly githubUsername: string | null;
  /** Whether this event revokes access (a refund). */
  readonly refunded: boolean;
};

const UPSERT_ORDER = `
INSERT INTO orders (order_id, email, first_name, last_name, github_username, refunded, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
ON CONFLICT(order_id) DO UPDATE SET
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  github_username = excluded.github_username,
  refunded = excluded.refunded,
  updated_at = datetime('now')`;

/**
 * Split a provider's single full-name field into first and last name: the first
 * whitespace token is the first name, the remainder the last name. A mononym keeps a
 * null last name; an empty/absent name yields two nulls.
 *
 * @param fullName - Buyer name as the provider captured it, or null.
 * @returns The first and last name, each nullable.
 * @example
 * const { firstName, lastName } = splitName('Ada Lovelace'); // 'Ada', 'Lovelace'
 */
export const splitName = (
  fullName: string | null,
): { firstName: string | null; lastName: string | null } => {
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
 * Upsert one order into the D1 `orders` table, keyed on the unique vendor order id so a
 * redelivered webhook updates the row rather than duplicating it.
 *
 * @param db - The `DB` D1 binding.
 * @param order - The normalized order to record.
 * @returns Nothing; resolves once the row is written.
 * @example
 * await upsertOrder(db, { orderId: 'ord_1', email, customerName, githubUsername, refunded: false });
 */
export const upsertOrder = async (db: D1Like, order: OrderRecord): Promise<void> => {
  const { firstName, lastName } = splitName(order.customerName);
  await db
    .prepare(UPSERT_ORDER)
    .bind(
      order.orderId,
      order.email,
      firstName,
      lastName,
      order.githubUsername,
      order.refunded ? 1 : 0,
    )
    .run();
};

/**
 * Record an order without ever failing the caller: bookkeeping must not break the money
 * pipeline's gate, and Lemon Squeezy stays the source of truth for payments. Returns
 * whether the row was written (`false` when the D1 binding is absent — e.g. a run without
 * Cloudflare bindings — or the write throws) so the webhook can surface it in its
 * response. See docs/adr/0037-landing-orders-d1.md.
 *
 * @param order - The normalized order to record.
 * @returns `true` when the row was persisted, `false` otherwise.
 * @example
 * const recorded = await recordOrderBestEffort({ orderId, email, customerName, githubUsername, refunded });
 */
export const recordOrderBestEffort = async (order: OrderRecord): Promise<boolean> => {
  try {
    const { env } = getCloudflareContext();
    const db = (env as { DB?: D1Like }).DB;
    if (db === undefined) {
      return false;
    }

    await upsertOrder(db, order);
    return true;
  } catch {
    return false;
  }
};
