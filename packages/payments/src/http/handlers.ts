import { badInput, type HttpResponse, ok as okResponse, upstreamFailed } from '@vybekiit/core/http';
import { isPaymentsUnconfigured } from '@vybekiit/payments/practice';
import { Payments, resolvePaymentProvider } from '@vybekiit/payments/resolve';
import type { OrderEvent, PaymentError } from '@vybekiit/payments/types';
import { Cause, Effect, Either, Exit, Option, Schema } from 'effect';
import type { CheckoutBody, PracticeCompleteBody } from './schemas';

/**
 * Express `express.raw()` body: UTF-8 string or byte buffer.
 * Buffer is a Uint8Array subclass, so one instance check covers both.
 */
const WebhookRawBodySchema = Schema.Union(
  Schema.String,
  Schema.transform(Schema.instanceOf(Uint8Array), Schema.String, {
    decode: (bytes) => Buffer.from(bytes).toString('utf8'),
    encode: (text) => Buffer.from(text, 'utf8'),
  }),
);
const decodeWebhookRawBody = Schema.decodeUnknownEither(WebhookRawBodySchema);

const practiceCheckoutFallbackUrl = 'http://localhost:3000';

/** Dependencies required by the provider-agnostic checkout handler. */
export type CheckoutHttpDeps = {
  readonly env?: Record<string, string | undefined>;
  /** Server origin (API base). Used for real provider success URLs. */
  readonly appUrl?: string | undefined;
  /** Buyer-facing origin for practice checkout redirects (SPA/web). */
  readonly frontendUrl?: string | undefined;
  readonly requestOrigin?: string | null;
};

type FulfillOrderEffect = (event: OrderEvent) => Effect.Effect<true, { readonly message: string }>;

/** Dependencies required by the practice-mode completion handler. */
export type PracticeCompleteHttpDeps = {
  readonly fulfillOrder: FulfillOrderEffect;
};

/** Dependencies required by the payment webhook handler. */
export type WebhookHttpDeps = {
  readonly fulfillOrder: FulfillOrderEffect;
  readonly env?: Record<string, string | undefined>;
};

/** HTTP response body returned by the shared payment handlers. */
export type PaymentsHttpResponse = HttpResponse<
  { readonly url: string } | { readonly ok: true; readonly orderId?: string }
>;

/**
 * Resolve the environment source used by checkout handling.
 *
 * @param deps - Checkout handler dependencies that may include an env override.
 * @returns The provided env source, or `process.env` at the composition boundary.
 * @example
 * const env = resolveCheckoutEnv({ env: process.env });
 */
const resolveCheckoutEnv = (deps: CheckoutHttpDeps): Record<string, string | undefined> => {
  if (deps.env !== undefined) {
    return deps.env;
  }

  return process.env;
};

/**
 * Resolve the base URL used by practice checkout redirects.
 *
 * @param deps - Checkout dependencies containing possible frontend or app origins.
 * @returns The first configured origin, or the local development fallback.
 * @example
 * const baseUrl = resolvePracticeBaseUrl({ frontendUrl: 'http://localhost:5173' });
 */
const resolvePracticeBaseUrl = (deps: CheckoutHttpDeps): string => {
  if (deps.frontendUrl !== undefined && deps.frontendUrl.length > 0) {
    return deps.frontendUrl;
  }

  if (
    deps.requestOrigin !== undefined &&
    deps.requestOrigin !== null &&
    deps.requestOrigin.length > 0
  ) {
    return deps.requestOrigin;
  }

  if (deps.appUrl !== undefined && deps.appUrl.length > 0) {
    return deps.appUrl;
  }

  return practiceCheckoutFallbackUrl;
};

/**
 * Pull a tagged error message from a failed Effect cause.
 *
 * @param cause - Failed Effect cause from a payment or fulfillment run.
 * @param fallback - Message used when the cause is a defect.
 * @returns Tagged error message, or a generic line for defects.
 * @example
 * const message = effectErrorMessage(exit.cause, 'Payment provider request failed.');
 */
const effectErrorMessage = <E extends { readonly message: string }>(
  cause: Cause.Cause<E>,
  fallback: string,
): string => {
  const failure = Option.getOrNull(Cause.failureOption(cause));
  if (failure !== null) {
    return failure.message;
  }

  return fallback;
};

