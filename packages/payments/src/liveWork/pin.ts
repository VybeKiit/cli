import type { PaymentsLadderProvider, ProvisionedPayments } from './types';

/**
 * Build root `.env` keys for a successful payments pin (ADR-0039).
 * Only `PAYMENTS_PROVIDER` — secrets already live in env and are never re-emitted
 * into public Live work JSON.
 *
 * @param provisioned - Winner from the ladder / existing payments pin.
 * @returns Key map for PAYMENTS_PROVIDER.
 * @example
 * buildPaymentsPinKeys({ provider: 'stripe', ephemeral: false });
 */
export const buildPaymentsPinKeys = (provisioned: ProvisionedPayments): Record<string, string> => ({
  PAYMENTS_PROVIDER: provisioned.provider,
});

const BRANDS: Record<PaymentsLadderProvider, string> = {
  'lemon-squeezy': 'Lemon Squeezy',
  stripe: 'Stripe',
  paypal: 'PayPal',
};

/**
 * Display brand for a payments ladder provider.
 *
 * @param provider - Ladder provider id.
 * @returns Buyer-facing vendor name.
 * @example
 * paymentsBrand('lemon-squeezy') === 'Lemon Squeezy';
 */
export const paymentsBrand = (provider: PaymentsLadderProvider): string => BRANDS[provider];

/**
 * Plain-language success note after payments verify (no env/API jargon).
 *
 * @param provider - Winning payments adapter.
 * @param hopped - Whether a free-tier / onboarding hop occurred.
 * @param fromProvider - Provider left behind when hopped.
 * @returns Buyer-facing message.
 * @example
 * buyerPaymentsSuccessMessage('stripe', true, 'lemon-squeezy');
 */
export const buyerPaymentsSuccessMessage = (
  provider: PaymentsLadderProvider,
  hopped: boolean,
  fromProvider?: PaymentsLadderProvider,
): string => {
  const brand = paymentsBrand(provider);
  if (hopped && fromProvider !== undefined) {
    return `${paymentsBrand(fromProvider)} wasn't ready yet, so we set up taking money with ${brand}. It works. You're set.`;
  }
  return `Taking money is ready with ${brand}.`;
};
