import { afterEach, describe, expect, it } from 'vitest';
import { checkAccess, formatGateFailure } from './gate';

const original = process.env.VYBEKIIT_SKIP_GATE;
afterEach(() => {
  if (original === undefined) {
    delete process.env.VYBEKIIT_SKIP_GATE;
  } else {
    process.env.VYBEKIIT_SKIP_GATE = original;
  }
});

describe('checkAccess', () => {
  it('bypasses the gate when VYBEKIIT_SKIP_GATE=1', () => {
    process.env.VYBEKIIT_SKIP_GATE = '1';
    const gateDecision = checkAccess();
    expect(gateDecision.allowed).toBe(true);
    expect(gateDecision.reason).toBe('skipped');
  });
});

describe('formatGateFailure', () => {
  it('points a missing gh at doctor', () => {
    const message = formatGateFailure({ allowed: false, reason: 'gh-missing', org: 'VybeKiit' });
    expect(message).toContain('vybekiit doctor');
  });

  it('tells an unauthed user to sign in', () => {
    const message = formatGateFailure({ allowed: false, reason: 'gh-unauthed', org: 'VybeKiit' });
    expect(message).toContain('gh auth login');
  });

  it('sends an ungated buyer to purchase', () => {
    const message = formatGateFailure({ allowed: false, reason: 'no-access', org: 'VybeKiit' });
    expect(message).toContain('purchase');
  });
});
