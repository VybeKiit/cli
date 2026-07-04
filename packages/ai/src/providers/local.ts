import type { AiProvider, CompleteParams, CompleteResult } from '@vybekiit/ai/types';
import { ok, type Result } from '@vybekiit/core';

export function createLocalAi(): AiProvider {
  return {
    name: 'local',
    async complete(params: CompleteParams): Promise<Result<CompleteResult>> {
      return ok({ text: `[local-ai] ${params.prompt.slice(0, 200)}` });
    },
    async stream(params: CompleteParams): Promise<Result<AsyncIterable<string>>> {
      async function* gen(): AsyncIterable<string> {
        yield `[local-ai] ${params.prompt.slice(0, 200)}`;
      }
      return ok(gen());
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
