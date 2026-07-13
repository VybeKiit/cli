import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  createRailwayHost,
  parseRailwayHostUrl,
  type RailwayHostCliRunner,
} from './railwayHostProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('parseRailwayHostUrl', () => {
  it('extracts up.railway.app origin', () => {
    expect(parseRailwayHostUrl('Service live at https://demo.up.railway.app')).toBe(
      'https://demo.up.railway.app',
    );
  });

  it('returns null when missing', () => {
    expect(parseRailwayHostUrl('no url here')).toBeNull();
  });
});

describe('createRailwayHost', () => {
  it('inits, ups, and returns provisioned host', async () => {
    const runCli: RailwayHostCliRunner = async (args) => {
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'user@example.com', stderr: '' };
      }
      if (args[0] === 'init') {
        return { code: 0, stdout: 'created', stderr: '' };
      }
      if (args[0] === 'up') {
        return { code: 0, stdout: 'Deployed', stderr: '' };
      }
      if (args[0] === 'domain') {
        return {
          code: 0,
          stdout: 'https://vybekiit-lw-r-test.up.railway.app',
          stderr: '',
        };
      }
      return { code: 1, stdout: '', stderr: `unexpected ${args.join(' ')}` };
    };

    const provisioned = await run(
      createRailwayHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-r-test',
        buildDir: '/tmp/fake-site',
        cwd: '/tmp/fake-site',
        runCli,
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('railway');
    expect(provisioned.url).toBe('https://vybekiit-lw-r-test.up.railway.app');
  });

  it('maps not-logged-in to missing_credentials', async () => {
    const runCli: RailwayHostCliRunner = async () => ({
      code: 1,
      stdout: '',
      stderr: 'Unauthorized. Please login with `railway login`',
    });

    const exit = await runExit(
      createRailwayHost({
        mode: 'demo',
        buildDir: '/tmp/fake',
        runCli,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/railway_not_logged_in|Unauthorized|login/i);
    }
  });

  it('maps free plan provision limit to quota hop', async () => {
    const runCli: RailwayHostCliRunner = async (args) => {
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'user@example.com', stderr: '' };
      }
      if (args[0] === 'init') {
        return {
          code: 1,
          stdout: '',
          stderr:
            'Free plan resource provision limit exceeded. Please upgrade to provision more resources!',
        };
      }
      return { code: 1, stdout: '', stderr: 'unexpected' };
    };

    const exit = await runExit(
      createRailwayHost({
        mode: 'demo',
        buildDir: '/tmp/fake',
        runCli,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/railway_quota|quota|limit exceeded|Free plan/i);
    }
  });
});
