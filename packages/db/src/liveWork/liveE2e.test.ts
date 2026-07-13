/**
 * Real network Live work e2e (claimable Neon via neon.new).
 *
 * Run: LIVE_WORK_E2E=1 pnpm --filter @vybekiit/db test src/liveWork/liveE2e.test.ts
 *
 * Skipped in default PR CI (no vendor secrets, but network/rate-limit flaky).
 * Claimable path needs no account or card (ADR-0039 demo/dogfood).
 * Railway create path: LIVE_WORK_RAILWAY=1 when `railway whoami` succeeds.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect, Exit } from 'effect';
import { afterAll, describe, expect, it } from 'vitest';
import { createNeonDataProvider } from '../providers/neon';
import { runDataLiveWork } from './runDataLiveWork';

const LIVE = process.env.LIVE_WORK_E2E === '1';
const LIVE_RAILWAY = process.env.LIVE_WORK_RAILWAY === '1';

/**
 * True when `railway whoami` succeeds (CLI present + session).
 * Used to skip the "without login" case so a logged-in dogfood machine never
 * accidentally creates a real Railway project under LIVE_WORK_E2E alone.
 */
const railwaySessionOk = (() => {
  try {
    execFileSync('railway', ['whoami'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15_000,
    });
    return true;
  } catch {
    return false;
  }
})();

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe.runIf(LIVE)('live e2e: data Live work (claimable Neon)', () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup of temp pin dirs
      }
    }
  });

  it('provisions claimable Neon, verifies, pins .env, then insert/read via provider', {
    timeout: 120_000,
  }, async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vybekiit-live-work-e2e-'));
    tempDirs.push(cwd);
    const envPath = join(cwd, '.env');

    const written: Record<string, string>[] = [];
    const result = await run(
      runDataLiveWork({
        mode: 'demo',
        env: {},
        preferExisting: false,
        ref: 'vybekiit-live-e2e',
        writePin: (keys) =>
          Effect.sync(() => {
            written.push(keys);
            const lines = Object.entries(keys).map(([key, value]) => `${key}=${value}`);
            writeFileSync(envPath, `${lines.join('\n')}\n`);
          }),
      }),
    );

    expect(result.verified).toBe(true);
    expect(result.provider).toBe('neon');
    expect(result.ephemeral).toBe(true);
    // Empty env skips supabase (missing creds), not a free-tier hop
    expect(result.hopped).toBe(false);
    expect(result.skipped).toEqual(['supabase']);
    expect(typeof result.databaseUrl).toBe('string');
    expect(result.databaseUrl?.startsWith('postgresql://')).toBe(true);
    expect(result.pin.DATA_PROVIDER).toBe('neon');
    expect(result.pin.AUTH_PROVIDER).toBe('better-auth');
    expect(result.pin.DATABASE_URL).toBe(result.databaseUrl);
    expect(written).toHaveLength(1);

    const envFile = readFileSync(envPath, 'utf8');
    expect(envFile).toContain('DATA_PROVIDER=neon');
    expect(envFile).toContain('AUTH_PROVIDER=better-auth');
    expect(envFile).toContain('DATABASE_URL=postgresql://');
    expect(result.buyerMessage).toMatch(/Neon/);
    expect(result.buyerMessage).not.toMatch(/free plan was full/);

    // Real CRUD through the Neon hybrid provider
    const databaseUrl = result.databaseUrl;
    if (databaseUrl === undefined) {
      throw new Error('expected databaseUrl from claimable Neon');
    }
    const provider = createNeonDataProvider({ DATABASE_URL: databaseUrl });
    const id = `e2e-${Date.now()}`;
    const inserted = await run(
      provider.insert('live_work_e2e', { id, note: 'claimable neon works' }),
    );
    expect(inserted.id).toBe(id);

    const loaded = await run(provider.get('live_work_e2e', id));
    expect(loaded).toEqual(expect.objectContaining({ id, note: 'claimable neon works' }));
  });

  // Only when no Railway session — a logged-in machine would create for real.
  it.runIf(!(LIVE_RAILWAY || railwaySessionOk))(
    'named railway without login classifies missing_credentials (no hang)',
    { timeout: 30_000 },
    async () => {
      const exit = await runExit(
        runDataLiveWork({
          mode: 'buyer',
          env: {},
          namedVendor: 'railway',
          preferExisting: false,
        }),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const text = String(exit.cause);
        expect(text).toMatch(
          /railway_not_logged_in|railway_not_linked|missing_credentials|ENOENT|railway/i,
        );
      }
    },
  );
});

describe.runIf(LIVE && LIVE_RAILWAY)('live e2e: railway create (needs railway login)', () => {
  it('creates postgres via railway CLI and verifies', { timeout: 180_000 }, async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vybekiit-live-railway-'));
    const projectName = `vybekiit-lw-a9-${Date.now().toString(36)}`;
    try {
      const result = await run(
        runDataLiveWork({
          mode: 'dogfood',
          env: {},
          namedVendor: 'railway',
          preferExisting: false,
          cwd,
          railwayProjectName: projectName,
        }),
      );
      expect(result.provider).toBe('railway');
      expect(result.verified).toBe(true);
      expect(result.databaseUrl?.startsWith('postgresql://')).toBe(true);
      expect(result.databaseUrl).not.toMatch(/railway\.internal/);
      expect(result.pin.AUTH_PROVIDER).toBe('better-auth');
    } finally {
      // Mode-scoped teardown for dogfood: drop the throwaway project.
      try {
        const { execFileSync } = await import('node:child_process');
        execFileSync('railway', ['delete', '--project', projectName, '--yes', '--json'], {
          cwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        // best-effort — login/delete may fail; leave for manual cleanup
      }
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
