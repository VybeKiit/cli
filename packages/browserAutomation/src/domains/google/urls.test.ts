import {
  audienceUrl,
  clientDetailUrl,
  clientsUrl,
  consentCreateUrl,
  consentUrl,
  createClientUrl,
  dataAccessUrl,
} from '@vybekiit/browser-automation/domains/google/urls';
import { describe, expect, it } from 'vitest';

describe('google console urls', () => {
  it('scopes the consent screen to the project', () => {
    expect(consentUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/branding?project=il-alg',
    );
  });

  it('builds the first-run consent wizard url', () => {
    expect(consentCreateUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/overview/create?project=il-alg',
    );
  });

  it('builds a client detail url with the client id in the path', () => {
    expect(clientDetailUrl('il-alg', '123-abc.apps.googleusercontent.com')).toBe(
      'https://console.cloud.google.com/auth/clients/123-abc.apps.googleusercontent.com?project=il-alg',
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

  it('builds the data-access (scopes) url', () => {
    expect(dataAccessUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/scopes?project=il-alg',
    );
  });

  it('builds the audience (publishing status) url', () => {
    expect(audienceUrl('il-alg')).toBe(
      'https://console.cloud.google.com/auth/audience?project=il-alg',
    );
  });

  it('encodes project ids with reserved characters', () => {
    expect(consentUrl('my project')).toContain('project=my%20project');
  });
});
