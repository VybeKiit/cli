import { it } from '@effect/vitest';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';
import { completeAi, makeAiLive, resolveAiProvider } from './resolve';

describe('resolveAiProvider', () => {
  it.effect('defaults to the local adapter from Schema config', () =>
    Effect.gen(function* () {
      const ai = yield* resolveAiProvider({});
      expect(ai.name).toBe('local');
    }),
  );

  it.effect('fails loud when openai is selected without an API key', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveAiProvider({ AI_PROVIDER: 'openai' }));
      expect(error.code).toBe('AI_CONFIG_INVALID');
      expect(error.message).toContain('OPENAI_API_KEY');
    }),
  );

  it.effect('rejects unregistered provider keys before adapter lookup', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveAiProvider({ AI_PROVIDER: 'anthropic' }));
      expect(error.code).toBe('AI_CONFIG_INVALID');
      expect(error.message).toContain('AI_PROVIDER');
    }),
  );

  it.effect('constructs the openai adapter from ai-owned config', () =>
    Effect.gen(function* () {
      const ai = yield* resolveAiProvider({
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk_test',
      });
      expect(ai.name).toBe('openai');
    }),
  );

  it.effect('completes locally', () =>
    Effect.gen(function* () {
      const ai = yield* resolveAiProvider({ AI_PROVIDER: 'local' });
      const result = yield* ai.complete({ prompt: 'hello' });
      expect(result.text).toBe('[local-ai] hello');
    }),
  );

  it.effect('completes through the configured Ai Layer', () =>
    Effect.gen(function* () {
      const result = yield* completeAi({ prompt: 'hello' }).pipe(
        Effect.provide(makeAiLive({ AI_PROVIDER: 'local' })),
      );
      expect(result.text).toBe('[local-ai] hello');
    }),
  );
});
