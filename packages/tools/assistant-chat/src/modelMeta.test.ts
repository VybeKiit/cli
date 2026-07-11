import {
  formatContextTokens,
  formatUsdPerMTok,
  resolveModelCostMeta,
} from '@vybekiit/assistant-chat';
import { describe, expect, it } from 'vitest';

describe('resolveModelCostMeta', () => {
  it('resolves Claude Code aliases to current Anthropic rates', () => {
    expect(resolveModelCostMeta('claude', 'sonnet')).toMatchObject({
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 10,
      contextTokens: 1_000_000,
    });
    expect(resolveModelCostMeta('claude', 'opus')).toMatchObject({
      inputPerMTokUsd: 5,
      outputPerMTokUsd: 25,
      contextTokens: 1_000_000,
    });
    expect(resolveModelCostMeta('claude', 'haiku')).toMatchObject({
      inputPerMTokUsd: 1,
      outputPerMTokUsd: 5,
      contextTokens: 200_000,
    });
  });

  it('resolves live Anthropic model ids', () => {
    expect(resolveModelCostMeta('claude', 'claude-sonnet-4-6')).toMatchObject({
      inputPerMTokUsd: 3,
      outputPerMTokUsd: 15,
      contextTokens: 1_000_000,
    });
    expect(resolveModelCostMeta('claude', 'claude-sonnet-5')).toMatchObject({
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 10,
    });
    expect(resolveModelCostMeta('claude', 'claude-opus-4-8-20260528')).toMatchObject({
      inputPerMTokUsd: 5,
      outputPerMTokUsd: 25,
    });
  });

  it('resolves Codex / OpenAI model ids', () => {
    expect(resolveModelCostMeta('codex', 'gpt-4.1')).toMatchObject({
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 8,
      contextTokens: 1_000_000,
    });
    expect(resolveModelCostMeta('codex', 'o3')).toMatchObject({
      inputPerMTokUsd: 2,
      outputPerMTokUsd: 8,
      contextTokens: 200_000,
    });
    expect(resolveModelCostMeta('codex', 'o4-mini')).toMatchObject({
      inputPerMTokUsd: 1.1,
      outputPerMTokUsd: 4.4,
      contextTokens: 200_000,
    });
  });

  it('returns null for agents without public token pricing', () => {
    expect(resolveModelCostMeta('cursor', 'auto')).toBeNull();
    expect(resolveModelCostMeta('grok', 'grok-4')).toBeNull();
  });
});

describe('format helpers', () => {
  it('formats money and context compactly', () => {
    expect(formatUsdPerMTok(3)).toBe('$3');
    expect(formatUsdPerMTok(1.1)).toBe('$1.10');
    expect(formatContextTokens(1_000_000)).toBe('1M');
    expect(formatContextTokens(200_000)).toBe('200K');
  });
});
