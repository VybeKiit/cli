import { type Mock, describe, expect, it, vi } from 'vitest';
import { type AmplifyRunner, createAwsHosting } from '../src/providers/aws';

const config = { AWS_REGION: 'us-east-1', AWS_DYNAMODB_TABLE_PREFIX: '' };
const hosting = { AWS_AMPLIFY_APP_ID: 'app123', AWS_AMPLIFY_BRANCH: 'main' };
const options = { projectName: 'my-app', buildDir: './dist' };

/** A fake Amplify runner capturing the command input the adapter issued. */
function fakeRunner(impl: AmplifyRunner['send']): { runner: AmplifyRunner; send: Mock } {
  const send = vi.fn(impl);
  return { runner: { send }, send };
}

describe('createAwsHosting', () => {
  it('reports its provider name', () => {
    const { runner } = fakeRunner(async () => ({}));
    expect(createAwsHosting(config, hosting, runner).name).toBe('aws');
  });

  it('deploy starts a RELEASE job for the app/branch and returns the amplify url', async () => {
    const { runner, send } = fakeRunner(async () => ({}));

    const result = await createAwsHosting(config, hosting, runner).deploy(options);

    expect(result.ok && result.value.url).toBe('https://main.app123.amplifyapp.com');
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0]?.[0] as { input: Record<string, unknown> };
    expect(command.input).toEqual({ appId: 'app123', branchName: 'main', jobType: 'RELEASE' });
  });

  it('deploy fails when no Amplify app id is configured', async () => {
    const { runner, send } = fakeRunner(async () => ({}));

    const result = await createAwsHosting(config, { AWS_AMPLIFY_BRANCH: 'main' }, runner).deploy(
      options,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('no_amplify_app');
    expect(send).not.toHaveBeenCalled();
  });

  it('maps a runner throw into a deploy_failed result', async () => {
    const { runner } = fakeRunner(() => Promise.reject(new Error('throttled')));

    const result = await createAwsHosting(config, hosting, runner).deploy(options);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('deploy_failed');
  });

  it('status reports live + url when the latest job succeeded', async () => {
    const { runner } = fakeRunner(async () => ({
      job: { summary: { status: 'SUCCEED' } },
    }));

    const result = await createAwsHosting(config, hosting, runner).status('my-app');

    expect(result.ok && result.value).toEqual({
      live: true,
      url: 'https://main.app123.amplifyapp.com',
    });
  });

  it('status reports not-live when the latest job has not succeeded', async () => {
    const { runner } = fakeRunner(async () => ({
      job: { summary: { status: 'RUNNING' } },
    }));

    const result = await createAwsHosting(config, hosting, runner).status('my-app');

    expect(result.ok && result.value).toEqual({ live: false, url: null });
  });
});
