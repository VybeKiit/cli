import type { OpenAiConfigType } from '@vybekiit/ai/config';
import { createSingleChunkStream } from '@vybekiit/ai/singleChunkStream';
import type { AiProvider, CompleteParamsType, CompleteResultType } from '@vybekiit/ai/types';
import { AiError } from '@vybekiit/ai/types';
import { decodeOpenAiChatCompletionResponse } from '@vybekiit/core/http';
import { Effect } from 'effect';

const openAiChatCompletionsUrl = 'https://api.openai.com/v1/chat/completions';
const defaultMaxTokens = 512;

const toOpenAiErrorMessage = (caught: unknown): string =>
  caught instanceof Error ? caught.message : String(caught);

const createRequestError = (message: string): AiError =>
  new AiError({ code: 'AI_REQUEST_FAILED', message });

const createInvalidResponseError = (message: string): AiError =>
  new AiError({ code: 'AI_RESPONSE_INVALID', message });

const buildMessages = (params: CompleteParamsType) => {
  const userMessage = { role: 'user', content: params.prompt } as const;

  if (params.system === undefined) {
    return [userMessage];
  }

  return [{ role: 'system', content: params.system }, userMessage];
};

const resolveMaxTokens = (params: CompleteParamsType): number => {
  if (params.maxTokens === undefined) {
    return defaultMaxTokens;
  }

  return params.maxTokens;
};

const requestOpenAiCompletion = (
  config: OpenAiConfigType,
  params: CompleteParamsType,
): Effect.Effect<Response, AiError> =>
  Effect.tryPromise({
    try: () =>
      fetch(openAiChatCompletionsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.OPENAI_MODEL,
          messages: buildMessages(params),
          max_tokens: resolveMaxTokens(params),
        }),
      }),
    catch: (caught) => createRequestError(toOpenAiErrorMessage(caught)),
  });

const readOpenAiJson = (response: Response): Effect.Effect<unknown, AiError> => {
  if (!response.ok) {
    return Effect.fail(createRequestError(`OpenAI returned ${response.status}`));
  }

  return Effect.tryPromise({
    try: async (): Promise<unknown> => response.json(),
    catch: (caught) => createInvalidResponseError(toOpenAiErrorMessage(caught)),
  });
};

const decodeCompletionResult = (body: unknown): Effect.Effect<CompleteResultType, AiError> => {
  const decoded = decodeOpenAiChatCompletionResponse(body);

  if (decoded === null) {
    return Effect.fail(
      createInvalidResponseError('OpenAI returned an invalid completion payload.'),
    );
  }

  const { choices } = decoded;

  if (choices === undefined) {
    return Effect.fail(createInvalidResponseError('OpenAI returned no completion choices.'));
  }

  const [firstChoice] = choices;

  if (firstChoice === undefined) {
    return Effect.fail(
      createInvalidResponseError('OpenAI returned an empty completion choices list.'),
    );
  }

  const { message } = firstChoice;

  if (message === undefined) {
    return Effect.fail(
      createInvalidResponseError('OpenAI returned a completion without a message.'),
    );
  }

  const { content } = message;

  if (content === undefined || content.length === 0) {
    return Effect.fail(createInvalidResponseError('OpenAI returned a completion without text.'));
  }

  return Effect.succeed({ text: content });
};

/**
 * Build the OpenAI-backed AI adapter from validated OpenAI config.
 *
 * @param config - OpenAI credentials decoded from {@link OpenAiConfigSchema}.
 * @returns An AiProvider whose methods fail with AiError for upstream request or response failures.
 * @example
 * const provider = createOpenAiProvider({ OPENAI_API_KEY: 'sk_test', OPENAI_MODEL: 'gpt-4o-mini' });
 */
export const createOpenAiProvider = (config: OpenAiConfigType): AiProvider => ({
  name: 'openai',
  complete: (params) =>
    requestOpenAiCompletion(config, params).pipe(
      Effect.flatMap(readOpenAiJson),
      Effect.flatMap(decodeCompletionResult),
    ),
  stream: (params) =>
    createOpenAiProvider(config)
      .complete(params)
      .pipe(Effect.map((result) => createSingleChunkStream(result.text))),
  verifyDelivery: () => Effect.succeed(true),
});
