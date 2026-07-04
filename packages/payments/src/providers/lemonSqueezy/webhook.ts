import { createHmac, timingSafeEqual } from 'node:crypto';
import { fail, ok, type Result } from '@vybekiit/core';
import type { OrderEvent } from '@vybekiit/payments/types';
import { Either, Schema } from 'effect';

/**
 * Raw Lemon Squeezy webhook envelope (only the fields VybeKiit reads).
 *
 * `meta.custom_data` carries the checkout custom fields set at checkout time —
 * specifically the buyer's GitHub username, which the gate uses to send the repo
 * invite. `Schema.Struct` strips unknown keys on decode, so extra LS fields are tolerated.
 */
const webhookSchema = Schema.Struct({
  meta: Schema.Struct({
    event_name: Schema.String.pipe(Schema.minLength(1)),
    custom_data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  }),
  data: Schema.Struct({
    id: Schema.String,
    attributes: Schema.Struct({
      user_email: Schema.optional(Schema.String),
      refunded: Schema.optional(Schema.Boolean),
    }),
  }),
});

const decodeWebhook = Schema.decodeUnknownEither(webhookSchema);

/**
 * Verify a Lemon Squeezy webhook signature (HMAC-SHA256 of the raw body).
 *
 * Uses a constant-time compare so a forged signature can't be brute-forced by
 * timing. The raw, unparsed body must be passed — re-serializing JSON would change
 * bytes and break the digest.
 *
 * @param rawBody - the exact request body bytes/string as received
 * @param signature - the `X-Signature` header value (hex)
 * @param secret - `LEMONSQUEEZY_WEBHOOK_SECRET`
 */
export function verifyLemonSqueezySignature(
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
export function parseLemonSqueezyWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): Result<OrderEvent> {
  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return fail('invalid_signature', 'Webhook signature did not match.');
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return fail('invalid_body', 'Webhook body was not valid JSON.');
  }

  const parsed = decodeWebhook(json);
  if (Either.isLeft(parsed)) {
    return fail('invalid_shape', 'Webhook payload was missing expected fields.');
  }

  const { meta, data } = parsed.right;
  return ok({
    provider: 'lemon-squeezy',
    eventName: meta.event_name,
    orderId: data.id,
    customerEmail: data.attributes.user_email ?? null,
    githubUsername: meta.custom_data?.github_username ?? null,
    isRefund: meta.event_name === 'order_refunded' || data.attributes.refunded === true,
  });
}
