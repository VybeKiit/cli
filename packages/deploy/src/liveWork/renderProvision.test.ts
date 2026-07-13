import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import { createRenderHost, deleteRenderService, resolveRenderOwnerId } from './renderProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('resolveRenderOwnerId', () => {
  it('prefers RENDER_OWNER_ID pin without network', async () => {
    const id = await resolveRenderOwnerId('key', { RENDER_OWNER_ID: 'tea-pinned' }, async () => {
      throw new Error('network should not run');
    });
    expect(id).toBe('tea-pinned');
  });

  it('reads first owner id from /v1/owners', async () => {
    const id = await resolveRenderOwnerId('key', {}, async (url) => {
      expect(url).toContain('/v1/owners');
      return new Response(JSON.stringify([{ owner: { id: 'tea-from-api', name: 'ws' } }]), {
        status: 200,
      });
    });
    expect(id).toBe('tea-from-api');
  });
});

describe('createRenderHost', () => {
  it('uses createService seam and verifies URL', async () => {
    const provisioned = await run(
      createRenderHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-rd-test',
        env: { RENDER_API_KEY: 'test-key' },
        createService: async ({ name }) => ({
          serviceId: `svc-${name}`,
          url: `https://${name}.onrender.com`,
        }),
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('render');
    expect(provisioned.url).toBe('https://vybekiit-lw-rd-test.onrender.com');
    expect(provisioned.projectId).toBe('svc-vybekiit-lw-rd-test');
  });

  it('missing API key → missing_credentials', async () => {
    const exit = await runExit(
      createRenderHost({
        mode: 'demo',
        env: {},
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/render_missing_api_key|RENDER_API_KEY|missing/i);
    }
  });

  it('live path without repo → onboarding_blocked hop', async () => {
    const exit = await runExit(
      createRenderHost({
        mode: 'demo',
        env: { RENDER_API_KEY: 'key' },
        // no createService → real path checks repo
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/render_needs_repo|repo|onboarding/i);
    }
  });

  it('live path posts ownerId from owners list', async () => {
    const posts: unknown[] = [];
    const provisioned = await run(
      createRenderHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-rd-owner',
        env: {
          RENDER_API_KEY: 'key',
          RENDER_STATIC_REPO: 'https://github.com/example/static',
        },
        fetchImpl: async (url, init) => {
          const href = String(url);
          if (href.includes('/v1/owners')) {
            return new Response(JSON.stringify([{ owner: { id: 'tea-live-owner' } }]), {
              status: 200,
            });
          }
          if (href.includes('/v1/services') && init?.method === 'POST') {
            posts.push(JSON.parse(String(init.body)));
            return new Response(
              JSON.stringify({
                service: {
                  id: 'srv-abc',
                  serviceDetails: { url: 'https://vybekiit-lw-rd-owner.onrender.com' },
                },
              }),
              { status: 201 },
            );
          }
          // verify GET
          return new Response('ok', { status: 200 });
        },
      }),
    );

    expect(provisioned.projectId).toBe('srv-abc');
    expect(posts[0]).toMatchObject({
      type: 'static_site',
      ownerId: 'tea-live-owner',
      repo: 'https://github.com/example/static',
      serviceDetails: { publishPath: '.' },
    });
  });

  it('does not treat buildPlan success JSON as quota', async () => {
    const provisioned = await run(
      createRenderHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-rd-plan',
        env: {
          RENDER_API_KEY: 'key',
          RENDER_STATIC_REPO: 'https://github.com/example/static',
          RENDER_OWNER_ID: 'tea-x',
        },
        fetchImpl: async (url, init) => {
          if (String(url).includes('/v1/services') && init?.method === 'POST') {
            return new Response(
              JSON.stringify({
                deployId: 'dep-1',
                service: {
                  id: 'srv-plan',
                  serviceDetails: {
                    buildPlan: 'starter',
                    url: 'https://vybekiit-lw-rd-plan.onrender.com',
                  },
                },
              }),
              { status: 201 },
            );
          }
          return new Response('ok', { status: 200 });
        },
      }),
    );
    expect(provisioned.projectId).toBe('srv-plan');
  });
});

describe('deleteRenderService', () => {
  it('best-effort delete never fails', async () => {
    const calls: string[] = [];
    await Effect.runPromise(
      deleteRenderService('srv-test', 'key', async (url, init) => {
        calls.push(`${init?.method ?? 'GET'} ${url}`);
        return new Response(null, { status: 204 });
      }),
    );
    expect(calls[0]).toMatch(/DELETE.*srv-test/);
  });
});
