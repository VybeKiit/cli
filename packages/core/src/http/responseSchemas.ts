import { Either, Schema } from 'effect';

export const IdResponseSchema = Schema.Struct({
  id: Schema.String,
});

export const ResendSendResponseSchema = IdResponseSchema;

export const ExpoPushSendResponseSchema = Schema.Struct({
  data: Schema.optional(Schema.Struct({ id: Schema.optional(Schema.String) })),
});

export const TwilioVerificationCheckResponseSchema = Schema.Struct({
  status: Schema.optional(Schema.String),
});

export const TwilioMessageResponseSchema = Schema.Struct({
  sid: Schema.optional(Schema.String),
});

export const OpenAiChatCompletionResponseSchema = Schema.Struct({
  choices: Schema.optional(
    Schema.Array(
      Schema.Struct({
        message: Schema.optional(Schema.Struct({ content: Schema.optional(Schema.String) })),
      }),
    ),
  ),
});

export const AssetManifestSchema = Schema.Struct({
  files: Schema.Record({
    key: Schema.String,
    value: Schema.Struct({
      source: Schema.String,
      optimized: Schema.String,
      variants: Schema.Record({ key: Schema.String, value: Schema.String }),
    }),
  }),
});

const decoders = {
  id: Schema.decodeUnknownEither(IdResponseSchema),
  resend: Schema.decodeUnknownEither(ResendSendResponseSchema),
  expo: Schema.decodeUnknownEither(ExpoPushSendResponseSchema),
  twilioVerify: Schema.decodeUnknownEither(TwilioVerificationCheckResponseSchema),
  openai: Schema.decodeUnknownEither(OpenAiChatCompletionResponseSchema),
  assetManifest: Schema.decodeUnknownEither(AssetManifestSchema),
} as const;

/**
 * Decode a provider response shaped as `{ id: string }`.
 *
 * @param body - Unknown response body from a provider.
 * @returns The decoded id, or `null` when the body does not match.
 * @example
 * const id = decodeIdResponse(await response.json());
 */
export const decodeIdResponse = (body: unknown): string | null => {
  const parsed = decoders.id(body);
  return Either.isRight(parsed) ? parsed.right.id : null;
};

/**
 * Decode a Resend send-email response.
 *
 * @param body - Unknown Resend response body.
 * @returns The decoded `{ id }` response, or `null` when the body does not match.
 * @example
 * const sent = decodeResendSendResponse(await response.json());
 */
export const decodeResendSendResponse = (body: unknown): { id: string } | null => {
  const parsed = decoders.resend(body);
  return Either.isRight(parsed) ? parsed.right : null;
};

/**
 * Decode an Expo push send response.
 *
 * @param body - Unknown Expo response body.
 * @returns The decoded Expo response, or `null` when the body does not match.
 * @example
 * const sent = decodeExpoPushSendResponse(await response.json());
 */
export const decodeExpoPushSendResponse = (
  body: unknown,
): typeof ExpoPushSendResponseSchema.Type | null => {
  const parsed = decoders.expo(body);
  return Either.isRight(parsed) ? parsed.right : null;
};

/**
 * Decode a Twilio Verify check response.
 *
 * @param body - Unknown Twilio response body.
 * @returns The decoded Verify response, or `null` when the body does not match.
 * @example
 * const check = decodeTwilioVerificationCheckResponse(await response.json());
 */
export const decodeTwilioVerificationCheckResponse = (
  body: unknown,
): typeof TwilioVerificationCheckResponseSchema.Type | null => {
  const parsed = decoders.twilioVerify(body);
  return Either.isRight(parsed) ? parsed.right : null;
};

/**
 * Decode a Twilio message response.
 *
 * @param body - Unknown Twilio response body.
 * @returns The decoded message response, or `null` when the body does not match.
 * @example
 * const message = decodeTwilioMessageResponse(await response.json());
 */
export const decodeTwilioMessageResponse = (
  body: unknown,
): typeof TwilioMessageResponseSchema.Type | null => {
  const parsed = Schema.decodeUnknownEither(TwilioMessageResponseSchema)(body);
  return Either.isRight(parsed) ? parsed.right : null;
};

/**
 * Decode an OpenAI chat completion response.
 *
 * @param body - Unknown OpenAI response body.
 * @returns The decoded completion response, or `null` when the body does not match.
 * @example
 * const completion = decodeOpenAiChatCompletionResponse(await response.json());
 */
export const decodeOpenAiChatCompletionResponse = (
  body: unknown,
): typeof OpenAiChatCompletionResponseSchema.Type | null => {
  const parsed = decoders.openai(body);
  return Either.isRight(parsed) ? parsed.right : null;
};

/**
 * Decode an optimized asset manifest.
 *
 * @param raw - Unknown manifest JSON read from disk or the network.
 * @returns The decoded manifest, or `null` when the body does not match.
 * @example
 * const manifest = decodeAssetManifest(JSON.parse(file));
 */
export const decodeAssetManifest = (raw: unknown): typeof AssetManifestSchema.Type | null => {
  const parsed = decoders.assetManifest(raw);
  return Either.isRight(parsed) ? parsed.right : null;
};
