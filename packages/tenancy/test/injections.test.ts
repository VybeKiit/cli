import { describe, expect, it } from 'vitest';
import { ok } from '@vybekiit/core';
import { resolveTenancyProvider } from '../src/resolve';

describe('resolveTenancyProvider injections', () => {
  it('uses injected data provider for better-auth tenancy', async () => {
    const inserts: unknown[] = [];
    const data = {
      insert: async (_table: string, row: unknown) => {
        inserts.push(row);
        return ok(row);
      },
      query: async () => ok([]),
      remove: async () => ok(true),
      update: async () => ok(undefined),
      name: 'local' as const,
    };

    const tenancy = resolveTenancyProvider(
      { TENANCY_PROVIDER: 'better-auth' },
      { dataProvider: data },
    );
    const result = await tenancy.createOrg('Team', 'owner-1');
    expect(result.ok).toBe(true);
    expect(inserts.length).toBe(1);
  });
});
