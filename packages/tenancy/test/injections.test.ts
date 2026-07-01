import { describe, expect, it } from 'vitest';
import { ok, type Result } from '@vybekiit/core';
import type { DataProvider } from '@vybekiit/db';
import { resolveTenancyProvider } from '../src/resolve';

describe('resolveTenancyProvider injections', () => {
  it('uses injected data provider for better-auth tenancy', async () => {
    const inserts: unknown[] = [];
    const data = {
      capabilities: {},
      insert: async (_table: string, row: unknown) => {
        inserts.push(row);
        return ok(row);
      },
      get: async () => ok(null),
      query: async () => ok([]),
      remove: async () => ok(true),
      update: async () => ok({ id: 'x' }),
      name: 'local',
    } as DataProvider;

    const tenancy = resolveTenancyProvider(
      { TENANCY_PROVIDER: 'better-auth' },
      { dataProvider: data },
    );
    const result = await tenancy.createOrg('Team', 'owner-1');
    expect(result.ok).toBe(true);
    expect(inserts.length).toBe(1);
  });
});
