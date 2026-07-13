import type { EnvSource } from '@vybekiit/core';
import type { PaymentsLadderProvider } from './types';

/**
 * Preference ladder for the payments concern (ADR-0039).
 * Lemon Squeezy first (Merchant of Record story); hop only on free-tier /
 * onboarding-blocked / missing credentials.
 */
export const PAYMENTS_PREFERENCE_LADDER = [
  'lemon-squeezy',
  'stripe',
  'paypal',
] as const satisfies readonly PaymentsLadderProvider[];

/**
 * True when value is a payments ladder provider id.
 *
 * @param value - Candidate.
 * @returns Whether on the payments preference ladder.
 * @example
 * isPaymentsLadderProvider('stripe') === true;
 */
export const isPaymentsLadderProvider = (value: string): value is PaymentsLadderProvider =>
  (PAYMENTS_PREFERENCE_LADDER as readonly string[]).includes(value);

/**
 * Resolve which payments ladder entries to try.
 *
 * - **Named vendor stick**: only that adapter.
 * - **Pinned `PAYMENTS_PROVIDER`**: start at pin, then later entries as fallbacks.
 * - Otherwise full ladder from #1.
 *
 * @param env - Raw environment (pin from PAYMENTS_PROVIDER).
 * @param namedVendor - Optional vendor the builder named.
 * @returns Ordered adapters.
 * @example
 * resolvePaymentsLadderOrder({}, 'stripe'); // → ['stripe']
 */
export const resolvePaymentsLadderOrder = (
  env: EnvSource,
  namedVendor?: PaymentsLadderProvider | null,
): readonly PaymentsLadderProvider[] => {
  if (namedVendor !== undefined && namedVendor !== null) {
    return [namedVendor];
  }

  const raw = env.PAYMENTS_PROVIDER;
  if (typeof raw === 'string' && isPaymentsLadderProvider(raw)) {
    const start = PAYMENTS_PREFERENCE_LADDER.indexOf(raw);
    if (start >= 0) {
      return PAYMENTS_PREFERENCE_LADDER.slice(start);
    }
  }

  return PAYMENTS_PREFERENCE_LADDER;
};

/**
 * Read the active payments pin when it sits on the preference ladder.
 *
 * @param env - Raw environment.
 * @returns Pinned payments provider or null.
 * @example
 * readPaymentsPin({ PAYMENTS_PROVIDER: 'stripe' }) === 'stripe';
 */
export const readPaymentsPin = (env: EnvSource): PaymentsLadderProvider | null => {
  const raw = env.PAYMENTS_PROVIDER;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  return isPaymentsLadderProvider(raw) ? raw : null;
};
