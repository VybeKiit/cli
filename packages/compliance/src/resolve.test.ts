import { it } from '@effect/vitest';
import { createComplianceFromEnv, resolveComplianceService } from '@vybekiit/compliance/resolve';
import { Effect } from 'effect';
import { describe, expect } from 'vitest';

describe('resolveComplianceService', () => {
  it.effect('resolves cookie consent config from Schema config', () =>
    Effect.gen(function* () {
      const compliance = yield* resolveComplianceService({ COOKIE_CONSENT_ENABLED: 'on' });
      expect(compliance.cookieConsentConfig().enabled).toBe(true);
    }),
  );

  it.effect('fails loud for invalid compliance provider config', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(resolveComplianceService({ COMPLIANCE_PROVIDER: 'remote' }));
      expect(error.code).toBe('COMPLIANCE_CONFIG_INVALID');
      expect(error.message).toContain('COMPLIANCE_PROVIDER');
    }),
  );
});

describe('legacy compliance resolver', () => {
  it('keeps the deprecated sync provider adapter working', () => {
    const compliance = createComplianceFromEnv({ COOKIE_CONSENT_ENABLED: 'off' });

    expect(compliance.name).toBe('local');
    expect(compliance.cookieConsentConfig().enabled).toBe(false);
  });
});
