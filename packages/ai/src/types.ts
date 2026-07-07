import type { AiProviderNameType } from '@vybekiit/ai/config';
import { Data, type Effect, Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));
const PositiveInteger = Schema.Number.pipe(Schema.int(), Schema.positive());

/** Prompt input for an AI completion request. */
export const CompleteParams = Schema.Struct({
  prompt: NonEmptyString,
  system: Schema.optional(NonEmptyString),
  maxTokens: Schema.optional(PositiveInteger),
});

/** Static type inferred from {@link CompleteParams}. */
export type CompleteParamsType = Schema.Schema.Type<typeof CompleteParams>;

/** Backward-compatible completion parameter alias during the Schema migration. */
export type CompleteParams = CompleteParamsType;

/** Text returned from an AI completion request. */
export const CompleteResult = Schema.Struct({
  text: NonEmptyString,
});

/** Static type inferred from {@link CompleteResult}. */
export type CompleteResultType = Schema.Schema.Type<typeof CompleteResult>;

/** Backward-compatible completion result alias during the Schema migration. */
export type CompleteResult = CompleteResultType;

/** Backward-compatible provider name alias during the Schema migration. */
export type AiProviderName = AiProviderNameType;

/** Expected AI failures that callers may recover from. */
export class AiError extends Data.TaggedError('AiError')<{
  readonly code:
    | 'AI_CONFIG_INVALID'
    | 'AI_PROVIDER_UNSUPPORTED'
    | 'AI_REQUEST_FAILED'
    | 'AI_RESPONSE_INVALID';
  readonly message: string;
}> {}

/** Effect service contract for AI completion providers. */
export type AiService = {
  readonly name: AiProviderNameType;
  readonly complete: (params: CompleteParamsType) => Effect.Effect<CompleteResultType, AiError>;
  readonly stream: (params: CompleteParamsType) => Effect.Effect<AsyncIterable<string>, AiError>;
  readonly verifyDelivery: () => Effect.Effect<true, AiError>;
};

/** Backward-compatible alias for the AI service shape during the Effect migration. */
export type AiProvider = AiService;
