import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  createCloudflarePagesHost,
  parsePagesDeployUrl,
  parseWhoamiAccountId,
  type WranglerCliRunner,
} from './cloudflareProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('parsePagesDeployUrl', () => {
  it('extracts pages.dev origin', () => {
    expect(
      parsePagesDeployUrl('✨ Deployment complete! Take a look over at https://demo-app.pages.dev'),
    ).toBe('https://demo-app.pages.dev');
  });

  it('returns null when missing', () => {
    expect(parsePagesDeployUrl('no url here')).toBeNull();
  });
});

describe('parseWhoamiAccountId', () => {
  it('reads first account', () => {
    expect(
      parseWhoamiAccountId(
        JSON.stringify({
          loggedIn: true,
          accounts: [{ id: 'acct-1' }],
        }),
      ),
    ).toBe('acct-1');
  });
});

describe('createCloudflarePagesHost', () => {
  it('creates, deploys, verifies, and returns provisioned host', async () => {
    const calls: string[][] = [];
    const runCli: WranglerCliRunner = async (args) => {
      calls.push([...args]);
      if (args[0] === 'whoami') {
        return {
          code: 0,
          stdout: JSON.stringify({
            loggedIn: true,
            accounts: [{ id: 'acct' }],
          }),
          stderr: '',
        };
      }
      if (args[0] === 'pages' && args[1] === 'project' && args[2] === 'create') {
        return { code: 0, stdout: 'created', stderr: '' };
      }
      if (args[0] === 'pages' && args[1] === 'deploy') {
        return {
          code: 0,
          stdout: '✨ https://vybekiit-lw-test.pages.dev',
          stderr: '',
        };
      }
      return { code: 1, stdout: '', stderr: `unexpected ${args.join(' ')}` };
    };

    const provisioned = await run(
      createCloudflarePagesHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-test',
        buildDir: '/tmp/fake-site',
        runCli,
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('cloudflare');
    // Stable production URL (not deployment-hash subdomain)
    expect(provisioned.url).toBe('https://vybekiit-lw-test.pages.dev');
    expect(provisioned.projectId).toBe('vybekiit-lw-test');
    expect(provisioned.ephemeral).toBe(true);
    expect(calls.some((c) => c[0] === 'pages' && c[1] === 'deploy')).toBe(true);
  });

  it('maps not logged in to missing_credentials', async () => {
    const runCli: WranglerCliRunner = async () => ({
      code: 1,
      stdout: '',
      stderr: 'Not logged in. Run wrangler login',
    });

    const exit = await runExit(
      createCloudflarePagesHost({
        mode: 'demo',
        projectName: 'x',
        buildDir: '/tmp/x',
        runCli,
        skipVerify: true,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/not logged|missing|login|cf_not_logged/i);
    }
  });

  it('buyer mode without buildDir is missing_credentials', async () => {
    const exit = await runExit(
      createCloudflarePagesHost({
        mode: 'buyer',
        projectName: 'buyer-app',
        runCli: async () => ({ code: 0, stdout: '', stderr: '' }),
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});
