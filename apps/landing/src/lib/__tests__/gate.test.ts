import { type GithubGateConfig, githubGateConfigSchema, parseEnv } from '@vybekiit/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inviteToRepo, removeFromRepo } from '@/lib/gate';

const gateConfig: GithubGateConfig = {
  GITHUB_GATE_TOKEN: 'test-token',
  GITHUB_GATE_ORG: 'VybeKiit',
  GITHUB_GATE_REPOS: ['web', 'mobile', 'extension'],
};

describe('gate multi-mirror invite/remove', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('invites to every mirror repo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 201 });
    vi.stubGlobal('fetch', fetchMock);

    const result = await inviteToRepo(gateConfig, 'buyer-user');
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const repo of gateConfig.GITHUB_GATE_REPOS) {
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.github.com/repos/VybeKiit/${repo}/collaborators/buyer-user`,
        expect.objectContaining({ method: 'PUT' }),
      );
    }
  });

  it('removes from every mirror repo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    const result = await removeFromRepo(gateConfig, 'buyer-user');
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const repo of gateConfig.GITHUB_GATE_REPOS) {
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.github.com/repos/VybeKiit/${repo}/collaborators/buyer-user`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    }
  });

  it('aggregates invite failures across repos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 201 })
      .mockResolvedValueOnce({ status: 403 })
      .mockResolvedValueOnce({ status: 201 });
    vi.stubGlobal('fetch', fetchMock);

    const result = await inviteToRepo(gateConfig, 'buyer-user');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invite_failed');
    }
  });
});

describe('githubGateConfigSchema', () => {
  it('parses CSV repos with defaults', () => {
    const parsed = parseEnv(githubGateConfigSchema, {
      GITHUB_GATE_TOKEN: 'tok',
    });
    expect(parsed.GITHUB_GATE_ORG).toBe('VybeKiit');
    expect(parsed.GITHUB_GATE_REPOS).toEqual(['web', 'mobile', 'extension']);
  });
});
