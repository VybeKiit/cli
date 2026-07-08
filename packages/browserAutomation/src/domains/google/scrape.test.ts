import {
  isValidClientId,
  isValidClientSecret,
  parseClientId,
  parseClientSecret,
  validateGoogleCredentials,
} from '@vybekiit/browser-automation/domains/google/scrape';
import { describe, expect, it } from 'vitest';

const CLIENT_ID = '123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com';
const CLIENT_SECRET = 'GOCSPX-aB1cD2eF3gH4iJ5kL6mN7oP8';

describe('google scrape', () => {
  it('parses the client id from dialog html', () => {
    const html = `<div>Your Client ID</div><code>${CLIENT_ID}</code>`;
    expect(parseClientId(html)).toBe(CLIENT_ID);
  });

  it('parses the client secret from dialog html', () => {
    const html = `<span>Client secret</span><input value="${CLIENT_SECRET}" />`;
    expect(parseClientSecret(html)).toBe(CLIENT_SECRET);
  });

  it('returns null when absent', () => {
    expect(parseClientId('<div>nothing here</div>')).toBeNull();
    expect(parseClientSecret('<div>nothing here</div>')).toBeNull();
  });

  it('validates well-formed credentials', () => {
    expect(isValidClientId(CLIENT_ID)).toBe(true);
    expect(isValidClientSecret(CLIENT_SECRET)).toBe(true);
    expect(validateGoogleCredentials(CLIENT_ID, CLIENT_SECRET)).toBe(true);
  });

  it('rejects malformed credentials', () => {
    expect(isValidClientId('not-a-client-id')).toBe(false);
    expect(isValidClientSecret('plain-secret')).toBe(false);
    expect(validateGoogleCredentials(CLIENT_ID, 'plain-secret')).toBe(false);
  });
});
