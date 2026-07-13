/**
 * Real network host Live work e2e (Cloudflare Pages via wrangler).
 *
 * Run: LIVE_WORK_HOST_E2E=1 pnpm --filter @vybekiit/deploy test src/liveWork/liveHostE2e.test.ts
 *
 * Requires: `wrangler whoami` logged in with pages:write.
 * Creates a throwaway Pages project, verifies HTTP 200, then deletes the project.
 */
import { Effect } from 'effect';
import { afterAll, describe, expect, it } from 'vitest';
import {
  createCloudflarePagesHost,
  defaultLiveWorkProjectName,
  deleteCloudflarePagesProject,
} from './cloudflareProvision';
import { runHostLiveWork } from './runHostLiveWork';

const LIVE = process.env.LIVE_WORK_HOST_E2E === '1';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);

describe.runIf(LIVE)('live e2e: host Live work (Cloudflare Pages)', () => {
  const projectsToDelete: string[] = [];

  afterAll(async () => {
    for (const name of projectsToDelete) {
      await run(deleteCloudflarePagesProject(name));
    }
  }, 120_000);

  it('creates Pages project, deploys demo site, verifies URL, pins', {
    timeout: 180_000,
  }, async () => {
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-e2e');
    projectsToDelete.push(projectName);

    const written: Record<string, string>[] = [];
    const result = await run(
      runHostLiveWork({
        mode: 'demo',
        env: {},
        preferExisting: false,
        projectName,
        writePin: (keys) =>
          Effect.sync(() => {
            written.push(keys);
          }),
      }),
    );

    expect(result.verified).toBe(true);
    expect(result.provider).toBe('cloudflare');
    expect(result.url?.includes('pages.dev')).toBe(true);
    expect(result.pin.HOSTING_PROVIDER).toBe('cloudflare');
    expect(result.pin.APP_URL).toBe(result.url);
    expect(result.pin.CLOUDFLARE_PROJECT_NAME).toBe(projectName);
    expect(written).toHaveLength(1);

    const url = result.url;
    if (url === undefined) {
      throw new Error('expected public URL');
    }
    const response = await fetch(url);
    expect(response.ok).toBe(true);
    const html = await response.text();
    expect(html).toMatch(/Live work host OK|vybekiit-live-work/i);
  });

  it('createCloudflarePagesHost path alone verifies', { timeout: 180_000 }, async () => {
    const projectName = defaultLiveWorkProjectName('vybekiit-lw-direct');
    projectsToDelete.push(projectName);

    const provisioned = await run(
      createCloudflarePagesHost({
        mode: 'demo',
        projectName,
      }),
    );

    expect(provisioned.provider).toBe('cloudflare');
    expect(provisioned.url?.startsWith('https://')).toBe(true);
  });
});
