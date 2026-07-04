import type { AiProvider, CompleteParams, CompleteResult } from '@vybekiit/ai/types';
import { fail, type OpenaiConfig, ok, type Result } from '@vybekiit/core';
import { decodeOpenAiChatCompletionResponse } from '@vybekiit/core/http';

export function createOpenAiProvider(config: OpenaiConfig): AiProvider {
  return {
    name: 'openai',
    async complete(params: CompleteParams): Promise<Result<CompleteResult>> {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.OPENAI_MODEL,
          messages: [
            ...(params.system ? [{ role: 'system', content: params.system }] : []),
            { role: 'user', content: params.prompt },
          ],
          max_tokens: params.maxTokens ?? 512,
        }),
      });
      if (!res.ok) {
        return fail('ai_failed', `OpenAI returned ${res.status}`);
      }
      const json = decodeOpenAiChatCompletionResponse(await res.json());
      const text = json?.choices?.[0]?.message?.content ?? '';
      return ok({ text });
    },
    async stream(params: CompleteParams): Promise<Result<AsyncIterable<string>>> {
      const completed = await createOpenAiProvider(config).complete(params);
      if (!completed.ok) return completed;
      const text = completed.value.text;
      async function* gen(): AsyncIterable<string> {
        yield text;
      }
      return ok(gen());
    },
    async verifyDelivery() {
      return ok(true);
    },
  };
}
