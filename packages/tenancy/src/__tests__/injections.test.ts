import type { DataProvider } from '@vybekiit/db';
import { resolveTenancyProvider } from '@vybekiit/tenancy/resolve';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

describe('resolveTenancyProvider injections', () => {
  it('uses injected data provider for better-auth tenancy', async () => {
    const inserts: unknown[] = [];
    const data = {
      capabilities: {},
      insert: (_table: string, row: unknown) => {
        inserts.push(row);
        return Effect.succeed(row);
      },
      get: () => Effect.succeed(null),
      query: () => Effect.succeed([]),
      remove: () => Effect.succeed(true as const),
      update: () => Effect.succeed({ id: 'x' }),
      name: 'local',
    } as unknown as DataProvider;

    const tenancy = resolveTenancyProvider(
      { TENANCY_PROVIDER: 'better-auth' },
      { dataProvider: data },
    );
    await Effect.runPromise(tenancy.createOrg('Team', 'owner-1'));
    expect(inserts.length).toBe(1);
  });
});
