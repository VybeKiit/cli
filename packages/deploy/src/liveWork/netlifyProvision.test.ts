import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Effect, Exit } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  collectStaticFiles,
  createNetlifyHost,
  firstNonEmptyString,
  sha1Hex,
} from './netlifyProvision';

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect);
const runExit = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromiseExit(effect);

describe('collectStaticFiles / sha1Hex', () => {
  it('walks a tiny site and hashes bytes', () => {
    const dir = join(tmpdir(), `vybekiit-nl-files-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<h1>ok</h1>', 'utf8');
    const files = collectStaticFiles(dir);
    expect(files.get('/index.html')?.toString('utf8')).toBe('<h1>ok</h1>');
    expect(sha1Hex(Buffer.from('a'))).toHaveLength(40);
  });
});

describe('firstNonEmptyString', () => {
  it('picks the first usable string without nested ternaries', () => {
    expect(firstNonEmptyString(undefined, '', 'https://a.netlify.app')).toBe(
      'https://a.netlify.app',
    );
    expect(firstNonEmptyString(null, 1, '')).toBeNull();
  });
});

describe('createNetlifyHost', () => {
  it('uses createSite seam and verifies URL', async () => {
    const provisioned = await run(
      createNetlifyHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-nl-test',
        env: { NETLIFY_AUTH_TOKEN: 'test-token' },
        createSite: async ({ name }) => ({
          siteId: `site-${name}`,
          url: `https://${name}.netlify.app`,
        }),
        fetchImpl: async () => new Response('ok', { status: 200 }),
      }),
    );

    expect(provisioned.provider).toBe('netlify');
    expect(provisioned.url).toBe('https://vybekiit-lw-nl-test.netlify.app');
    expect(provisioned.projectId).toBe('site-vybekiit-lw-nl-test');
  });

  it('missing token → missing_credentials', async () => {
    const exit = await runExit(
      createNetlifyHost({
        mode: 'demo',
        env: {},
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(String(exit.cause)).toMatch(/netlify_missing_token|NETLIFY_AUTH_TOKEN|missing/i);
    }
  });

  it('live path creates site + file-digest deploy', async () => {
    const dir = join(tmpdir(), `vybekiit-nl-live-${Date.now()}`, 'site');
    mkdirSync(dir, { recursive: true });
    const html = '<!doctype html><h1>Live work host OK</h1>';
    writeFileSync(join(dir, 'index.html'), html, 'utf8');
    const hash = sha1Hex(Buffer.from(html, 'utf8'));
    const puts: string[] = [];

    const provisioned = await run(
      createNetlifyHost({
        mode: 'demo',
        projectName: 'vybekiit-lw-nl-api',
        buildDir: dir,
        env: { NETLIFY_AUTH_TOKEN: 'key' },
        fetchImpl: async (url, init) => {
          const href = String(url);
          if (href.endsWith('/api/v1/sites') && init?.method === 'POST') {
            return new Response(
              JSON.stringify({
                id: 'site-abc',
                ssl_url: 'https://vybekiit-lw-nl-api.netlify.app',
              }),
              { status: 201 },
            );
          }
          if (href.includes('/sites/site-abc/deploys') && init?.method === 'POST') {
            return new Response(
              JSON.stringify({
                id: 'deploy-1',
                required: [hash],
                ssl_url: 'https://vybekiit-lw-nl-api.netlify.app',
                state: 'uploading',
              }),
              { status: 200 },
            );
          }
          if (href.includes('/deploys/deploy-1/files/') && init?.method === 'PUT') {
            puts.push(href);
            return new Response('', { status: 200 });
          }
          if (
            href.includes('/deploys/deploy-1') &&
            (init?.method === 'GET' || init?.method === undefined)
          ) {
            return new Response(
              JSON.stringify({
                id: 'deploy-1',
                state: 'ready',
                ssl_url: 'https://vybekiit-lw-nl-api.netlify.app',
              }),
              { status: 200 },
            );
          }
          return new Response('ok', { status: 200 });
        },
      }),
    );

    expect(provisioned.projectId).toBe('site-abc');
    expect(provisioned.url).toBe('https://vybekiit-lw-nl-api.netlify.app');
    expect(puts.some((u) => u.includes('/files/index.html'))).toBe(true);
    expect(hash).toHaveLength(40);
  });
});
