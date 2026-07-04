import { describe, expect, it } from 'vitest';

import {
  CLAUDE_FALLBACK_MODELS,
  CODEX_FALLBACK_MODELS,
  parseAnthropicModels,
  parseCodexConfigModel,
  parseOpenAiModels,
} from '../src/node/models/index';

describe('parseAnthropicModels', () => {
  it('maps live API payload to model options', () => {
    const models = parseAnthropicModels({
      data: [
        { id: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4' },
        { id: 'claude-opus-4-20250514' },
      ],
    });
    expect(models).toEqual([
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514' },
    ]);
  });

  it('falls back when payload is invalid', () => {
    expect(parseAnthropicModels(null)).toEqual(CLAUDE_FALLBACK_MODELS);
    expect(parseAnthropicModels({ data: [] })).toEqual(CLAUDE_FALLBACK_MODELS);
  });
});

describe('parseOpenAiModels', () => {
  it('keeps gpt and o-series ids from live payload', () => {
    const models = parseOpenAiModels({
      data: [{ id: 'gpt-4.1' }, { id: 'o3' }, { id: 'text-embedding-3-small' }, { id: 'dall-e-3' }],
    });
    expect(models).toEqual([{ id: 'gpt-4.1' }, { id: 'o3' }]);
  });

  it('falls back when payload is invalid', () => {
    expect(parseOpenAiModels(undefined)).toEqual(CODEX_FALLBACK_MODELS);
  });
});

describe('parseCodexConfigModel', () => {
  it('reads model from config.toml', () => {
    const toml = `
[profile]
model = "o4-mini"
`;
    expect(parseCodexConfigModel(toml)).toBe('o4-mini');
  });

  it('returns undefined when model is missing', () => {
    expect(parseCodexConfigModel('[profile]\nname = "dev"')).toBeUndefined();
  });
});
