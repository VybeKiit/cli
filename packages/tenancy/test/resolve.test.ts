import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { resolveTenancyProvider } from '../src/resolve';

describe('resolveTenancyProvider', () => {
  it('creates org locally', async () => {
    const tenancy = resolveTenancyProvider({ TENANCY_PROVIDER: 'local' });
    const org = await Effect.runPromise(tenancy.createOrg('Team', 'owner-1'));
    expect(org.orgId).toMatch(/^org_/);
  });
});
