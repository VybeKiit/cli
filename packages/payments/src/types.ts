import type { Result } from '@vybekiit/core';

/**
 * The payment processors VybeKiit ships an adapter for. A buyer runs exactly one
 * at a time (chosen via `PAYMENTS_PROVIDER`); the agent can swap by changing that
 * one env value, because every call site talks to the {@link PaymentProvider}
 * interface rather than a specific vendor.
 */
export type PaymentProviderName = 'lemon-squeezy' | 'stripe' | 'paypal';

/**
 * Inputs for creating a hosted checkout, normalized across providers.
 *
 * `productId` is whatever id the chosen provider sells: a Lemon Squeezy *variant*
 * id, a Stripe *price* id, or — for PayPal, which has no catalog primitive here —
 * a price *amount* string like `"29.00"`. `githubUsername` is round-tripped to the
 * webhook as order metadata so the gate can invite that exact account; this is how
 * a payment links to the right GitHub user with no account system of our own.
 */
export interface CheckoutParams {
  /** Provider-specific purchasable id (LS variant / Stripe price / PayPal amount). */
  readonly productId: string;
  /** Buyer's GitHub username — carried to the webhook as order metadata. */
  readonly githubUsername?: string;
  /** Pre-fill the buyer's email on the checkout. */
  readonly email?: string;
  /** Where the provider sends the buyer after a successful purchase. */
  readonly successUrl?: string;
  /** Where the provider sends the buyer if they cancel (Stripe/PayPal). */
  readonly cancelUrl?: string;
}

/** A created checkout the caller redirects the buyer to. */
export interface CheckoutResult {
  /** Hosted checkout / approval URL. */
  readonly url: string;
}

/**
 * The normalized order event every provider maps its raw webhook into — the stable
 * internal shape the gate, fulfillment, and skills consume, decoupled from each
 * vendor's envelope. Swapping providers never changes this shape.
 */
export interface OrderEvent {
  /** Which adapter produced this event. */
  readonly provider: PaymentProviderName;
  /** Vendor event name, e.g. `order_created`, `checkout.session.completed`. */
  readonly eventName: string;
  /** Vendor order/transaction id. */
  readonly orderId: string;
  /** Buyer email, if present on the order. */
  readonly customerEmail: string | null;
  /** GitHub username carried through checkout metadata — the gate's key input. */
  readonly githubUsername: string | null;
  /** True when this event should *revoke* access (a refund). */
  readonly isRefund: boolean;
}

/**
 * Incoming webhook request headers (lower-cased keys), passed through so an adapter
 * can read its signature header (`x-signature`, `stripe-signature`, the PayPal
 * `paypal-*` set) without the route knowing which one matters.
 */
export type WebhookHeaders = Record<string, string | undefined>;

/**
 * The swappable payment seam. Each adapter is constructed from its own validated
 * config (api keys + webhook secret live in the factory, not per call), so both
 * methods are credential-free at the call site and uniform across vendors.
 *
 * `parseWebhook` is async because PayPal verifies signatures with a live API call;
 * the Lemon Squeezy and Stripe adapters verify locally and resolve immediately.
 */
export interface PaymentProvider {
  /** Which vendor this instance talks to. */
  readonly name: PaymentProviderName;
  /** Create a hosted checkout and return its redirect URL. */
  createCheckout(params: CheckoutParams): Promise<Result<CheckoutResult>>;
  /** Verify + parse a raw webhook body into a normalized {@link OrderEvent}. */
  parseWebhook(rawBody: string, headers: WebhookHeaders): Promise<Result<OrderEvent>>;
}
