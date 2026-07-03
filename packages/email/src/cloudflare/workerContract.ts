import { type Effect, Schema, type ParseResult } from 'effect';

import type { SendEmailParams } from '../types';

/** JSON body for `POST /send` on the Cloudflare email worker — matches {@link SendEmailParams}. */
export interface CloudflareWorkerSendBody {
  readonly to: string;
  readonly from: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
}

/** Successful send response from the email worker. */
export interface CloudflareWorkerSendResponse {
  readonly id: string;
}

const trimmedString = Schema.transform(Schema.String, Schema.String, {
  strict: true,
  decode: (value) => value.trim(),
  encode: (value) => value,
});

const requiredTrimmedField = trimmedString.pipe(Schema.minLength(1));

export const CloudflareWorkerSendBodySchema = Schema.Struct({
  to: requiredTrimmedField,
  from: requiredTrimmedField,
  subject: requiredTrimmedField,
  html: Schema.String.pipe(Schema.minLength(1)),
  text: Schema.optional(Schema.String),
});

const decodeWorkerSendBody = Schema.decodeUnknown(CloudflareWorkerSendBodySchema);

export function toWorkerSendBody(params: SendEmailParams): CloudflareWorkerSendBody {
  return {
    to: params.to,
    from: params.from,
    subject: params.subject,
    html: params.html,
    ...(params.text ? { text: params.text } : {}),
  };
}

/** Validates and normalizes an unknown JSON value into a worker send body. */
export function parseWorkerSendBody(
  raw: unknown,
): Effect.Effect<typeof CloudflareWorkerSendBodySchema.Type, ParseResult.ParseError, never> {
  return decodeWorkerSendBody(raw);
}

/**
 * Lowercases the domain segment of a sender or recipient address.
 *
 * @example
 * ```ts
 * senderDomain('hello@vybekiit.com'); // => 'vybekiit.com'
 * senderDomain('Hello@Mail.Example.COM'); // => 'mail.example.com'
 * senderDomain('not-an-email'); // => ''
 * ```
 */
export function senderDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}
