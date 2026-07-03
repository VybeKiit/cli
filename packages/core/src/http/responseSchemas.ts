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

export function decodeIdResponse(body: unknown): string | null {
  const parsed = decoders.id(body);
  return Either.isRight(parsed) ? parsed.right.id : null;
}

export function decodeResendSendResponse(body: unknown): { id: string } | null {
  const parsed = decoders.resend(body);
  return Either.isRight(parsed) ? parsed.right : null;
}

export function decodeExpoPushSendResponse(
  body: unknown,
): typeof ExpoPushSendResponseSchema.Type | null {
  const parsed = decoders.expo(body);
  return Either.isRight(parsed) ? parsed.right : null;
}

export function decodeTwilioVerificationCheckResponse(
  body: unknown,
): typeof TwilioVerificationCheckResponseSchema.Type | null {
  const parsed = decoders.twilioVerify(body);
  return Either.isRight(parsed) ? parsed.right : null;
}

export function decodeTwilioMessageResponse(
  body: unknown,
): typeof TwilioMessageResponseSchema.Type | null {
  const parsed = Schema.decodeUnknownEither(TwilioMessageResponseSchema)(body);
  return Either.isRight(parsed) ? parsed.right : null;
}

export function decodeOpenAiChatCompletionResponse(
  body: unknown,
): typeof OpenAiChatCompletionResponseSchema.Type | null {
  const parsed = decoders.openai(body);
  return Either.isRight(parsed) ? parsed.right : null;
}

export function decodeAssetManifest(raw: unknown): typeof AssetManifestSchema.Type | null {
  const parsed = decoders.assetManifest(raw);
  return Either.isRight(parsed) ? parsed.right : null;
}
