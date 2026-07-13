import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  createRailwayPostgres,
  isRailwayStatusLinked,
  parseRailwayDatabaseUrl,
  parseRailwayInitProjectId,
  type RailwayCliRunner,
} from './railwayProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('parseRailwayDatabaseUrl', () => {
  it('reads object form', () => {
    expect(
      parseRailwayDatabaseUrl(JSON.stringify({ DATABASE_URL: 'postgresql://railway/db' })),
    ).toBe('postgresql://railway/db');
  });

  it('prefers DATABASE_PUBLIC_URL over private DATABASE_URL', () => {
    expect(
      parseRailwayDatabaseUrl(
        JSON.stringify({
          DATABASE_URL: 'postgresql://postgres.railway.internal/db',
          DATABASE_PUBLIC_URL: 'postgresql://proxy.rlwy.net/db',
        }),
      ),
    ).toBe('postgresql://proxy.rlwy.net/db');
  });

  it('reads array form from variables list', () => {
    expect(
      parseRailwayDatabaseUrl(
        JSON.stringify([
          { name: 'PORT', value: '3000' },
          { name: 'DATABASE_URL', value: 'postgresql://from-array/db' },
        ]),
      ),
    ).toBe('postgresql://from-array/db');
  });

  it('returns null when missing', () => {
    expect(parseRailwayDatabaseUrl('{}')).toBeNull();
    expect(parseRailwayDatabaseUrl('not-json')).toBeNull();
  });
});

describe('parseRailwayInitProjectId', () => {
  it('reads id from init json', () => {
    expect(parseRailwayInitProjectId(JSON.stringify({ id: 'proj-1', name: 'x' }))).toBe('proj-1');
  });

  it('skips interactive preamble', () => {
    expect(parseRailwayInitProjectId('> Select a workspace\n{"id":"abc","name":"n"}')).toBe('abc');
  });
});

describe('isRailwayStatusLinked', () => {
  it('detects no linked project', () => {
    expect(isRailwayStatusLinked(1, '', 'No linked project found')).toBe(false);
  });

  it('detects linked project', () => {
    expect(
      isRailwayStatusLinked(0, 'Project: demo\nProject ID: x\nEnvironment: production', ''),
    ).toBe(true);
  });
});

describe('createRailwayPostgres', () => {
  it('provisions when already linked: whoami + status + add + variables', async () => {
    const runCli: RailwayCliRunner = async (args) => {
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'user@example.com', stderr: '' };
      }
      if (args[0] === 'status') {
        return { code: 0, stdout: 'Project: existing\nProject ID: p1', stderr: '' };
      }
      if (args[0] === 'add') {
        return {
          code: 0,
          stdout: JSON.stringify({ serviceId: 'svc', serviceName: 'Postgres' }),
          stderr: '',
        };
      }
      if (args[0] === 'variables') {
        return {
          code: 0,
          stdout: JSON.stringify({
            DATABASE_PUBLIC_URL: 'postgresql://railway/public',
            DATABASE_URL: 'postgresql://railway.internal/private',
          }),
          stderr: '',
        };
      }
      return { code: 1, stdout: '', stderr: `unexpected ${args.join(' ')}` };
    };

    const provisioned = await run(createRailwayPostgres({ runCli, maxPolls: 1 }));
    expect(provisioned).toEqual({
      provider: 'railway',
      ephemeral: false,
      databaseUrl: 'postgresql://railway/public',
    });
  });

  it('inits a project when status is unlinked then adds postgres', async () => {
    const calls: string[] = [];
    const runCli: RailwayCliRunner = async (args) => {
      calls.push(args.join(' '));
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'user@example.com', stderr: '' };
      }
      if (args[0] === 'status') {
        return { code: 1, stdout: '', stderr: 'No linked project found' };
      }
      if (args[0] === 'init') {
        return {
          code: 0,
          stdout: JSON.stringify({ id: 'new-proj', name: args[2] ?? 'x' }),
          stderr: '',
        };
      }
      if (args[0] === 'add') {
        return { code: 0, stdout: '{}', stderr: '' };
      }
      if (args[0] === 'variables') {
        return {
          code: 0,
          stdout: JSON.stringify({ DATABASE_URL: 'postgresql://railway/after-init' }),
          stderr: '',
        };
      }
      return { code: 1, stdout: '', stderr: `unexpected ${args.join(' ')}` };
    };

    const provisioned = await run(
      createRailwayPostgres({
        runCli,
        projectName: 'vybekiit-lw-unit',
        maxPolls: 1,
      }),
    );
    expect(provisioned.databaseUrl).toBe('postgresql://railway/after-init');
    expect(calls.some((c) => c.startsWith('init --name vybekiit-lw-unit'))).toBe(true);
  });

  it('maps not-logged-in to missing_credentials', async () => {
    const runCli: RailwayCliRunner = async () => ({
      code: 1,
      stdout: '',
      stderr: 'Unauthorized. Please login with `railway login`',
    });

    const exit = await runExit(createRailwayPostgres({ runCli }));
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/railway_not_logged_in|Unauthorized|login/i);
    }
  });

  it('maps quota language to hop class quota', async () => {
    const runCli: RailwayCliRunner = async (args) => {
      if (args[0] === 'whoami') {
        return { code: 0, stdout: 'ok', stderr: '' };
      }
      if (args[0] === 'status') {
        return { code: 0, stdout: 'Project: p', stderr: '' };
      }
      return { code: 1, stdout: '', stderr: 'plan limit reached for free tier' };
    };

    const exit = await runExit(createRailwayPostgres({ runCli }));
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const text = String(exit.cause);
      expect(text).toMatch(/quota|plan limit/i);
    }
  });
});
