import type { SendEmailParamsType } from '@vybekiit/email/types';
import { type Effect, type ParseResult, Schema } from 'effect';

const TrimmedString = Schema.transform(Schema.String, Schema.String, {
  strict: true,
  decode: (value) => value.trim(),
  encode: (value) => value,
});

const RequiredTrimmedField = TrimmedString.pipe(Schema.minLength(1));

/** JSON body for `POST /send` on the Cloudflare email worker. */
export const CloudflareWorkerSendBody = Schema.Struct({
  to: RequiredTrimmedField,
  from: RequiredTrimmedField,
  subject: RequiredTrimmedField,
  html: Schema.String.pipe(Schema.minLength(1)),
  text: Schema.optional(Schema.String),
});

/** Static type inferred from {@link CloudflareWorkerSendBody}. */
export type CloudflareWorkerSendBodyType = Schema.Schema.Type<typeof CloudflareWorkerSendBody>;

/** Backward-compatible worker request type alias during the Schema migration. */
export type CloudflareWorkerSendBody = CloudflareWorkerSendBodyType;

/** Successful send response from the Cloudflare email worker. */
export const CloudflareWorkerSendResponse = Schema.Struct({
  id: RequiredTrimmedField,
});

/** Static type inferred from {@link CloudflareWorkerSendResponse}. */
export type CloudflareWorkerSendResponseType = Schema.Schema.Type<
  typeof CloudflareWorkerSendResponse
>;

/** Backward-compatible schema export name during the Schema migration. */
export const CloudflareWorkerSendBodySchema = CloudflareWorkerSendBody;

const decodeWorkerSendBody = Schema.decodeUnknown(CloudflareWorkerSendBody);

/**
 * Convert normalized email params into the Cloudflare worker request body.
 *
 * @param params - Validated send parameters for the email message.
 * @returns The JSON body accepted by the Cloudflare worker send endpoint.
 * @example
 * const body = toWorkerSendBody({ to, from, subject, html });
 */
export const toWorkerSendBody = (params: SendEmailParamsType): CloudflareWorkerSendBodyType => {
  if (params.text === undefined) {
    return {
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
    };
  }
  return {
    to: params.to,
    from: params.from,
    subject: params.subject,
    html: params.html,
    text: params.text,
  };
};

/**
 * Validate and normalize an unknown JSON value into a worker send body.
 *
 * @param raw - Unknown JSON value received by the worker endpoint.
 * @returns An Effect that succeeds with the normalized body or fails with a ParseError.
 * @example
 * const body = await Effect.runPromise(parseWorkerSendBody(await request.json()));
 */
export const parseWorkerSendBody = (
  raw: unknown,
): Effect.Effect<CloudflareWorkerSendBodyType, ParseResult.ParseError> => decodeWorkerSendBody(raw);

/**
 * Lowercase the domain segment of a sender or recipient address.
 *
 * @param email - Email address to inspect.
 * @returns The lowercased domain, or an empty string when the input has no domain.
 * @example
 * senderDomain('Hello@Mail.Example.COM'); // 'mail.example.com'
 */
export const senderDomain = (email: string): string => {
  const [, domain] = email.split('@');
  if (domain === undefined) {
    return '';
  }
  return domain.toLowerCase();
};
