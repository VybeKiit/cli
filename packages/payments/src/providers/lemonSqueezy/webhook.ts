import { createHmac, timingSafeEqual } from 'node:crypto';
import { failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { OrderEvent, PaymentError } from '@vybekiit/payments/types';
import { Effect, Either, Schema } from 'effect';

const webhookSchema = Schema.Struct({
  meta: Schema.Struct({
    event_name: Schema.String.pipe(Schema.minLength(1)),
    custom_data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  }),
  data: Schema.Struct({
    id: Schema.String,
    attributes: Schema.Struct({
      user_email: Schema.optional(Schema.String),
      user_name: Schema.optional(Schema.String),
      refunded: Schema.optional(Schema.Boolean),
    }),
  }),
});

const decodeWebhook = Schema.decodeUnknownEither(webhookSchema);

/**
 * Resolve an optional string field to a nullable internal value.
 *
 * @param value - Optional string decoded from a provider payload.
 * @returns The non-empty string, or `null` when the provider omitted it.
 * @example
 * const email = optionalStringToNull(data.attributes.user_email);
 */
const optionalStringToNull = (value: string | undefined): string | null => {
  if (value !== undefined && value.length > 0) {
    return value;
  }

  return null;
};

/**
 * Read the GitHub username stored in Lemon Squeezy custom data.
 *
 * @param customData - Optional checkout custom data decoded from the webhook.
 * @returns The GitHub username, or `null` when not present.
 * @example
 * const username = readLemonSqueezyGithubUsername(meta.custom_data);
 */
const readLemonSqueezyGithubUsername = (
  customData: Readonly<Record<string, string>> | undefined,
): string | null => {
  if (customData === undefined) {
    return null;
  }

  return optionalStringToNull(customData.github_username);
};

/**
 * Verify a Lemon Squeezy webhook signature.
 *
 * @param rawBody - Exact request body string as received.
 * @param signature - `X-Signature` header value in hex form.
 * @param secret - Lemon Squeezy webhook secret.
 * @returns `true` when the signature matches the raw body.
 * @example
 * const verified = verifyLemonSqueezySignature(rawBody, signature, secret);
 */
export const verifyLemonSqueezySignature = (
  rawBody: string,
  signature: string,
  secret: string,
): boolean => {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature.length !== digest.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'));
};

/**
 * Verify, parse, and normalize a Lemon Squeezy webhook.
 *
 * @param rawBody - Exact request body string as received.
 * @param signature - Lemon Squeezy signature header.
 * @param secret - Lemon Squeezy webhook secret.
 * @returns An Effect containing the normalized order event.
 * @example
 * const event = await Effect.runPromise(parseLemonSqueezyWebhook(rawBody, signature, secret));
 */
export const parseLemonSqueezyWebhook = (
  rawBody: string,
  signature: string,
  secret: string,
): Effect.Effect<OrderEvent, PaymentError> =>
  Effect.gen(function* () {
    if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
      return yield* failPayment('invalid_signature', 'Webhook signature did not match.');
    }

    const json = yield* Effect.try({
      try: () => JSON.parse(rawBody) as unknown,
      catch: () => paymentError('invalid_body', 'Webhook body was not valid JSON.'),
    });

    const parsed = decodeWebhook(json);
    if (Either.isLeft(parsed)) {
      return yield* failPayment('invalid_shape', 'Webhook payload was missing expected fields.');
    }

    const { meta, data } = parsed.right;
    return {
      provider: 'lemon-squeezy',
      eventName: meta.event_name,
      orderId: data.id,
      customerEmail: optionalStringToNull(data.attributes.user_email),
      customerName: optionalStringToNull(data.attributes.user_name),
      githubUsername: readLemonSqueezyGithubUsername(meta.custom_data),
      isRefund: meta.event_name === 'order_refunded' || data.attributes.refunded === true,
    };
  });
