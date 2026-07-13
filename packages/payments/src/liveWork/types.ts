import { Data } from 'effect';

/**
 * Payment adapters on the preference ladder (ADR-0039).
 * Order: lemon-squeezy → stripe → paypal.
 */
export type PaymentsLadderProvider = 'lemon-squeezy' | 'stripe' | 'paypal';

/**
 * Live work execution mode — same as data/host concerns (ADR-0039).
 * Payments do not auto-create vendor accounts; demo uses existing keys only.
 */
export type LiveWorkMode = 'demo' | 'dogfood' | 'buyer';

/**
 * Classified outcome of a payments ladder step failure.
 * Hop on quota / onboarding-blocked (e.g. Lemon Squeezy store not ready) /
 * missing credentials; hard_stop on wrong keys or unknown errors.
 */
export type HopClass = 'quota' | 'onboarding_blocked' | 'missing_credentials' | 'hard_stop';

/**
 * Tagged failure for payments Live work.
 */
export class PaymentsLiveWorkError extends Data.TaggedError('PaymentsLiveWorkError')<{
  readonly code: string;
  readonly message: string;
  readonly hopClass: HopClass;
  readonly provider?: PaymentsLadderProvider;
}> {}

/**
 * Verified payment backend before pin (no secrets in this snapshot).
 */
export type ProvisionedPayments = {
  readonly provider: PaymentsLadderProvider;
  /** Always false for payments — we never auto-create money rails. */
  readonly ephemeral: false;
};

/**
 * Successful payments Live work outcome.
 */
export type PaymentsLiveWorkResult = {
  readonly provider: PaymentsLadderProvider;
  readonly ephemeral: false;
  readonly hopped: boolean;
  readonly fromProvider?: PaymentsLadderProvider;
  readonly skipped: readonly PaymentsLadderProvider[];
  /** Public pin keys only (`PAYMENTS_PROVIDER`) — never API secrets. */
  readonly pin: Record<string, string>;
  readonly verified: true;
  readonly buyerMessage: string;
};

/**
 * Build {@link ProvisionedPayments}.
 *
 * @param provider - Winning ladder provider.
 * @returns Clean provisioned snapshot.
 * @example
 * makeProvisionedPayments('stripe');
 */
export const makeProvisionedPayments = (provider: PaymentsLadderProvider): ProvisionedPayments => ({
  provider,
  ephemeral: false,
});
