import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExecResult } from '../global/exec';
import { checkAccess, formatGateFailure } from './gate';

const original = process.env.VYBEKIIT_SKIP_GATE;
afterEach(() => {
  if (original === undefined) {
    delete process.env.VYBEKIIT_SKIP_GATE;
  } else {
    process.env.VYBEKIIT_SKIP_GATE = original;
  }
});

const exitWith = (code: number, stdout = ''): ExecResult => ({ code, stdout, stderr: '' });

const fakeGh = (replies: Readonly<Record<string, ExecResult>>) =>
  vi.fn(async (ghArguments: readonly string[]) => {
    const ghCommand = ghArguments.join(' ');
    const matchingReply = Object.entries(replies).find(([prefix]) => ghCommand.startsWith(prefix));
    return matchingReply === undefined ? exitWith(1) : matchingReply[1];
  });

describe('checkAccess', () => {
  it('bypasses the gate when VYBEKIIT_SKIP_GATE=1', async () => {
    process.env.VYBEKIIT_SKIP_GATE = '1';
    const gateDecision = await checkAccess();
    expect(gateDecision.allowed).toBe(true);
    expect(gateDecision.reason).toBe('skipped');
  });

  it('reports a missing gh', async () => {
    delete process.env.VYBEKIIT_SKIP_GATE;
    const gh = fakeGh({ '--version': exitWith(127) });
    const gateDecision = await checkAccess(gh);
    expect(gateDecision.reason).toBe('gh-missing');
  });

  it('reports a signed-out gh', async () => {
    delete process.env.VYBEKIIT_SKIP_GATE;
    const gh = fakeGh({ '--version': exitWith(0) });
    const gateDecision = await checkAccess(gh);
    expect(gateDecision.reason).toBe('gh-unauthed');
  });

  it('accepts a pending invite before it checks repo access', async () => {
    delete process.env.VYBEKIIT_SKIP_GATE;
    const gh = fakeGh({
      '--version': exitWith(0),
      'auth status': exitWith(0),
      'api user/repository_invitations --paginate': exitWith(0, '42\n'),
      'api -X PATCH user/repository_invitations/42': exitWith(0),
      'api repos/VybeKiit/kit': exitWith(0),
    });
    const gateDecision = await checkAccess(gh);
    expect(gateDecision).toEqual({ allowed: true, reason: 'ok', org: 'VybeKiit' });
    expect(gh).toHaveBeenCalledWith([
      'api',
      '-X',
      'PATCH',
      'user/repository_invitations/42',
      '--silent',
    ]);
  });

  it('blocks a signed-in account with no invite and no access', async () => {
    delete process.env.VYBEKIIT_SKIP_GATE;
    const gh = fakeGh({
      '--version': exitWith(0),
      'auth status': exitWith(0),
      'api user/repository_invitations --paginate': exitWith(0),
    });
    const gateDecision = await checkAccess(gh);
    expect(gateDecision.reason).toBe('no-access');
  });
});

describe('formatGateFailure', () => {
  it('points a missing gh at setup', () => {
    const message = formatGateFailure({ allowed: false, reason: 'gh-missing', org: 'VybeKiit' });
    expect(message).toContain('npx vybekiit setup');
  });

  it('tells an unauthed user to sign in with the web flow', () => {
    const message = formatGateFailure({ allowed: false, reason: 'gh-unauthed', org: 'VybeKiit' });
    expect(message).toContain('gh auth login');
    expect(message).toContain('--web');
  });

  it('never tells a buyer without access to buy again', () => {
    const message = formatGateFailure({ allowed: false, reason: 'no-access', org: 'VybeKiit' });
    expect(message).toContain('Check your email');
    expect(message).toContain('info@vybekiit.com');
    expect(message).not.toMatch(/purchase|buy/i);
  });
});
