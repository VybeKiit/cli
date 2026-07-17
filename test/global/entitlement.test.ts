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
    expect(result.via).toBe('VybeKiit/web');
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
  it('points a signed-in non-buyer at the purchase page and names the account', () => {
    const text = formatEntitlementBlock({
      entitled: false,
      reason: 'no-access',
      login: 'stranger',
    } satisfies EntitlementResult).join('\n');
    expect(text).toContain('https://vybekiit.com');
    expect(text).toContain("'stranger'");
  });

  it('tells a signed-out user to run gh auth login', () => {
    const text = formatEntitlementBlock({ entitled: false, reason: 'not-authenticated' }).join(
      '\n',
    );
    expect(text).toContain('gh auth login');
  });

  it('tells a user without gh where to install it', () => {
    const text = formatEntitlementBlock({ entitled: false, reason: 'gh-missing' }).join('\n');
    expect(text).toContain('cli.github.com');
  });
});
