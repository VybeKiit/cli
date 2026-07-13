import { describe, expect, it } from 'vitest';
import { classifyDataHopSignal, shouldContinueLadder } from './hopSignals';

describe('classifyDataHopSignal', () => {
  it('classifies quota / free-tier allowlist', () => {
    expect(classifyDataHopSignal('quota_exceeded', 'Free tier project limit')).toBe('quota');
    expect(classifyDataHopSignal('x', 'rate limit exceeded')).toBe('quota');
    expect(classifyDataHopSignal('quota', 'done')).toBe('quota');
  });

  it('classifies onboarding-blocked allowlist', () => {
    expect(classifyDataHopSignal('onboarding_blocked', 'finish setup')).toBe('onboarding_blocked');
    expect(classifyDataHopSignal('x', 'verify your email to continue')).toBe('onboarding_blocked');
  });

  it('classifies missing credentials as skip', () => {
    expect(classifyDataHopSignal('missing_credentials', 'no keys')).toBe('missing_credentials');
    expect(classifyDataHopSignal('x', 'not configured')).toBe('missing_credentials');
  });

  it('hard-stops unknown network / auth failures (no hop)', () => {
    expect(classifyDataHopSignal('db_unreachable', 'ECONNREFUSED')).toBe('hard_stop');
    expect(classifyDataHopSignal('forbidden', 'HTTP 403')).toBe('hard_stop');
    expect(classifyDataHopSignal('server_error', 'HTTP 500')).toBe('hard_stop');
    expect(classifyDataHopSignal('invalid_key', 'wrong password')).toBe('hard_stop');
  });
});

describe('shouldContinueLadder', () => {
  it('continues only for hop/skip classes', () => {
    expect(shouldContinueLadder('quota')).toBe(true);
    expect(shouldContinueLadder('onboarding_blocked')).toBe(true);
    expect(shouldContinueLadder('missing_credentials')).toBe(true);
    expect(shouldContinueLadder('hard_stop')).toBe(false);
  });
});
