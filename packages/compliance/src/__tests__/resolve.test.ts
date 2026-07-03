import { describe, expect, it } from 'vitest';
import { resolveComplianceProvider } from '../resolve';

describe('resolveComplianceProvider', () => {
  it('returns cookie consent config', () => {
    const compliance = resolveComplianceProvider({ COOKIE_CONSENT_ENABLED: 'on' });
    expect(compliance.cookieConsentConfig().enabled).toBe(true);
  });
});
