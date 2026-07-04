import { describe, expect, it } from 'vitest';
import { resolveUpgradeUrl } from '../src/affiliate';
import {
  DEFAULT_ASSISTANT_CHAT_PORT,
  isAssistantChatEnabled,
  resolveAssistantChatPort,
  shouldShowAssistantChat,
} from '../src/config';
import { describePageContext } from '../src/context';
import { buildSpawnPlan, mapCliEvent } from '../src/node/adapters';
import { parseBridgeEvent, serializeBridgeEvent } from '../src/protocol';
import { buildAssistantUsage } from '../src/usage';

describe('protocol', () => {
  it('round-trips a token event', () => {
    const wire = serializeBridgeEvent({ type: 'token', text: 'hi' });
    expect(parseBridgeEvent(wire)).toEqual({ type: 'token', text: 'hi' });
  });

  it('round-trips a done event with exit code', () => {
    const wire = serializeBridgeEvent({ type: 'done', exitCode: 0 });
    expect(parseBridgeEvent(wire)).toEqual({ type: 'done', exitCode: 0 });
  });
});

describe('page context', () => {
  it('renders a one-line prompt prefix', () => {
    const line = describePageContext({
      route: '/pricing',
      viewportWidth: 1440,
      viewportHeight: 900,
      scrollY: 12.7,
    });
    expect(line).toBe('[page] route=/pricing viewport=1440x900 scrollY=13');
  });
});

describe('usage contract', () => {
  it('is unavailable with no observed numbers', () => {
    const usage = buildAssistantUsage('claude');
    expect(usage.available).toBe(false);
    expect(usage.window).toBe('5h');
    expect(usage.used).toBeUndefined();
  });

  it('is available only when both used and limit are observed', () => {
    expect(buildAssistantUsage('codex', { used: 3 }).available).toBe(false);
    const full = buildAssistantUsage('codex', { used: 3, limit: 10, plan: 'Plus' });
    expect(full.available).toBe(true);
    expect(full.plan).toBe('Plus');
  });
});

describe('affiliate', () => {
  it('uses the cursor referral code, overridable', () => {
    expect(resolveUpgradeUrl('cursor', 'ABC')).toBe('https://cursor.com/referral?code=ABC');
    expect(resolveUpgradeUrl('cursor')).toBe('https://cursor.com/referral?code=UVR8G4POWR7J');
  });

  it('uses the claude referral path and codex pricing', () => {
    expect(resolveUpgradeUrl('claude')).toBe('https://claude.ai/referral/P5LD5z3EOQ');
    expect(resolveUpgradeUrl('codex')).toBe('https://openai.com/chatgpt/pricing');
  });
});

describe('config', () => {
  it('reads the enable flag', () => {
    expect(isAssistantChatEnabled({ VYBE_ASSISTANT_CHAT: '1' })).toBe(true);
    expect(isAssistantChatEnabled({ VYBE_ASSISTANT_CHAT: 'true' })).toBe(true);
    expect(isAssistantChatEnabled({})).toBe(false);
  });

  it('requires local dev host for shouldShowAssistantChat', () => {
    expect(shouldShowAssistantChat({ NODE_ENV: 'development', VYBE_ASSISTANT_CHAT: '1' })).toBe(
      true,
    );
    expect(shouldShowAssistantChat({ NODE_ENV: 'production', VYBE_ASSISTANT_CHAT: '1' })).toBe(
      false,
    );
  });

  it('falls back to the default port on bad input', () => {
    expect(resolveAssistantChatPort({ NEXT_PUBLIC_VYBE_ASSISTANT_CHAT_PORT: '5000' })).toBe(5000);
    expect(resolveAssistantChatPort({})).toBe(DEFAULT_ASSISTANT_CHAT_PORT);
    expect(resolveAssistantChatPort({ NEXT_PUBLIC_VYBE_ASSISTANT_CHAT_PORT: 'nope' })).toBe(
      DEFAULT_ASSISTANT_CHAT_PORT,
    );
  });
});

describe('spawn plan', () => {
  it('builds a streaming claude turn', () => {
    const plan = buildSpawnPlan('claude', 'fix the header');
    expect(plan.command).toBe('claude');
    expect(plan.args).toContain('--output-format');
    expect(plan.args).toContain('stream-json');
    expect(plan.args).toContain('fix the header');
  });

  it('passes --model to claude when provided', () => {
    const plan = buildSpawnPlan('claude', 'fix the header', { model: 'sonnet' });
    expect(plan.args).toContain('--model');
    expect(plan.args).toContain('sonnet');
  });

  it('builds a json codex turn', () => {
    const plan = buildSpawnPlan('codex', 'fix the header');
    expect(plan.command).toBe('codex');
    expect(plan.args).toEqual(['exec', '--json', 'fix the header']);
  });

  it('passes -m to codex when provided', () => {
    const plan = buildSpawnPlan('codex', 'fix the header', { model: 'o4-mini' });
    expect(plan.args).toEqual(['exec', '--json', '-m', 'o4-mini', 'fix the header']);
  });
});

describe('cli event mapping', () => {
  it('maps a claude assistant text block to a token', () => {
    const event = mapCliEvent('claude', {
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'hello' }] },
    });
    expect(event).toEqual({ type: 'token', text: 'hello' });
  });

  it('maps a claude result to done', () => {
    expect(mapCliEvent('claude', { type: 'result' })).toEqual({ type: 'done' });
  });

  it('maps a codex delta to a token', () => {
    expect(mapCliEvent('codex', { type: 'agent_message_delta', delta: 'hi' })).toEqual({
      type: 'token',
      text: 'hi',
    });
  });

  it('ignores unknown lines', () => {
    expect(mapCliEvent('claude', { type: 'system' })).toBeNull();
    expect(mapCliEvent('codex', 'not-an-object')).toBeNull();
  });
});
