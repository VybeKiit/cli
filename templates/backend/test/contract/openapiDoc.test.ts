import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_ROUTES, buildOpenApiDocument } from '../../src/contract.js';

/**
 * Guards the generated API contract (ADR-0043): the OpenAPI 3.1 document derives
 * from the route registry, and the committed `openapi.json` must stay in sync with
 * it. If this fails after adding or changing a route, run `pnpm gen:contract`.
 */

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readPackageMeta = async (): Promise<{ readonly title: string; readonly version: string }> => {
  const raw = await readFile(join(backendRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as { readonly name?: string; readonly version?: string };
  return { title: pkg.name ?? 'vybekiit-backend', version: pkg.version ?? '0.0.0' };
};

describe('backend OpenAPI contract', () => {
  it('emits an OpenAPI 3.1 document covering every registered route', async () => {
    const doc = buildOpenApiDocument(await readPackageMeta());
    expect(doc.openapi).toBe('3.1.0');

    const emitted = new Set<string>();
    for (const [path, item] of Object.entries(doc.paths)) {
      for (const method of Object.keys(item)) {
        emitted.add(`${method.toUpperCase()} ${path}`);
      }
    }
    for (const route of APP_ROUTES) {
      expect(emitted).toContain(`${route.method} ${route.path}`);
    }
  });

  it('keeps the committed openapi.json in sync (run `pnpm gen:contract`)', async () => {
    const committed = JSON.parse(await readFile(join(backendRoot, 'openapi.json'), 'utf8'));
    const rebuilt = buildOpenApiDocument(await readPackageMeta());
    expect(committed).toEqual(rebuilt);
  });
});
