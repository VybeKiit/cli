import { Either, Schema } from 'effect';

export const TwilioVerificationCheckResponseSchema = Schema.Struct({
  status: Schema.optional(Schema.String),
});

const decodeTwilioVerificationCheck = Schema.decodeUnknownEither(
  TwilioVerificationCheckResponseSchema,
);

export function readTwilioVerificationStatus(body: unknown): string | undefined {
  const parsed = decodeTwilioVerificationCheck(body);
  return Either.isRight(parsed) ? parsed.right.status : undefined;
}

export const TwilioMessageResponseSchema = Schema.Struct({
  sid: Schema.optional(Schema.String),
});

const decodeTwilioMessage = Schema.decodeUnknownEither(TwilioMessageResponseSchema);

export function readTwilioMessageSid(body: unknown): string | undefined {
  const parsed = decodeTwilioMessage(body);
  return Either.isRight(parsed) ? parsed.right.sid : undefined;
}
