import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import { Context, Effect, Layer, type Schema } from 'effect';
import {
  AiConfigSchema,
  type AiConfigType,
  type AiProviderNameType,
  OpenAiConfigSchema,
} from './config';
import { createLocalAi } from './providers/local';
import { createOpenAiProvider } from './providers/openai';
import {
  AiError,
  type AiProvider,
  type AiService,
  type CompleteParamsType,
  type CompleteResultType,
} from './types';

/** Injectable AI service tag used by composition roots and tests. */
export class Ai extends Context.Tag('@vybekiit/ai/Ai')<Ai, AiService>() {}

type AiProviderFactory = (source: EnvSource) => Effect.Effect<AiProvider, AiError>;

const aiProviderFactories = {
  local: () => Effect.succeed(createLocalAi()),
  openai: (source) =>
    parseAiConfigSlice(OpenAiConfigSchema, source).pipe(
      Effect.map((config) => createOpenAiProvider(config)),
    ),
} satisfies Partial<Record<AiProviderNameType, AiProviderFactory>>;

const aiErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const parseAiConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, AiError> =>
  Effect.try({
    try: () => parseEnv(schema, source),
    catch: (caught) =>
      new AiError({
        code: 'AI_CONFIG_INVALID',
        message: aiErrorMessage(caught),
      }),
  });

const findAiProviderFactory = (
  provider: AiProviderNameType,
): Effect.Effect<AiProviderFactory, AiError> => {
  const createProvider = aiProviderFactories[provider];

  if (createProvider === undefined) {
    return Effect.fail(
      new AiError({
        code: 'AI_PROVIDER_UNSUPPORTED',
        message: `No AI adapter is registered for provider ${provider}.`,
      }),
    );
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured AI provider from environment config.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @returns An Effect that succeeds with the selected AI provider or fails with AiError.
 * @example
 * const provider = await Effect.runPromise(resolveAiProvider({ AI_PROVIDER: 'local' }));
 */
export const resolveAiProvider = (
  source: EnvSource = process.env,
): Effect.Effect<AiProvider, AiError> =>
  parseAiConfigSlice(AiConfigSchema, source).pipe(
    Effect.flatMap(({ AI_PROVIDER }: AiConfigType) =>
      findAiProviderFactory(AI_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source)),
      ),
    ),
  );

/**
 * Build the configured AI Layer from environment config.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @returns A Layer that provides Ai or fails with AiError during construction.
 * @example
 * const result = await Effect.runPromise(completeAi(params).pipe(Effect.provide(makeAiLive())));
 */
export const makeAiLive = (source: EnvSource = process.env): Layer.Layer<Ai, AiError> =>
  Layer.effect(Ai, resolveAiProvider(source));

/**
 * Complete one prompt through the injected AI service.
 *
 * @param params - Validated completion parameters for the prompt.
 * @returns An Effect that succeeds with completion text or fails with AiError.
 * @example
 * const result = await Effect.runPromise(completeAi({ prompt: 'Say hello' }).pipe(Effect.provide(makeAiLive())));
 */
export const completeAi = (
  params: CompleteParamsType,
): Effect.Effect<CompleteResultType, AiError, Ai> =>
  Effect.flatMap(Ai, ({ complete }) => complete(params));

/**
 * Stream one prompt through the injected AI service.
 *
 * @param params - Validated completion parameters for the prompt.
 * @returns An Effect that succeeds with an async text stream or fails with AiError.
 * @example
 * const stream = await Effect.runPromise(streamAi({ prompt: 'Say hello' }).pipe(Effect.provide(makeAiLive())));
 */
export const streamAi = (
  params: CompleteParamsType,
): Effect.Effect<AsyncIterable<string>, AiError, Ai> =>
  Effect.flatMap(Ai, ({ stream }) => stream(params));

/**
 * Verify the injected AI service can be used by the current app.
 *
 * @returns An Effect that succeeds with true or fails with AiError.
 * @example
 * const ok = await Effect.runPromise(verifyAiDelivery().pipe(Effect.provide(makeAiLive())));
 */
export const verifyAiDelivery = (): Effect.Effect<true, AiError, Ai> =>
  Effect.flatMap(Ai, ({ verifyDelivery }) => verifyDelivery());
