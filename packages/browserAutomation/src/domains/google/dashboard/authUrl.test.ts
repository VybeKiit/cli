import { isGoogleAuthenticatedUrl } from '@vybekiit/browserAutomation/domains/google/dashboard/authUrl';
import { describe, expect, it } from 'vitest';

describe('isGoogleAuthenticatedUrl', () => {
  it('accepts a signed-in console page', () => {
    expect(
      isGoogleAuthenticatedUrl('https://console.cloud.google.com/auth/clients?project=il-alg'),
    ).toBe(true);
  });

  it('rejects the accounts sign-in flow', () => {
    expect(isGoogleAuthenticatedUrl('https://accounts.google.com/signin/v2/identifier')).toBe(
      false,
    );
  });

  it('rejects a console oauth/signin redirect', () => {
    expect(isGoogleAuthenticatedUrl('https://console.cloud.google.com/signin/oauth?foo=bar')).toBe(
      false,
    );
  });

  it('rejects non-console hosts', () => {
    expect(isGoogleAuthenticatedUrl('https://example.com')).toBe(false);
  });
});
