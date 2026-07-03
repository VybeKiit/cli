import {
  clientsUrl,
  consentUrl,
  createClientUrl,
} from '@vybekiit/browserAutomation/domains/google/urls';
import { describe, expect, it } from 'vitest';

describe('google console urls', () => {
  it('scopes the consent screen to the project', () => {
    expect(consentUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/branding?project=il-alg',
    );
  });

  it('scopes the clients list to the project', () => {
    expect(clientsUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/clients?project=il-alg',
    );
  });

  it('builds the create-client url', () => {
    expect(createClientUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/clients/create?project=il-alg',
    );
  });

  it('encodes project ids with reserved characters', () => {
    expect(consentUrl('my project')).toContain('project=my%20project');
  });
});
