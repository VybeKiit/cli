import { resolveComplianceProvider } from '@vybekiit/compliance/resolve';
import { describe, expect, it } from 'vitest';

describe('resolveComplianceProvider', () => {
  it('returns cookie consent config', () => {
    const compliance = resolveComplianceProvider({ COOKIE_CONSENT_ENABLED: 'on' });
    expect(compliance.cookieConsentConfig().enabled).toBe(true);
  });
});
