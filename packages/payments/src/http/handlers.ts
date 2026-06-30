import type { Result } from '@vybekiit/core';
import { isPaymentsUnconfigured } from '../practice';
import { resolvePaymentProvider } from '../resolve';
import type { OrderEvent } from '../types';

export interface CheckoutBody {
  productId?: string;
  githubUsername?: string;
  email?: string;
}

export interface CheckoutHttpDeps {
  env?: Record<string, string | undefined>;
  appUrl?: string | undefined;
  requestOrigin?: string | null;
}

export interface WebhookHttpDeps {
  fulfillOrder: (event: OrderEvent) => Promise<Result<true>>;
  env?: Record<string, string | undefined>;
}

export interface PaymentsHttpResponse {
  status: number;
  body: unknown;
}

/** Start a purchase — provider-agnostic checkout handler shared by Next and Express. */
export async function handleCheckout(
  body: CheckoutBody,
  deps: CheckoutHttpDeps = {},
): Promise<PaymentsHttpResponse> {
  const { productId, githubUsername, email } = body;
  if (!productId) {
    return { status: 400, body: { error: 'productId is required.' } };
  }

  const env = deps.env ?? process.env;
  if (isPaymentsUnconfigured(env)) {
    const base = deps.appUrl ?? deps.requestOrigin ?? 'http://localhost:3000';
    const url = `${base}/checkout/practice?productId=${encodeURIComponent(productId)}`;
    return { status: 200, body: { url } };
  }

  const result = await resolvePaymentProvider(env).createCheckout({
    productId,
    ...(githubUsername ? { githubUsername } : {}),
    ...(email ? { email } : {}),
    ...(deps.appUrl ? { successUrl: deps.appUrl } : {}),
  });

  if (!result.ok) {
    return { status: 502, body: { error: result.error.message } };
  }
  return { status: 200, body: { url: result.value.url } };
}

/** Verify a provider webhook and run fulfillment. */
export async function handleWebhook(
  rawBody: string,
  headers: Record<string, string>,
  deps: WebhookHttpDeps,
): Promise<PaymentsHttpResponse> {
  const event = await resolvePaymentProvider(deps.env).parseWebhook(rawBody, headers);
  if (!event.ok) {
    return { status: 400, body: { error: event.error.message } };
  }

  const fulfilled = await deps.fulfillOrder(event.value);
  if (!fulfilled.ok) {
    return { status: 502, body: { error: fulfilled.error.message } };
  }
  return { status: 200, body: { ok: true } };
}

/** Read a raw webhook body from Express when `express.raw()` is mounted. */
export function readWebhookRawBody(body: unknown): string {
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  throw new Error('Webhook body must be raw bytes.');
}
