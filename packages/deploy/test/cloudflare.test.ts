import { describe, expect, it, vi } from 'vitest';
import { type CloudflareDeployAction, createCloudflareHosting } from '../src/providers/cloudflare';

const config = { CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_API_TOKEN: 'token' };
const options = { projectName: 'my-app', buildDir: './dist' };

describe('createCloudflareHosting.deploy', () => {
  it('runs the wrangler deploy action and returns its url', async () => {
    let received: CloudflareDeployAction | undefined;
    const runner = vi.fn(async (action: CloudflareDeployAction) => {
      received = action;
      return { url: 'https://my-app.pages.dev' };
    });

    const result = await createCloudflareHosting(config, runner).deploy(options);

    expect(result.ok && result.value.url).toBe('https://my-app.pages.dev');
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
    const result = await createCloudflareHosting(config).deploy(options);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('no_runner');
  });

  it('maps a runner throw into a deploy_failed result', async () => {
    const runner = vi.fn(() => Promise.reject(new Error('bad token')));
    const result = await createCloudflareHosting(config, runner).deploy(options);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('deploy_failed');
  });
});
