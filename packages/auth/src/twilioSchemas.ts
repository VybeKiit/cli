import { Either, Schema } from 'effect';

export const TwilioVerificationCheckResponseSchema = Schema.Struct({
  status: Schema.optional(Schema.String),
});

const decodeTwilioVerificationCheck = Schema.decodeUnknownEither(
  TwilioVerificationCheckResponseSchema,
);

/**
 * Read the Twilio Verify status from an unknown response body.
 *
 * @param body - Unknown JSON body returned by Twilio Verify.
 * @returns The status string when the body matches the Twilio shape.
 * @example
 * const status = readTwilioVerificationStatus({ status: 'approved' });
 */
export const readTwilioVerificationStatus = (body: unknown): string | undefined => {
  const parsed = decodeTwilioVerificationCheck(body);
  return Either.isRight(parsed) ? parsed.right.status : undefined;
};

export const TwilioMessageResponseSchema = Schema.Struct({
  sid: Schema.optional(Schema.String),
});

const decodeTwilioMessage = Schema.decodeUnknownEither(TwilioMessageResponseSchema);

/**
 * Read the Twilio message SID from an unknown response body.
 *
 * @param body - Unknown JSON body returned by Twilio Messaging.
 * @returns The SID string when the body matches the Twilio shape.
 * @example
 * const sid = readTwilioMessageSid({ sid: 'SM123' });
 */
export const readTwilioMessageSid = (body: unknown): string | undefined => {
  const parsed = decodeTwilioMessage(body);
  return Either.isRight(parsed) ? parsed.right.sid : undefined;
};
