import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** Supported AI adapter keys decoded from `AI_PROVIDER`. */
export const AiProviderNameSchema = Schema.Literal('local', 'openai');

/** Static type inferred from {@link AiProviderNameSchema}. */
export type AiProviderNameType = Schema.Schema.Type<typeof AiProviderNameSchema>;

/** AI provider selector config. */
export const AiConfigSchema = Schema.Struct({
  AI_PROVIDER: Schema.optionalWith(AiProviderNameSchema, {
    default: () => 'local' as const,
  }),
});

/** Static type inferred from {@link AiConfigSchema}. */
export type AiConfigType = Schema.Schema.Type<typeof AiConfigSchema>;

/** OpenAI credentials used only when `AI_PROVIDER=openai`. */
export const OpenAiConfigSchema = Schema.Struct({
  OPENAI_API_KEY: NonEmptyString,
  OPENAI_MODEL: Schema.optionalWith(NonEmptyString, {
    default: () => 'gpt-4o-mini' as const,
  }),
});

/** Static type inferred from {@link OpenAiConfigSchema}. */
export type OpenAiConfigType = Schema.Schema.Type<typeof OpenAiConfigSchema>;
