import type { Result } from '@vybekiit/core';
import { badInput, type HttpResponse, ok, upstreamFailed } from '@vybekiit/core/http';
import { isPaymentsUnconfigured } from '@vybekiit/payments/practice';
import { Payments, resolvePaymentProvider } from '@vybekiit/payments/resolve';
import type { OrderEvent, PaymentError } from '@vybekiit/payments/types';
import { Cause, Effect, Exit, Option } from 'effect';
import type { CheckoutBody, PracticeCompleteBody } from './schemas';

export type { CheckoutBody, PracticeCompleteBody } from './schemas';
export {
  CheckoutBodySchema,
  PracticeCompleteBodySchema,
} from './schemas';

export interface CheckoutHttpDeps {
  env?: Record<string, string | undefined>;
  /** Server origin (API base). Used for real provider success URLs. */
  appUrl?: string | undefined;
  /** Buyer-facing origin for practice checkout redirects (SPA/web). */
  frontendUrl?: string | undefined;
  requestOrigin?: string | null;
}

export interface PracticeCompleteHttpDeps {
  fulfillOrder: (event: OrderEvent) => Promise<Result<true>>;
}

export interface WebhookHttpDeps {
  fulfillOrder: (event: OrderEvent) => Promise<Result<true>>;
  env?: Record<string, string | undefined>;
}

export type PaymentsHttpResponse = HttpResponse<
  { readonly url: string } | { readonly ok: true; readonly orderId?: string }
>;

/** Pull the {@link PaymentError} message from a failed run's cause; a defect falls back to a generic line. */
function paymentErrorMessage(cause: Cause.Cause<PaymentError>): string {
  return (
    Option.getOrNull(Cause.failureOption(cause))?.message ?? 'Payment provider request failed.'
  );
}

/** Start a purchase — provider-agnostic checkout handler shared by Next and Express. */
export async function handleCheckout(
  body: CheckoutBody,
  deps: CheckoutHttpDeps = {},
): Promise<PaymentsHttpResponse> {
  const { productId, githubUsername, email } = body;

  const env = deps.env ?? process.env;
  if (isPaymentsUnconfigured(env)) {
    const base = deps.frontendUrl ?? deps.requestOrigin ?? deps.appUrl ?? 'http://localhost:3000';
    const url = `${base}/checkout/practice?productId=${encodeURIComponent(productId)}`;
    return ok({ url });
  }

  const provider = resolvePaymentProvider(env);
  const program = Effect.gen(function* () {
    const payments = yield* Payments;
    return yield* payments.createCheckout({
      productId,
      ...(githubUsername ? { githubUsername } : {}),
      ...(email ? { email } : {}),
      ...(deps.appUrl ? { successUrl: deps.appUrl } : {}),
    });
  });
  const exit = await Effect.runPromiseExit(Effect.provideService(program, Payments, provider));
  if (Exit.isFailure(exit)) {
    return upstreamFailed(paymentErrorMessage(exit.cause));
  }
  return ok({ url: exit.value.url });
}

/** Verify a provider webhook and run fulfillment. */
export async function handleWebhook(
  rawBody: string,
  headers: Record<string, string>,
  deps: WebhookHttpDeps,
): Promise<PaymentsHttpResponse> {
  const provider = resolvePaymentProvider(deps.env);
  const program = Effect.gen(function* () {
    const payments = yield* Payments;
    return yield* payments.parseWebhook(rawBody, headers);
  });
  const exit = await Effect.runPromiseExit(Effect.provideService(program, Payments, provider));
  if (Exit.isFailure(exit)) {
    return badInput(paymentErrorMessage(exit.cause));
  }

  const fulfilled = await deps.fulfillOrder(exit.value);
  if (!fulfilled.ok) {
    return upstreamFailed(fulfilled.error.message);
  }
  return ok({ ok: true });
}

/** Complete a practice-mode checkout — simulates provider success + fulfillment. */
export async function handlePracticeComplete(
  body: PracticeCompleteBody,
  deps: PracticeCompleteHttpDeps,
): Promise<PaymentsHttpResponse> {
  const { productId } = body;

  const orderId = `practice_${productId}_${Date.now()}`;
  const result = await deps.fulfillOrder({
    provider: 'lemon-squeezy',
    eventName: 'practice_checkout_completed',
    orderId,
    customerEmail: 'practice@example.com',
    githubUsername: null,
    isRefund: false,
  });

  if (!result.ok) {
    return upstreamFailed(result.error.message);
  }
  return ok({ ok: true, orderId });
}

/** Read a raw webhook body from Express when `express.raw()` is mounted. */
export function readWebhookRawBody(body: unknown): string {
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  throw new Error('Webhook body must be raw bytes.');
}
