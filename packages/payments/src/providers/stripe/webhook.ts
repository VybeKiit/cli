import type { StripeConfig } from '@vybekiit/payments/config';
import { caughtMessage, failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { OrderEvent, PaymentError } from '@vybekiit/payments/types';
import { Effect } from 'effect';
import Stripe from 'stripe';

type StripeChargeWithOptionalBillingDetails = Stripe.Charge & {
  readonly billing_details?: Stripe.Charge.BillingDetails;
};

/**
 * Resolve an optional or nullable provider string to the internal nullable form.
 *
 * @param value - Optional string read from a Stripe object.
 * @returns The non-empty string, or `null` when Stripe omitted it.
 * @example
 * const email = stripeStringToNull(session.customer_email);
 */
const stripeStringToNull = (value: string | null | undefined): string | null => {
  if (value !== undefined && value !== null && value.length > 0) {
    return value;
  }

  return null;
};

/**
 * Read the buyer email from a Stripe checkout session.
 *
 * @param session - Stripe checkout session payload.
 * @returns The customer details email, customer email, or `null`.
 * @example
 * const email = readStripeSessionEmail(session);
 */
const readStripeSessionEmail = (session: Stripe.Checkout.Session): string | null => {
  const detailsEmail = stripeStringToNull(session.customer_details?.email);
  if (detailsEmail !== null) {
    return detailsEmail;
  }

  return stripeStringToNull(session.customer_email);
};

/**
 * Read the buyer email from a Stripe charge.
 *
 * @param charge - Stripe charge payload.
 * @returns The billing details email, receipt email, or `null`.
 * @example
 * const email = readStripeChargeEmail(charge);
 */
const readStripeChargeEmail = (charge: Stripe.Charge): string | null => {
  const { billing_details: billingDetails, receipt_email: receiptEmail } =
    charge as StripeChargeWithOptionalBillingDetails;

  if (billingDetails !== undefined) {
    const billingEmail = stripeStringToNull(billingDetails.email);
    if (billingEmail !== null) {
      return billingEmail;
    }
  }

  return stripeStringToNull(receiptEmail);
};

/**
 * Read the GitHub username stored in Stripe metadata.
 *
 * @param metadata - Stripe metadata object from a checkout session or charge.
 * @returns The GitHub username, or `null` when absent.
 * @example
 * const username = readStripeGithubUsername(session.metadata);
 */
const readStripeGithubUsername = (metadata: Stripe.Metadata | null | undefined): string | null => {
  if (metadata === undefined || metadata === null) {
    return null;
  }

  return stripeStringToNull(metadata.github_username);
};

/**
 * Map a verified Stripe event to the normalized {@link OrderEvent}.
 *
 * @param event - Verified Stripe event from webhook signature validation.
 * @returns An Effect containing the normalized order event.
 * @example
 * const event = await Effect.runPromise(mapStripeEvent(stripeEvent));
 */
export const mapStripeEvent = (event: Stripe.Event): Effect.Effect<OrderEvent, PaymentError> => {
  const eventType = String(event.type);

  if (eventType === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return Effect.succeed({
      provider: 'stripe',
      eventName: eventType,
      orderId: session.id,
      customerEmail: readStripeSessionEmail(session),
      customerName: stripeStringToNull(session.customer_details?.name),
      githubUsername: readStripeGithubUsername(session.metadata),
      isRefund: false,
    });
  }

  if (eventType === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.id;
    return Effect.succeed({
      provider: 'stripe',
      eventName: eventType,
      orderId: paymentIntentId,
      customerEmail: readStripeChargeEmail(charge),
      customerName: stripeStringToNull(
        (charge as StripeChargeWithOptionalBillingDetails).billing_details?.name,
      ),
      githubUsername: readStripeGithubUsername(charge.metadata),
      isRefund: true,
    });
  }

  return failPayment('unhandled_event', `Stripe event "${eventType}" is not handled.`);
};

/**
 * Verify a Stripe webhook signature and map it to an {@link OrderEvent}.
 *
 * @param config - Validated Stripe secret key and webhook secret.
 * @param rawBody - Exact request body string as received.
 * @param signature - Stripe signature header.
 * @returns An Effect containing the normalized order event.
 * @example
 * const event = await Effect.runPromise(parseStripeWebhook(config, rawBody, signature));
 */
export const parseStripeWebhook = (
  config: StripeConfig,
  rawBody: string,
  signature: string,
): Effect.Effect<OrderEvent, PaymentError> =>
  Effect.gen(function* () {
    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
    const event = yield* Effect.try({
      try: () => stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET),
      catch: (caught) =>
        paymentError(
          'invalid_signature',
          `Stripe webhook verification failed: ${caughtMessage(caught, 'bad signature')}`,
        ),
    });
    return yield* mapStripeEvent(event);
  });
