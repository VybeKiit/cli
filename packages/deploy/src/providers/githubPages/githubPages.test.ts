import {
  createGithubPagesHosting,
  defaultGithubPagesRunner,
} from '@vybekiit/deploy/providers/githubPages';
import type { DeployError, DeployResult } from '@vybekiit/deploy/types';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const okRunner = (url: string) =>
  vi.fn((): Effect.Effect<DeployResult, DeployError> => Effect.succeed({ url }));

describe('createGithubPagesHosting', () => {
  it('deploys via the injected runner and forwards the config owner + env', async () => {
    const runner = okRunner('https://me.github.io/app/');
    const hosting = createGithubPagesHosting(
      { GITHUB_PAGES_OWNER: 'me' },
      { GITHUB_TOKEN: 'gh-test' },
      runner,
    );

    const result = await Effect.runPromise(
      hosting.deploy({ projectName: 'app', buildDir: 'dist' }),
    );

    expect(result.url).toBe('https://me.github.io/app/');
    expect(runner).toHaveBeenCalledWith({
      projectName: 'app',
      buildDir: 'dist',
      owner: 'me',
      env: { GITHUB_TOKEN: 'gh-test' },
    });
  });

  it('forwards no owner when the config omits it', async () => {
    const runner = okRunner('https://x.github.io/app/');
    const hosting = createGithubPagesHosting({}, { GH_TOKEN: 't' }, runner);

    await Effect.runPromise(hosting.deploy({ projectName: 'app', buildDir: 'out' }));

    expect(runner).toHaveBeenCalledWith({
      projectName: 'app',
      buildDir: 'out',
      env: { GH_TOKEN: 't' },
    });
  });

  it('reports a not-live status stub without a live check', async () => {
    const hosting = createGithubPagesHosting({}, {}, okRunner('unused'));

    const status = await Effect.runPromise(hosting.status('app'));

    expect(status).toEqual({ live: false, url: null });
  });
});

// biome-ignore lint/security/noSecrets: describe label is the function-under-test name, not a secret
describe('defaultGithubPagesRunner', () => {
  it('maps a missing GitHub token into the deploy error channel', async () => {
    const error = await Effect.runPromise(
      Effect.flip(defaultGithubPagesRunner({ projectName: 'app', buildDir: 'out', env: {} })),
    );

    expect(error.code).toBe('github_pages_missing_token');
  });
});
