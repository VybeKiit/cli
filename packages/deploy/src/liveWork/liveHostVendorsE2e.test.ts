/**
 * Real network host Live work e2e for ladder vendors beyond Cloudflare (A12b).
 *
 * Gates (explicit so dogfood machines never create by accident):
 *   LIVE_WORK_HOST_RAILWAY=1  — railway CLI logged in
 *   LIVE_WORK_HOST_VERCEL=1   — vercel CLI + login or VERCEL_TOKEN
 *   LIVE_WORK_HOST_RENDER=1   — RENDER_API_KEY (+ RENDER_STATIC_REPO for create)
 *   LIVE_WORK_HOST_NETLIFY=1  — NETLIFY_AUTH_TOKEN
 *   LIVE_WORK_HOST_GITHUB_PAGES=1 — GITHUB_TOKEN or GH_TOKEN (repo scope)
 *
 * Cloudflare remains in liveHostE2e.test.ts (LIVE_WORK_HOST_E2E=1).
 *
 * Run examples:
 *   LIVE_WORK_HOST_RAILWAY=1 pnpm --filter @vybekiit/deploy test src/liveWork/liveHostVendorsE2e.test.ts
 */
import { execFileSync } from 'node:child_process';
import { Effect, Exit } from 'effect';
import { afterAll, describe, expect, it } from 'vitest';
import { defaultLiveWorkProjectName } from './cloudflareProvision';
import {
  deleteGithubPagesRepo,
  parseGithubPagesProjectId,
  readGithubToken,
} from './githubPagesProvision';
import { deleteNetlifySite, readNetlifyAuthToken } from './netlifyProvision';
import { createRenderHost, deleteRenderService, readRenderApiKey } from './renderProvision';
import { runHostLiveWork } from './runHostLiveWork';
import { createVercelHost, deleteVercelProject } from './vercelProvision';

/**
 * Prefer env token; fall back to `gh auth token` for local dogfood.
 *
 * @returns GitHub token or null.
 */
