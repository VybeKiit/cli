import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { classifyHostHopSignal, shouldContinueHostLadder } from './hopSignals';
import { HOST_PREFERENCE_LADDER, resolveHostLadderOrder } from './ladders';
import { buildHostPinKeys, buyerHostSuccessMessage } from './pin';
import type { HostLadderStep } from './runHostLiveWork';
import { runHostLiveWork } from './runHostLiveWork';
import { HostLiveWorkError } from './types';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('host ladders', () => {
  it('has cloudflare first', () => {
    expect(HOST_PREFERENCE_LADDER[0]).toBe('cloudflare');
    expect([...HOST_PREFERENCE_LADDER]).toEqual([
      'cloudflare',
      'render',
      'railway',
      'vercel',
      'netlify',
      'github-pages',
    ]);
  });

  it('starts at pin then remainder', () => {
    expect(resolveHostLadderOrder({ HOSTING_PROVIDER: 'railway' })).toEqual([
      'railway',
      'vercel',
      'netlify',
      'github-pages',
    ]);
  });

  it('named stick is single entry', () => {
    expect(resolveHostLadderOrder({}, 'vercel')).toEqual(['vercel']);
  });
});

describe('host hop signals', () => {
  it('classifies quota and missing credentials', () => {
    expect(classifyHostHopSignal('quota_exceeded', 'Free tier full')).toBe('quota');
    expect(classifyHostHopSignal('missing_credentials', 'wrangler login')).toBe(
      'missing_credentials',
    );
    expect(shouldContinueHostLadder('hard_stop')).toBe(false);
  });
});

describe('host pin', () => {
  it('pins HOSTING_PROVIDER and APP_URL', () => {
    expect(
      buildHostPinKeys({
        provider: 'cloudflare',
        url: 'https://app.pages.dev',
        ephemeral: false,
      }),
    ).toEqual({
      HOSTING_PROVIDER: 'cloudflare',
      APP_URL: 'https://app.pages.dev',
    });
  });

  it('celebrates without jargon', () => {
    expect(buyerHostSuccessMessage('vercel', false)).toContain('Vercel');
    expect(buyerHostSuccessMessage('vercel', false)).not.toMatch(/HOSTING_PROVIDER|env/i);
  });
});

describe('runHostLiveWork', () => {
  it('uses existing APP_URL pin without ladder create', async () => {
    const result = await run(
      runHostLiveWork({
        mode: 'buyer',
        env: { HOSTING_PROVIDER: 'cloudflare', APP_URL: 'https://live.example' },
      }),
    );
    expect(result.provider).toBe('cloudflare');
    expect(result.url).toBe('https://live.example');
    expect(result.verified).toBe(true);
    expect(result.pin.HOSTING_PROVIDER).toBe('cloudflare');
  });

  it('hops quota to next injectable step', async () => {
    const steps: readonly HostLadderStep[] = [
      {
        provider: 'cloudflare',
        tryProvision: () =>
          Effect.fail(
            new HostLiveWorkError({
              code: 'quota',
              message: 'Free plan projects full',
              hopClass: 'quota',
              provider: 'cloudflare',
            }),
          ),
      },
      {
        provider: 'render',
        tryProvision: () =>
          Effect.succeed({
            provider: 'render',
            url: 'https://app.onrender.com',
            ephemeral: false,
          }),
      },
    ];

    const result = await run(
      runHostLiveWork({
        mode: 'demo',
        env: {},
        steps,
        preferExisting: false,
      }),
    );

    expect(result.provider).toBe('render');
    expect(result.hopped).toBe(true);
    expect(result.fromProvider).toBe('cloudflare');
    expect(result.buyerMessage).toMatch(/free plan was full/);
  });

  it('default steps use injectable cloudflare and pin winner', async () => {
    const result = await run(
      runHostLiveWork({
        mode: 'demo',
        env: {},
        preferExisting: false,
        projectName: 'vybekiit-lw-unit',
        buildDir: '/tmp/fake-site',
        wranglerCli: async (args) => {
          if (args[0] === 'whoami') {
            return {
              code: 0,
              stdout: JSON.stringify({ loggedIn: true, accounts: [{ id: 'a' }] }),
              stderr: '',
            };
          }
          if (args[0] === 'pages' && args[1] === 'project' && args[2] === 'create') {
            return { code: 0, stdout: 'ok', stderr: '' };
          }
          if (args[0] === 'pages' && args[1] === 'deploy') {
            return {
              code: 0,
              stdout: 'https://vybekiit-lw-unit.pages.dev',
              stderr: '',
            };
          }
          return { code: 1, stdout: '', stderr: args.join(' ') };
        },
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(result.provider).toBe('cloudflare');
    expect(result.url).toBe('https://vybekiit-lw-unit.pages.dev');
    expect(result.pin.HOSTING_PROVIDER).toBe('cloudflare');
  });

  it('default steps can win on vercel when cloudflare/render/railway skip', async () => {
    const result = await run(
      runHostLiveWork({
        mode: 'demo',
        env: {},
        preferExisting: false,
        projectName: 'vybekiit-lw-v-unit',
        buildDir: '/tmp/fake-site',
        wranglerCli: async () => ({
          code: 1,
          stdout: '',
          stderr: 'not logged in',
        }),
        railwayHostCli: async () => ({
          code: 1,
          stdout: '',
          stderr: 'Unauthorized. Please login with `railway login`',
        }),
        vercelCli: async (args) => {
          if (args[0] === 'whoami') {
            return { code: 0, stdout: 'user', stderr: '' };
          }
          if (args[0] === 'deploy') {
            return {
              code: 0,
              stdout: 'https://vybekiit-lw-v-unit.vercel.app',
              stderr: '',
            };
          }
          return { code: 1, stdout: '', stderr: args.join(' ') };
        },
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(result.provider).toBe('vercel');
    expect(result.url).toBe('https://vybekiit-lw-v-unit.vercel.app');
    expect(result.skipped).toEqual(['cloudflare', 'render', 'railway']);
  });
});
