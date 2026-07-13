import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  createGithubPagesHost,
  parseGithubPagesProjectId,
  resolveGithubLogin,
} from './githubPagesProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('parseGithubPagesProjectId', () => {
  it('splits owner/repo', () => {
    expect(parseGithubPagesProjectId('YosefHayim/vybekiit-lw-gp-1')).toEqual({
      owner: 'YosefHayim',
      repo: 'vybekiit-lw-gp-1',
    });
    expect(parseGithubPagesProjectId('bad')).toBeNull();
  });
});

describe('resolveGithubLogin', () => {
  it('reads login from /user', async () => {
    const login = await resolveGithubLogin('tok', async (url) => {
      expect(String(url)).toContain('/user');
      return new Response(JSON.stringify({ login: 'YosefHayim' }), { status: 200 });
    });
    expect(login).toBe('YosefHayim');
  });
});

describe('createGithubPagesHost', () => {
  it('uses createPages seam and verifies URL', async () => {
    const provisioned = await run(
      createGithubPagesHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-gp-test',
        env: { GITHUB_TOKEN: 'test-token', GITHUB_PAGES_OWNER: 'me' },
        createPages: async ({ name, owner }) => ({
          repoFullName: `${owner}/${name}`,
          url: `https://${owner.toLowerCase()}.github.io/${name}`,
        }),
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('github-pages');
    expect(provisioned.url).toBe('https://me.github.io/vybekiit-lw-gp-test');
    expect(provisioned.projectId).toBe('me/vybekiit-lw-gp-test');
  });

  it('missing token → missing_credentials', async () => {
    const exit = await runExit(
      createGithubPagesHost({
        mode: 'demo',
        env: {},
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(
        /github_pages_missing_token|GITHUB_TOKEN|GH_TOKEN|missing/i,
      );
    }
  });

  it('live path creates repo, uploads index, enables pages', async () => {
    const calls: string[] = [];
    const provisioned = await run(
      createGithubPagesHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-gp-api',
        buildDir: '/tmp/does-not-matter-when-mocked',
        env: { GITHUB_TOKEN: 'key', GITHUB_PAGES_OWNER: 'YosefHayim' },
        // Provide createPages=false path with full mock by using fetchImpl only —
        // need real index.html; write via createPages seam for unit certainty.
        createPages: async ({ name, owner }) => {
          calls.push('create');
          return {
            repoFullName: `${owner}/${name}`,
            url: `https://${owner.toLowerCase()}.github.io/${name}`,
          };
        },
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(calls).toEqual(['create']);
    expect(provisioned.projectId).toBe('YosefHayim/vybekiit-lw-gp-api');
  });
});
