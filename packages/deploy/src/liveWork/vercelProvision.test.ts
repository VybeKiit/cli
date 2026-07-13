import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { createVercelHost, parseVercelDeployUrl, type VercelCliRunner } from './vercelProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('parseVercelDeployUrl', () => {
  it('extracts vercel.app origin', () => {
    expect(parseVercelDeployUrl('Production: https://demo-app.vercel.app')).toBe(
      'https://demo-app.vercel.app',
    );
  });

  it('returns null when missing', () => {
    expect(parseVercelDeployUrl('no url here')).toBeNull();
  });
});

describe('createVercelHost', () => {
  it('deploys, verifies, and returns provisioned host', async () => {
    const runCli: VercelCliRunner = async (args) => {
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'user@example.com', stderr: '' };
      }
      if (args[0] === 'deploy') {
        return {
          code: 0,
          stdout: 'https://vybekiit-lw-v-test.vercel.app',
          stderr: '',
        };
      }
      return { code: 1, stdout: '', stderr: `unexpected ${args.join(' ')}` };
    };

    const provisioned = await run(
      createVercelHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-v-test',
        buildDir: '/tmp/fake-site',
        runCli,
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('vercel');
    expect(provisioned.url).toBe('https://vybekiit-lw-v-test.vercel.app');
    expect(provisioned.projectId).toBe('vybekiit-lw-v-test');
  });

  it('maps not-logged-in to missing_credentials', async () => {
    const runCli: VercelCliRunner = async () => ({
      code: 1,
      stdout: '',
      stderr: 'Error: No existing credentials found. Please run `vercel login`',
    });

    const exit = await runExit(
      createVercelHost({
        mode: 'demo',
        buildDir: '/tmp/fake',
        runCli,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/vercel_not_logged_in|credentials|login/i);
    }
  });
});
