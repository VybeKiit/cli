import type { Result } from '@vybekiit/core';

export type AiProviderName = 'openai' | 'anthropic' | 'openrouter' | 'local';

export interface CompleteParams {
  readonly prompt: string;
  readonly system?: string | undefined;
  readonly maxTokens?: number | undefined;
}

export interface CompleteResult {
  readonly text: string;
}

export interface AiProvider {
  readonly name: AiProviderName;
  complete(params: CompleteParams): Promise<Result<CompleteResult>>;
  stream(params: CompleteParams): Promise<Result<AsyncIterable<string>>>;
  verifyDelivery(): Promise<Result<true>>;
}
