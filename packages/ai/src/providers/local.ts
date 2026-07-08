import { createSingleChunkStream } from '@vybekiit/ai/singleChunkStream';
import type { AiProvider, CompleteParamsType } from '@vybekiit/ai/types';
import { Effect } from 'effect';

const localPromptPreviewLength = 200;

const formatLocalCompletion = (params: CompleteParamsType): string =>
  `[local-ai] ${params.prompt.slice(0, localPromptPreviewLength)}`;

/**
 * Build the local AI adapter for offline scaffolds and tests.
 *
 * @returns A local AiProvider whose methods return successful Effects.
 * @example
 * const text = await Effect.runPromise(createLocalAi().complete({ prompt: 'hello' }));
 */
export const createLocalAi = (): AiProvider => ({
  name: 'local',
  complete: (params) => Effect.succeed({ text: formatLocalCompletion(params) }),
  stream: (params) => Effect.succeed(createSingleChunkStream(formatLocalCompletion(params))),
  verifyDelivery: () => Effect.succeed(true),
});
