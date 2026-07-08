import { PAYPAL_API_BASE } from '@vybekiit/core';
import type { PaypalConfig } from '@vybekiit/payments/config';
import { caughtMessage, failPayment, paymentError } from '@vybekiit/payments/paymentEffect';
import type { OrderEvent, PaymentError } from '@vybekiit/payments/types';
import { Effect, Either, Schema } from 'effect';

const eventSchema = Schema.Struct({
  event_type: Schema.String.pipe(Schema.minLength(1)),
  resource: Schema.Struct({
    id: Schema.optional(Schema.String),
    custom_id: Schema.optional(Schema.String),
    payer: Schema.optional(
      Schema.Struct({
        email_address: Schema.optional(Schema.String),
        name: Schema.optional(
          Schema.Struct({
            given_name: Schema.optional(Schema.String),
            surname: Schema.optional(Schema.String),
          }),
        ),
      }),
    ),
    purchase_units: Schema.optional(
      Schema.Array(Schema.Struct({ custom_id: Schema.optional(Schema.String) })),
    ),
  }),
});

type PayPalEvent = Schema.Schema.Type<typeof eventSchema>;

type PayPalVerificationHeaders = {
  readonly authAlgo: string;
  readonly certUrl: string;
  readonly transmissionId: string;
  readonly transmissionSig: string;
  readonly transmissionTime: string;
};

const decodeEvent = Schema.decodeUnknownEither(eventSchema);
const decodeToken = Schema.decodeUnknownEither(Schema.Struct({ access_token: Schema.String }));
const decodeVerify = Schema.decodeUnknownEither(
  Schema.Struct({ verification_status: Schema.String }),
);

/**
 * Resolve an optional provider string to the internal nullable form.
 *
 * @param value - Optional string decoded from a PayPal payload.
 * @returns The non-empty string, or `null` when PayPal omitted it.
 * @example
 * const email = paypalStringToNull(resource.payer?.email_address);
 */
const paypalStringToNull = (value: string | undefined): string | null => {
  if (value !== undefined && value.length > 0) {
    return value;
  }

  return null;
};

/**
 * Read the PayPal resource id used as the normalized order id.
 *
 * @param event - Decoded PayPal webhook event.
 * @returns An Effect containing the non-empty resource id.
 * @example
 * const orderId = await Effect.runPromise(readPayPalOrderId(event));
 */
const readPayPalOrderId = (event: PayPalEvent): Effect.Effect<string, PaymentError> => {
  const orderId = event.resource.id;
  if (orderId === undefined || orderId.length === 0) {
    return failPayment('invalid_shape', 'PayPal webhook payload did not include a resource id.');
  }

  return Effect.succeed(orderId);
};

/**
 * Read the GitHub username from PayPal custom fields.
 *
 * @param event - Decoded PayPal webhook event.
 * @returns The GitHub username, or `null` when absent.
 * @example
 * const username = readPayPalGithubUsername(event);
 */
const readPayPalGithubUsername = (event: PayPalEvent): string | null => {
  const directUsername = paypalStringToNull(event.resource.custom_id);
  if (directUsername !== null) {
    return directUsername;
  }

  const purchaseUnits = event.resource.purchase_units;
  if (purchaseUnits === undefined) {
    return null;
  }

  const [firstUnit] = purchaseUnits;
  if (firstUnit === undefined) {
    return null;
  }

  return paypalStringToNull(firstUnit.custom_id);
};

/**
 * Read the buyer's full name from a PayPal payer, joining the given name and surname.
 *
 * @param event - Decoded PayPal webhook event.
 * @returns The buyer's full name, or `null` when PayPal omitted it.
 * @example
 * const name = readPayPalCustomerName(event);
 */
const readPayPalCustomerName = (event: PayPalEvent): string | null => {
  const name = event.resource.payer?.name;
  if (name === undefined) {
    return null;
  }

  const parts = [name.given_name, name.surname].filter(
    (part): part is string => part !== undefined && part.length > 0,
  );
  return parts.length > 0 ? parts.join(' ') : null;
};

/**
 * Read one required PayPal verification header.
 *
 * @param headers - Lower-case webhook request headers.
 * @param name - Required PayPal header name.
 * @returns An Effect containing the header value.
 * @example
 * const transmissionId = await Effect.runPromise(readPayPalHeader(headers, 'paypal-transmission-id'));
 */
const readPayPalHeader = (
  headers: Record<string, string | undefined>,
  name: string,
): Effect.Effect<string, PaymentError> => {
  const value = headers[name];
  if (value === undefined || value.length === 0) {
    return failPayment('invalid_signature', `Missing PayPal webhook header: ${name}.`);
  }

  return Effect.succeed(value);
};

/**
 * Read the required PayPal verification header group.
 *
 * @param headers - Lower-case webhook request headers.
 * @returns An Effect containing all headers PayPal requires for verification.
 * @example
 * const headers = await Effect.runPromise(readPayPalVerificationHeaders(requestHeaders));
 */
const readPayPalVerificationHeaders = (
  headers: Record<string, string | undefined>,
): Effect.Effect<PayPalVerificationHeaders, PaymentError> =>
  Effect.gen(function* () {
    const authAlgo = yield* readPayPalHeader(headers, 'paypal-auth-algo');
    const certUrl = yield* readPayPalHeader(headers, 'paypal-cert-url');
    const transmissionId = yield* readPayPalHeader(headers, 'paypal-transmission-id');
    const transmissionSig = yield* readPayPalHeader(headers, 'paypal-transmission-sig');
    const transmissionTime = yield* readPayPalHeader(headers, 'paypal-transmission-time');

    return {
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
    };
  });

