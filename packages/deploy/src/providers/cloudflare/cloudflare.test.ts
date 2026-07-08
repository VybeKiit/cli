import {
  type CloudflareDeployAction,
  createCloudflareHosting,
} from '@vybekiit/deploy/providers/cloudflare';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const config = { CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_API_TOKEN: 'token' };
const options = { projectName: 'my-app', buildDir: './dist' };

describe('createCloudflareHosting.deploy', () => {
  it('runs the wrangler deploy action and returns its url', async () => {
    let received: CloudflareDeployAction | undefined;
    const runner = vi.fn((action: CloudflareDeployAction) => {
      received = action;
      return Promise.resolve({ url: 'https://my-app.pages.dev' });
    });

    const result = await Effect.runPromise(createCloudflareHosting(config, runner).deploy(options));

    expect(result.url).toBe('https://my-app.pages.dev');
    expect(received?.command).toBe('wrangler');
    expect(received?.args).toEqual([
      'pages',
      'deploy',
      './dist',
      '--project-name',
      'my-app',
      '--account-id',
      'acct',
    ]);
  });

  it('fails when no runner is wired', async () => {
    const error = await Effect.runPromise(
      Effect.flip(createCloudflareHosting(config).deploy(options)),
    );

    expect(error.code).toBe('no_runner');
  });

  it('maps a runner throw into a deploy_failed result', async () => {
    const runner = vi.fn(() => Promise.reject(new Error('bad token')));
    const error = await Effect.runPromise(
      Effect.flip(createCloudflareHosting(config, runner).deploy(options)),
    );

    expect(error.code).toBe('deploy_failed');
  });
});
