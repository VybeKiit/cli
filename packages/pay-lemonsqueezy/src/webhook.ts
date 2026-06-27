import { createHmac, timingSafeEqual } from 'node:crypto';
import { type Result, fail, ok } from '@vybekiit/core';
import { z } from 'zod';

/**
 * Raw Lemon Squeezy webhook envelope (only the fields VybeKiit reads).
 *
 * `meta.custom_data` carries the checkout custom fields we set at checkout time —
 * specifically the buyer's GitHub username, which the gate uses to send the repo
 * invite. `.passthrough()` keeps the validation tolerant of LS adding fields.
 */
const webhookSchema = z.object({
  meta: z.object({
    event_name: z.string().min(1),
    custom_data: z.record(z.string()).optional(),
  }),
  data: z.object({
    id: z.string(),
    attributes: z
      .object({
        user_email: z.string().email().optional(),
        refunded: z.boolean().optional(),
      })
      .passthrough(),
  }),
});

/**
 * Normalized order event VybeKiit acts on — the stable internal shape the gate and
 * skills consume, decoupled from Lemon Squeezy's JSON:API envelope.
 */
export interface LemonSqueezyOrderEvent {
  /** e.g. `order_created`, `order_refunded`. */
  readonly eventName: string;
  /** Lemon Squeezy order id. */
  readonly orderId: string;
  /** Buyer email, if present on the order. */
  readonly customerEmail: string | null;
  /** GitHub username collected as a checkout custom field — the gate's key input. */
  readonly githubUsername: string | null;
  /** True when this event should *revoke* access (refund). */
  readonly isRefund: boolean;
}

/**
 * Verify a Lemon Squeezy webhook signature (HMAC-SHA256 of the raw body).
 *
 * Uses a constant-time compare so a forged signature can't be brute-forced by
 * timing. The raw, unparsed body must be passed — re-serializing JSON would
 * change bytes and break the digest.
 *
 * @param rawBody - the exact request body bytes/string as received
 * @param signature - the `X-Signature` header value (hex)
 * @param secret - `LEMONSQUEEZY_WEBHOOK_SECRET`
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
}

/**
 * Verify, parse, and normalize a Lemon Squeezy webhook in one step.
 *
 * Returns a {@link Result} rather than throwing because an invalid signature or
 * malformed body is an *expected* boundary failure the caller (the webhook route)
 * must translate into a 4xx — not a crash.
 */
export function parseWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): Result<LemonSqueezyOrderEvent> {
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return fail('invalid_signature', 'Webhook signature did not match.');
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return fail('invalid_body', 'Webhook body was not valid JSON.');
  }

  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) {
    return fail('invalid_shape', 'Webhook payload was missing expected fields.');
  }

  const { meta, data } = parsed.data;
  return ok({
    eventName: meta.event_name,
    orderId: data.id,
    customerEmail: data.attributes.user_email ?? null,
    githubUsername: meta.custom_data?.github_username ?? null,
    isRefund: meta.event_name === 'order_refunded' || data.attributes.refunded === true,
  });
}
