import { resolveAiProvider } from '@vybekiit/ai/resolve';
import { describe, expect, it } from 'vitest';

describe('resolveAiProvider', () => {
  it('uses local when openai key missing', () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'openai' });
    expect(ai.name).toBe('local');
  });

  it('falls back to local for unshipped anthropic provider', () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'anthropic' });
    expect(ai.name).toBe('local');
  });

  it('falls back to local for unshipped openrouter provider', () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'openrouter' });
    expect(ai.name).toBe('local');
  });

  it('completes locally', async () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'local' });
    const result = await ai.complete({ prompt: 'hello' });
    expect(result.ok).toBe(true);
  });
});
