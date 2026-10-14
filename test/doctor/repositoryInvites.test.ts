import { describe, expect, it, vi } from 'vitest';
import { acceptRepositoryInvites } from '../../src/doctor/repositoryInvites';
import type { ExecResult } from '../../src/global/exec';

const exitWith = (code: number, stdout = ''): ExecResult => ({ code, stdout, stderr: '' });

describe('acceptRepositoryInvites', () => {
  it('accepts every pending invite from the org', async () => {
    const gh = vi.fn(async (ghArguments: readonly string[]) =>
      ghArguments.includes('--paginate') ? exitWith(0, '11\n12\n') : exitWith(0),
    );

    await expect(acceptRepositoryInvites(gh, 'VybeKiit')).resolves.toBe(2);
    expect(gh).toHaveBeenCalledWith([
      'api',
      '-X',
      'PATCH',
      'user/repository_invitations/11',
      '--silent',
    ]);
    expect(gh).toHaveBeenCalledWith([
      'api',
      '-X',
      'PATCH',
      'user/repository_invitations/12',
      '--silent',
    ]);
  });

  it('only lists invites from the org, matched without case', async () => {
    const gh = vi.fn(async (_ghArguments: readonly string[]) => exitWith(0));

    await acceptRepositoryInvites(gh, 'VybeKiit');

    const [listArguments] = gh.mock.calls[0] || [];
    expect(listArguments?.at(-1)).toContain('ascii_downcase == "vybekiit"');
  });

  it('accepts nothing when the invite list cannot be read', async () => {
    const gh = vi.fn(async (_ghArguments: readonly string[]) => exitWith(1));

    await expect(acceptRepositoryInvites(gh, 'VybeKiit')).resolves.toBe(0);
    expect(gh).toHaveBeenCalledTimes(1);
  });

  it('counts only the invites GitHub accepted', async () => {
    const gh = vi.fn(async (ghArguments: readonly string[]) => {
      if (ghArguments.includes('--paginate')) {
        return exitWith(0, '11\n12\n');
      }
      return exitWith(ghArguments.includes('user/repository_invitations/12') ? 1 : 0);
    });

    await expect(acceptRepositoryInvites(gh, 'VybeKiit')).resolves.toBe(1);
  });
});