/**
 * Start a purchase through the configured payment provider.
 *
 * @param body - Validated checkout request body.
 * @param deps - Optional handler dependencies supplied by the framework adapter.
 * @returns A normalized HTTP response containing the hosted checkout URL or an error.
 * @example
 * const response = await handleCheckout(body, { env: process.env, appUrl });
 */
export const handleCheckout = async (
  body: CheckoutBody,
  deps: CheckoutHttpDeps = {},
): Promise<PaymentsHttpResponse> => {
  const { productId, githubUsername, email } = body;

  const env = resolveCheckoutEnv(deps);
  if (isPaymentsUnconfigured(env)) {
    const base = resolvePracticeBaseUrl(deps);
    const url = `${base}/checkout/practice?productId=${encodeURIComponent(productId)}`;
    return okResponse({ url });
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
    return upstreamFailed(
      effectErrorMessage<PaymentError>(exit.cause, 'Payment provider request failed.'),
    );
  }
  return okResponse({ url: exit.value.url });
};

/**
 * Verify a provider webhook and run fulfillment.
 *
 * @param rawBody - Raw webhook body string exactly as received.
 * @param headers - Lower-case webhook request headers.
 * @param deps - Fulfillment callback and optional provider env override.
 * @returns A normalized HTTP response for the webhook route.
 * @example
 * const response = await handleWebhook(rawBody, headers, { fulfillOrder, env });
 */
export const handleWebhook = async (
  rawBody: string,
  headers: Record<string, string>,
  deps: WebhookHttpDeps,
): Promise<PaymentsHttpResponse> => {
  const provider = resolvePaymentProvider(deps.env);
  const program = Effect.gen(function* () {
    const payments = yield* Payments;
    return yield* payments.parseWebhook(rawBody, headers);
  });
  const exit = await Effect.runPromiseExit(Effect.provideService(program, Payments, provider));
  if (Exit.isFailure(exit)) {
    return badInput(
      effectErrorMessage<PaymentError>(exit.cause, 'Payment provider request failed.'),
    );
  }

  const fulfilled = await Effect.runPromiseExit(deps.fulfillOrder(exit.value));
  if (Exit.isFailure(fulfilled)) {
    return upstreamFailed(effectErrorMessage(fulfilled.cause, 'Order fulfillment failed.'));
  }
  return okResponse({ ok: true });
};

/**
 * Complete a practice-mode checkout by simulating provider success and fulfillment.
 *
 * @param body - Validated practice completion request body.
 * @param deps - Fulfillment callback used by the practice flow.
 * @returns A normalized HTTP response containing the synthetic practice order id.
 * @example
 * const response = await handlePracticeComplete(body, { fulfillOrder });
 */
export const handlePracticeComplete = async (
  body: PracticeCompleteBody,
  deps: PracticeCompleteHttpDeps,
): Promise<PaymentsHttpResponse> => {
  const { productId } = body;

  const orderId = `practice_${productId}_${Date.now()}`;
  const result = await Effect.runPromiseExit(
    deps.fulfillOrder({
      provider: 'lemon-squeezy',
      eventName: 'practice_checkout_completed',
      orderId,
      customerEmail: 'practice@example.com',
      customerName: null,
      githubUsername: null,
      isRefund: false,
    }),
  );

  if (Exit.isFailure(result)) {
    return upstreamFailed(effectErrorMessage(result.cause, 'Order fulfillment failed.'));
  }
  return okResponse({ ok: true, orderId });
};

/**
 * Read a raw webhook body from Express when `express.raw()` is mounted.
 *
 * Steps:
 * 1. Decode with {@link WebhookRawBodySchema} (string or Uint8Array/Buffer).
 * 2. Return the UTF-8 text for signature verification.
 * 3. Throw when the body is not raw bytes (e.g. already-parsed JSON).
 *
 * @param body - Raw body value provided by Express.
 * @returns The webhook body as a UTF-8 string.
 * @throws When the body is not a string or Buffer.
 * @example
 * const rawBody = readWebhookRawBody(req.body);
 */
export const readWebhookRawBody = (body: unknown): string => {
  const parsed = decodeWebhookRawBody(body);
  if (Either.isLeft(parsed)) {
    throw new Error('Webhook body must be raw bytes.');
  }
  return parsed.right;
};
