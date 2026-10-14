import { describe, expect, it, vi } from 'vitest';
import {
  checkEntitlement,
  type EntitlementResult,
  formatEntitlementBlock,
} from '../../src/global/entitlement';
import type { ExecResult } from '../../src/global/exec';

const ok: ExecResult = { code: 0, stdout: '', stderr: '' };
const fail: ExecResult = { code: 1, stdout: '', stderr: '' };

describe('checkEntitlement', () => {
  it('blocks when gh is not installed', async () => {
    const result = await checkEntitlement({
      exec: async () => ({ code: 127, stdout: '', stderr: 'gh not found' }),
    });
    expect(result).toMatchObject({ entitled: false, reason: 'gh-missing' });
  });

  it('blocks when gh is not signed in', async () => {
    const result = await checkEntitlement({
      exec: async (args) => (args[0] === '--version' ? ok : fail),
    });
    expect(result).toMatchObject({ entitled: false, reason: 'not-authenticated' });
  });

  it('allows a buyer who can read a private surface mirror', async () => {
    const result = await checkEntitlement({
      exec: async (args) => {
        if (args[0] === '--version') return ok;
        if (args[1] === 'user') return { code: 0, stdout: 'octocat\n', stderr: '' };
        return ok; // repo probe succeeds
      },
    });
    expect(result).toMatchObject({ entitled: true, reason: 'entitled', login: 'octocat' });
    expect(result.via).toBe('VybeKiit/kit');
  });

  it('accepts a pending VybeKiit invite before it probes the repos', async () => {
    const exec = vi.fn(async (args: readonly string[]): Promise<ExecResult> => {
      if (args[1] === 'user') return { code: 0, stdout: 'octocat', stderr: '' };
      if (args[1] === 'user/repository_invitations') return { code: 0, stdout: '7\n', stderr: '' };
      return ok;
    });
    await checkEntitlement({ exec });
    const calledArguments = exec.mock.calls.map(([args]) => args.join(' '));
    const acceptIndex = calledArguments.indexOf(
      'api -X PATCH user/repository_invitations/7 --silent',
    );
    const firstRepoProbe = calledArguments.findIndex((ghCommand) =>
      ghCommand.startsWith('api repos/'),
    );
    expect(acceptIndex).toBeGreaterThan(-1);
    expect(acceptIndex).toBeLessThan(firstRepoProbe);
  });

  it('short-circuits on the first readable mirror instead of probing all surfaces', async () => {
    const exec = vi.fn(async (args: readonly string[]): Promise<ExecResult> => {
      if (args[0] === '--version') return ok;
      if (args[1] === 'user') return { code: 0, stdout: 'octocat', stderr: '' };
      return ok;
    });
    await checkEntitlement({ exec });
    const repoProbes = exec.mock.calls.filter((call) => call[0][1]?.startsWith('repos/'));
    expect(repoProbes).toHaveLength(1);
  });

  it('blocks a signed-in non-buyer with no mirror access', async () => {
    const result = await checkEntitlement({
      exec: async (args) => {
        if (args[0] === '--version') return ok;
        if (args[1] === 'user') return { code: 0, stdout: 'stranger', stderr: '' };
        return fail; // every repo probe 404s
      },
    });
    expect(result).toMatchObject({ entitled: false, reason: 'no-access', login: 'stranger' });
  });
});

describe('formatEntitlementBlock', () => {
  it('sends a signed-in account without access to its email and support, never to buy again', () => {
    const text = formatEntitlementBlock({
      entitled: false,
      reason: 'no-access',
      login: 'stranger',
    } satisfies EntitlementResult).join('\n');
    expect(text).toContain('Signed in to GitHub as stranger.');
    expect(text).toContain('Check your email');
    expect(text).toContain('info@vybekiit.com');
    expect(text).not.toMatch(/purchase|buy/i);
  });

  it('tells a signed-out user to run gh auth login', () => {
    const text = formatEntitlementBlock({ entitled: false, reason: 'not-authenticated' }).join(
      '\n',
    );
    expect(text).toContain('gh auth login');
  });

  it('tells a user without gh to run setup', () => {
    const text = formatEntitlementBlock({ entitled: false, reason: 'gh-missing' }).join('\n');
    expect(text).toContain('npx vybekiit setup');
  });
});
