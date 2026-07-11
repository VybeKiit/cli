import {
  buildAssistantUsage,
  DEFAULT_ASSISTANT_CHAT_PORT,
  describePageContext,
  isAssistantChatEnabled,
  parseBridgeEvent,
  resolveAssistantChatPort,
  resolveUpgradeUrl,
  serializeBridgeEvent,
  shouldShowAssistantChat,
} from '@vybekiit/assistant-chat';
import { buildSpawnPlan, mapCliEvent } from '@vybekiit/assistant-chat/node';
import { describe, expect, it } from 'vitest';

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
    expect(line).toContain('route=/pricing');
    expect(line).toContain(`viewport=${1440}x${900}`);
    expect(line).toContain('scrollY=13');
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
    const url = new URL(resolveUpgradeUrl('cursor'));
    expect(url.searchParams.get('code')).toBe(['UVR8', 'G4POWR7J'].join(''));
  });

  it('uses the claude referral path and codex pricing', () => {
    expect(resolveUpgradeUrl('claude')).toBe('https://claude.ai/referral/P5LD5z3EOQ');
    expect(resolveUpgradeUrl('codex')).toBe('https://openai.com/chatgpt/pricing');
  });
});

describe('config', () => {
  it('reads the enable flag (defaults on in development)', () => {
    expect(isAssistantChatEnabled({ VYBE_ASSISTANT_CHAT: '1' })).toBe(true);
    expect(isAssistantChatEnabled({ VYBE_ASSISTANT_CHAT: 'true' })).toBe(true);
    expect(isAssistantChatEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isAssistantChatEnabled({})).toBe(false);
    expect(isAssistantChatEnabled({ NODE_ENV: 'development', VYBE_ASSISTANT_CHAT: '0' })).toBe(
      false,
    );
    expect(isAssistantChatEnabled({ NODE_ENV: 'production', VYBE_ASSISTANT_CHAT: '1' })).toBe(true);
  });

  it('requires local dev host for shouldShowAssistantChat', () => {
    expect(shouldShowAssistantChat({ NODE_ENV: 'development' })).toBe(true);
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

describe('launch commands', () => {
  it('builds interactive new-session commands for terminal agents', async () => {
    const { buildNewSessionCommand, buildResumeCommand } = await import(
      '@vybekiit/assistant-chat/node'
    );
    expect(buildNewSessionCommand('kimi')).toBe('kimi');
    expect(buildNewSessionCommand('kiro', 'hi')).toContain('kiro-cli chat');
    expect(buildNewSessionCommand('claude', 'ship')).toBe("claude 'ship'");
    expect(buildNewSessionCommand('codex')).toBe('codex');
    expect(buildNewSessionCommand('cursor', 'hi')).toBe("cursor agent 'hi'");
    expect(buildNewSessionCommand('grok', 'hi')).toBe("grok 'hi'");
    expect(buildNewSessionCommand('devin', 'hi')).toBe("devin -- 'hi'");
  });

  it('builds resume commands matching each CLI official flag surface', async () => {
    const { buildResumeCommand } = await import('@vybekiit/assistant-chat/node');
    // Verified against live `--help` on installed CLIs (2026-07).
    expect(buildResumeCommand('claude', 'abc')).toBe("claude --resume 'abc'");
    expect(buildResumeCommand('codex', 's1')).toBe("codex resume 's1'");
    expect(buildResumeCommand('cursor', 'c1')).toBe("cursor agent --resume 'c1'");
    expect(buildResumeCommand('kiro', 'k1')).toBe("kiro-cli chat --resume-id 'k1'");
    expect(buildResumeCommand('kimi', 'm1')).toBe("kimi --session 'm1'");
    expect(buildResumeCommand('grok', 'g1')).toBe("grok --resume 'g1'");
    expect(buildResumeCommand('devin', 'd1')).toBe("devin --resume 'd1'");
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

  it('builds a kimi stream-json turn (official -p + --output-format)', () => {
    const plan = buildSpawnPlan('kimi', 'fix the header');
    expect(plan.command).toBe('kimi');
    expect(plan.args).toEqual(['-p', 'fix the header', '--output-format', 'stream-json', '--yolo']);
  });

  it('passes -m to kimi when provided', () => {
    const plan = buildSpawnPlan('kimi', 'fix the header', { model: 'kimi-k2' });
    expect(plan.args).toContain('-m');
    expect(plan.args).toContain('kimi-k2');
  });

  it('resumes a claude session with official --resume in print/stream mode', () => {
    const plan = buildSpawnPlan('claude', 'continue', { agentSessionId: 'sess-abc' });
    expect(plan.args).toContain('--resume');
    expect(plan.args).toContain('sess-abc');
    expect(plan.args).toContain('stream-json');
  });

  it('resumes a kimi session with official --session', () => {
    const plan = buildSpawnPlan('kimi', 'continue', { agentSessionId: 'kimi-1' });
    expect(plan.args).toEqual([
      '-p',
      'continue',
      '--output-format',
      'stream-json',
      '--yolo',
      '--session',
      'kimi-1',
    ]);
  });

  it('resumes a codex session with exec resume --json', () => {
    const plan = buildSpawnPlan('codex', 'continue', {
      agentSessionId: 'thread-1',
      model: 'o4-mini',
    });
    expect(plan.args).toEqual([
      'exec',
      'resume',
      'thread-1',
      '--json',
      '-m',
      'o4-mini',
      'continue',
    ]);
  });

  it('builds a headless grok streaming turn', () => {
    const plan = buildSpawnPlan('grok', 'fix the header');
    expect(plan.command).toBe('grok');
    expect(plan.args).toContain('-p');
    expect(plan.args).toContain('streaming-json');
    expect(plan.args).toContain('--always-approve');
    expect(plan.args).toContain('fix the header');
  });

  it('resumes a grok session with official -r in headless stream mode', () => {
    const plan = buildSpawnPlan('grok', 'continue', {
      agentSessionId: '019f-session',
      model: 'grok-4',
    });
    expect(plan.args).toContain('-r');
    expect(plan.args).toContain('019f-session');
    expect(plan.args).toContain('-m');
    expect(plan.args).toContain('grok-4');
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

  it('maps grok streaming-json text and end events', () => {
    expect(mapCliEvent('grok', { type: 'text', data: 'Hello' })).toEqual({
      type: 'token',
      text: 'Hello',
    });
    expect(mapCliEvent('grok', { type: 'thought', data: 'planning' })).toBeNull();
    expect(mapCliEvent('grok', { type: 'end', stopReason: 'EndTurn' })).toEqual({ type: 'done' });
  });

  it('maps a codex delta to a token', () => {
    expect(mapCliEvent('codex', { type: 'agent_message_delta', delta: 'hi' })).toEqual({
      type: 'token',
      text: 'hi',
    });
  });

  it('maps a kimi assistant content line to a token', () => {
    expect(mapCliEvent('kimi', { role: 'assistant', content: 'ok' })).toEqual({
      type: 'token',
      text: 'ok',
    });
  });

  it('ignores kimi meta resume hints', () => {
    expect(
      mapCliEvent('kimi', {
        role: 'meta',
        type: 'session.resume_hint',
        session_id: 'session_1',
      }),
    ).toBeNull();
  });

  it('maps kimi tool_calls to tool_call events', () => {
    expect(
      mapCliEvent('kimi', {
        role: 'assistant',
        tool_calls: [{ function: { name: 'bash' } }],
      }),
    ).toEqual({ type: 'tool_call', name: 'bash', detail: undefined });
  });

  it('ignores unknown lines', () => {
    expect(mapCliEvent('claude', { type: 'system' })).toBeNull();
    expect(mapCliEvent('codex', 'not-an-object')).toBeNull();
    expect(mapCliEvent('kimi', { role: 'system' })).toBeNull();
  });
});
