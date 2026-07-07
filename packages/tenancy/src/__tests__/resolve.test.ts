import { it } from '@effect/vitest';
import { resolveTenancyProvider, resolveTenancyService } from '@vybekiit/tenancy/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

// "org_123" -> match
const localOrgIdPattern = /^org_/;

describe('resolveTenancyProvider', () => {
  it('creates org locally', async () => {
    const tenancy = resolveTenancyProvider({ TENANCY_PROVIDER: 'local' });
    const org = await Effect.runPromise(tenancy.createOrg('Team', 'owner-1'));
    expect(org.orgId).toMatch(localOrgIdPattern);
  });
});

describe('resolveTenancyService', () => {
  it.effect('creates org locally through the Effect resolver', () =>
    Effect.gen(function* () {
      const tenancy = yield* resolveTenancyService({ TENANCY_PROVIDER: 'local' });
      const org = yield* tenancy.createOrg('Team', 'owner-1');
      expect(org.orgId).toMatch(localOrgIdPattern);
    }),
  );

  it.effect('fails loud for an invalid tenancy provider config', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        resolveTenancyService({ TENANCY_PROVIDER: 'unknown-provider' }),
      );
      expect(error.code).toBe('TENANCY_CONFIG_INVALID');
      expect(error.message).toContain('TENANCY_PROVIDER');
    }),
  );
});