/**
 * Map a verified PayPal event to the normalized {@link OrderEvent}.
 *
 * @param event - Decoded and verified PayPal webhook event.
 * @returns An Effect containing the normalized order event.
 * @example
 * const orderEvent = await Effect.runPromise(mapPayPalEvent(paypalEvent));
 */
export const mapPayPalEvent = (event: PayPalEvent): Effect.Effect<OrderEvent, PaymentError> =>
  Effect.gen(function* () {
    const orderId = yield* readPayPalOrderId(event);

    return {
      provider: 'paypal',
      eventName: event.event_type,
      orderId,
      customerEmail: paypalStringToNull(event.resource.payer?.email_address),
      customerName: readPayPalCustomerName(event),
      githubUsername: readPayPalGithubUsername(event),
      isRefund: event.event_type.includes('REFUND'),
    };
  });

/**
 * Parse a JSON response body returned by PayPal.
 *
 * @param response - PayPal fetch response to decode.
 * @param code - Stable payment error code for parse failures.
 * @param message - Developer-facing failure detail.
 * @returns An Effect containing the decoded JSON body.
 * @example
 * const json = await Effect.runPromise(readPayPalJson(response, 'auth_error', 'Bad OAuth response.'));
 */
const readPayPalJson = (
  response: Response,
  code: string,
  message: string,
): Effect.Effect<unknown, PaymentError> =>
  Effect.tryPromise({
    try: () => response.json() as Promise<unknown>,
    catch: () => paymentError(code, message),
  });

/**
 * Fetch a PayPal client-credentials access token.
 *
 * @param config - Validated PayPal credentials and environment.
 * @returns An Effect containing an access token for PayPal verification calls.
 * @example
 * const token = await Effect.runPromise(getAccessToken(config));
 */
const getAccessToken = (config: PaypalConfig): Effect.Effect<string, PaymentError> =>
  Effect.gen(function* () {
    const credentials = Buffer.from(
      `${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_CLIENT_SECRET}`,
    ).toString('base64');

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${PAYPAL_API_BASE[config.PAYPAL_ENV]}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        }),
      catch: (caught) =>
        paymentError(
          'network_error',
          `Could not reach PayPal OAuth: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });
    if (!response.ok) {
      return yield* failPayment('auth_error', `PayPal OAuth returned ${response.status}.`);
    }

    const json = yield* readPayPalJson(
      response,
      'auth_error',
      'PayPal OAuth response did not include an access token.',
    );
    const parsed = decodeToken(json);
    if (Either.isLeft(parsed)) {
      return yield* failPayment(
        'auth_error',
        'PayPal OAuth response did not include an access token.',
      );
    }

    return parsed.right.access_token;
  });

/**
 * Verify the webhook signature against PayPal's verification endpoint.
 *
 * @param config - Validated PayPal credentials and webhook id.
 * @param event - Parsed webhook event body to send back to PayPal.
 * @param headers - Verified PayPal request headers.
 * @param token - OAuth access token for the verification request.
 * @returns An Effect that succeeds when PayPal verifies the signature.
 * @example
 * await Effect.runPromise(verifyPayPalWebhookSignature(config, event, headers, token));
 */
const verifyPayPalWebhookSignature = (
  config: PaypalConfig,
  event: unknown,
  headers: PayPalVerificationHeaders,
  token: string,
): Effect.Effect<void, PaymentError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${PAYPAL_API_BASE[config.PAYPAL_ENV]}/v1/notifications/verify-webhook-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_algo: headers.authAlgo,
            cert_url: headers.certUrl,
            transmission_id: headers.transmissionId,
            transmission_sig: headers.transmissionSig,
            transmission_time: headers.transmissionTime,
            webhook_id: config.PAYPAL_WEBHOOK_ID,
            webhook_event: event,
          }),
        }),
      catch: (caught) =>
        paymentError(
          'network_error',
          `Could not reach PayPal: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });
    if (!response.ok) {
      return yield* failPayment(
        'network_error',
        `PayPal verification returned ${response.status}.`,
      );
    }

    const json = yield* readPayPalJson(
      response,
      'invalid_signature',
      'PayPal verification response was not valid.',
    );
    const parsed = decodeVerify(json);
    if (Either.isLeft(parsed) || parsed.right.verification_status !== 'SUCCESS') {
      return yield* failPayment('invalid_signature', 'PayPal webhook signature did not verify.');
    }
  });

/**
 * Verify a PayPal webhook and map it to an {@link OrderEvent}.
 *
 * @param config - Validated PayPal credentials and webhook id.
 * @param rawBody - Exact request body string as received.
 * @param headers - Lower-case PayPal webhook request headers.
 * @returns An Effect containing the normalized order event.
 * @example
 * const event = await Effect.runPromise(parsePayPalWebhook(config, rawBody, headers));
 */
export const parsePayPalWebhook = (
  config: PaypalConfig,
  rawBody: string,
  headers: Record<string, string | undefined>,
): Effect.Effect<OrderEvent, PaymentError> =>
  Effect.gen(function* () {
    const event = yield* Effect.try({
      try: () => JSON.parse(rawBody) as unknown,
      catch: () => paymentError('invalid_body', 'Webhook body was not valid JSON.'),
    });
    const verificationHeaders = yield* readPayPalVerificationHeaders(headers);
    const token = yield* getAccessToken(config);

    yield* verifyPayPalWebhookSignature(config, event, verificationHeaders, token);

    const parsed = decodeEvent(event);
    if (Either.isLeft(parsed)) {
      return yield* failPayment('invalid_shape', 'Webhook payload was missing expected fields.');
    }
    return yield* mapPayPalEvent(parsed.right);
  });
