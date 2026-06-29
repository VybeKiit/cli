import { describe, expect, it } from 'vitest';
import { resolveAiProvider } from '../src/resolve';

describe('resolveAiProvider', () => {
  it('uses local when openai key missing', () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'openai' });
    expect(ai.name).toBe('local');
  });

  it('completes locally', async () => {
    const ai = resolveAiProvider({ AI_PROVIDER: 'local' });
    const result = await ai.complete({ prompt: 'hello' });
    expect(result.ok).toBe(true);
  });
});
