import { describe, expect, it } from 'vitest';
import { AGENT_IDS, buildNewSessionCommand, buildResumeCommand, isAgentId } from './registry';

describe('agent registry', () => {
  it('lists every supported agent id', () => {
    expect(AGENT_IDS).toContain('claude-code');
    expect(AGENT_IDS).toContain('codex');
    expect(AGENT_IDS).toContain('cursor');
    expect(AGENT_IDS).toContain('kiro');
    expect(AGENT_IDS).toContain('kimi');
    expect(AGENT_IDS).toContain('grok');
    expect(AGENT_IDS).toContain('devin');
  });

  it('builds new-session commands per agent', () => {
    expect(buildNewSessionCommand('claude-code', 'hi')).toContain('claude');
    expect(buildNewSessionCommand('codex', 'hi')).toContain('codex');
    expect(buildNewSessionCommand('kiro', 'hi')).toContain('kiro-cli chat');
    expect(buildNewSessionCommand('cursor', 'hi')).toContain('cursor agent');
    expect(buildNewSessionCommand('kimi', 'hi')).toBe('kimi');
    expect(buildNewSessionCommand('grok', 'fix it')).toContain('grok');
    expect(buildNewSessionCommand('devin', 'ship')).toContain('devin --');
  });

  it('builds resume commands with the session id', () => {
    expect(buildResumeCommand('claude-code', 'abc')).toContain('--resume');
    expect(buildResumeCommand('codex', 'abc')).toContain('resume');
    expect(buildResumeCommand('kiro', 'abc')).toContain('--resume-id');
    expect(buildResumeCommand('kimi', 'session_1')).toContain('--session');
    expect(buildResumeCommand('grok', 'abc')).toContain('--resume');
    expect(buildResumeCommand('devin', 'abc')).toContain('--resume');
    expect(buildResumeCommand('cursor', 'abc')).toContain('--resume');
  });

  it('narrows agent ids', () => {
    expect(isAgentId('claude-code')).toBe(true);
    expect(isAgentId('not-an-agent')).toBe(false);
  });
});