const resolveGithubTokenForLive = (): string | null => {
  const fromEnv = readGithubToken(process.env);
  if (fromEnv !== null) {
    return fromEnv;
  }
  try {
    const out = execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
};

const LIVE_RAILWAY = process.env.LIVE_WORK_HOST_RAILWAY === '1';
const LIVE_VERCEL = process.env.LIVE_WORK_HOST_VERCEL === '1';
const LIVE_RENDER = process.env.LIVE_WORK_HOST_RENDER === '1';
const LIVE_NETLIFY = process.env.LIVE_WORK_HOST_NETLIFY === '1';
const LIVE_GITHUB_PAGES = process.env.LIVE_WORK_HOST_GITHUB_PAGES === '1';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe.runIf(LIVE_RAILWAY)('live e2e: host Live work (Railway)', () => {
  const projectNames: string[] = [];

  afterAll(async () => {
    // Best-effort: railway delete by project name when CLI supports it.
    for (const name of projectNames) {
      try {
        const { execFileSync } = await import('node:child_process');
        execFileSync('railway', ['delete', '--project', name, '--yes', '--json'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        // leave for manual cleanup if delete fails
      }
    }
  }, 180_000);

  it('creates railway host via runHostLiveWork, verifies URL, pins', {
    timeout: 300_000,
  }, async () => {
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-rw');
    projectNames.push(projectName);

    const written: Record<string, string>[] = [];
    const result = await run(
      runHostLiveWork({
        mode: 'dogfood',
        env: {},
        preferExisting: false,
        namedVendor: 'railway',
        projectName,
        writePin: (keys) =>
          Effect.sync(() => {
            written.push(keys);
          }),
      }),
    );

    expect(result.verified).toBe(true);
    expect(result.provider).toBe('railway');
    expect(result.url?.startsWith('https://')).toBe(true);
    expect(result.pin.HOSTING_PROVIDER).toBe('railway');
    expect(result.pin.APP_URL).toBe(result.url);
    expect(written).toHaveLength(1);

    const url = result.url;
    if (url === undefined) {
      throw new Error('expected railway public URL');
    }
    const response = await fetch(url);
    // Railway free deploys can take a while; accept 200 or cold-start 502/503 briefly
    expect([200, 502, 503]).toContain(response.status);
  });
});

describe.runIf(LIVE_VERCEL)('live e2e: host Live work (Vercel)', () => {
  const projectNames: string[] = [];
  let token: string | undefined;
  if (typeof process.env.VERCEL_TOKEN === 'string' && process.env.VERCEL_TOKEN.length > 0) {
    token = process.env.VERCEL_TOKEN;
  }

  afterAll(async () => {
    for (const name of projectNames) {
      await run(deleteVercelProject(name, undefined, token));
    }
  }, 180_000);

  it('creates vercel host via runHostLiveWork, verifies URL, pins', {
    timeout: 240_000,
  }, async () => {
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-ve');
    projectNames.push(projectName);

    const written: Record<string, string>[] = [];
    const result = await run(
      runHostLiveWork({
        mode: 'dogfood',
        env: token === undefined ? {} : { VERCEL_TOKEN: token },
        preferExisting: false,
        namedVendor: 'vercel',
        projectName,
        writePin: (keys) =>
          Effect.sync(() => {
            written.push(keys);
          }),
      }),
    );

    expect(result.verified).toBe(true);
    expect(result.provider).toBe('vercel');
    expect(result.url?.includes('vercel.app')).toBe(true);
    expect(result.pin.HOSTING_PROVIDER).toBe('vercel');
    expect(written).toHaveLength(1);
  });

  it('createVercelHost path alone verifies', { timeout: 240_000 }, async () => {
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-ve-d');
    projectNames.push(projectName);
    const provisioned = await run(
      createVercelHost({
        mode: 'demo',
        projectName,
        ...(token === undefined ? {} : { token }),
      }),
    );
    expect(provisioned.provider).toBe('vercel');
    expect(provisioned.url?.startsWith('https://')).toBe(true);
  });
});

describe.runIf(LIVE_RENDER)('live e2e: host Live work (Render)', () => {
  const serviceIds: string[] = [];
  const apiKey = readRenderApiKey(process.env);

  afterAll(async () => {
    if (apiKey === null) {
      return;
    }
    for (const id of serviceIds) {
      await run(deleteRenderService(id, apiKey));
    }
  }, 120_000);

  it('missing RENDER_STATIC_REPO classifies onboarding_blocked (live hop signal)', {
    timeout: 30_000,
  }, async () => {
    if (apiKey === null) {
      // Still assert missing key path when flag is on without key.
      const exit = await runExit(
        createRenderHost({
          mode: 'demo',
          env: {},
        }),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(String(exit.cause)).toMatch(/RENDER_API_KEY|missing|connect tools/i);
      }
      return;
    }

    const exit = await runExit(
      createRenderHost({
        mode: 'demo',
        env: { RENDER_API_KEY: apiKey },
        // no RENDER_STATIC_REPO → onboarding_blocked hop class
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/render_needs_repo|onboarding|repo|RENDER_STATIC_REPO/i);
    }
  });

  it.runIf(
    LIVE_RENDER &&
      typeof process.env.RENDER_STATIC_REPO === 'string' &&
      process.env.RENDER_STATIC_REPO.length > 0 &&
      apiKey !== null,
  )('creates render static site, verifies, tears down', { timeout: 300_000 }, async () => {
    if (apiKey === null) {
      return;
    }
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-rd');
    const result = await run(
      runHostLiveWork({
        mode: 'dogfood',
        env: {
          RENDER_API_KEY: apiKey,
          RENDER_STATIC_REPO: process.env.RENDER_STATIC_REPO ?? '',
        },
        preferExisting: false,
        namedVendor: 'render',
        projectName,
      }),
    );
    expect(result.provider).toBe('render');
    expect(result.verified).toBe(true);
    if (typeof result.projectId === 'string') {
      serviceIds.push(result.projectId);
    }
  });
});

describe.runIf(LIVE_NETLIFY)('live e2e: host Live work (Netlify)', () => {
  const siteIds: string[] = [];
  const token = readNetlifyAuthToken(process.env);

  afterAll(async () => {
    if (token === null) {
      return;
    }
    for (const id of siteIds) {
      await run(deleteNetlifySite(id, token));
    }
  }, 120_000);

  it('missing token classifies missing_credentials when gate on without key', {
    timeout: 30_000,
  }, async () => {
    if (token !== null) {
      return;
    }
    const exit = await runExit(
      runHostLiveWork({
        mode: 'dogfood',
        env: {},
        preferExisting: false,
        namedVendor: 'netlify',
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/netlify_missing_token|NETLIFY_AUTH_TOKEN|missing/i);
    }
  });

  it.runIf(LIVE_NETLIFY && token !== null)(
    'creates netlify site, verifies, tears down',
    { timeout: 300_000 },
    async () => {
      if (token === null) {
        return;
      }
      const projectName = defaultLiveWorkProjectName('vybekiit-lw-nl');
      const result = await run(
        runHostLiveWork({
          mode: 'dogfood',
          env: { NETLIFY_AUTH_TOKEN: token },
          preferExisting: false,
          namedVendor: 'netlify',
          projectName,
        }),
      );
      expect(result.provider).toBe('netlify');
      expect(result.verified).toBe(true);
      expect(result.url?.includes('netlify')).toBe(true);
      expect(result.pin.HOSTING_PROVIDER).toBe('netlify');
      if (typeof result.projectId === 'string') {
        siteIds.push(result.projectId);
      }
    },
  );
});

describe.runIf(LIVE_GITHUB_PAGES)('live e2e: host Live work (GitHub Pages)', () => {
  const repoIds: string[] = [];
  const token = resolveGithubTokenForLive();

  afterAll(async () => {
    if (token === null) {
      return;
    }
    for (const id of repoIds) {
      const parsed = parseGithubPagesProjectId(id);
      if (parsed === null) {
        continue;
      }
      await run(deleteGithubPagesRepo(parsed.owner, parsed.repo, token));
      // Fine-grained / OAuth tokens often lack `delete_repo`; fall back to `gh`.
      try {
        execFileSync('gh', ['repo', 'delete', id, '--yes'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
        });
      } catch {
        // leave for manual cleanup when token lacks delete_repo scope
      }
    }
  }, 180_000);

  it.runIf(LIVE_GITHUB_PAGES && token !== null)(
    'creates github pages repo, verifies, tears down',
    { timeout: 360_000 },
    async () => {
      if (token === null) {
        return;
      }
      const projectName = defaultLiveWorkProjectName('vybekiit-lw-gp');
      const result = await run(
        runHostLiveWork({
          mode: 'dogfood',
          env: { GITHUB_TOKEN: token },
          preferExisting: false,
          namedVendor: 'github-pages',
          projectName,
        }),
      );
      expect(result.provider).toBe('github-pages');
      expect(result.verified).toBe(true);
      expect(result.url?.includes('github.io')).toBe(true);
      expect(result.pin.HOSTING_PROVIDER).toBe('github-pages');
      if (typeof result.projectId === 'string') {
        repoIds.push(result.projectId);
      }
    },
  );
});
