import { parseGoogleOAuthArgs } from '@vybekiit/browser-automation/domains/google/cli';
import { googleEnvBlock } from '@vybekiit/browser-automation/domains/google/types';
import { describe, expect, it } from 'vitest';

describe('parseGoogleOAuthArgs', () => {
  it('parses all flags including repeatable --redirect and --js-origin', () => {
    const { params, missing } = parseGoogleOAuthArgs([
      '--project=il-alg',
      '--app-name=il-alg',
      '--support-email=you@gmail.com',
      '--app-url=https://il-alg.com',
      '--redirect=https://il-alg.com/api/auth/callback/google',
      '--redirect=http://localhost:3000/api/auth/callback/google',
      '--js-origin=http://localhost:3000',
      '--js-origin=https://il-alg.com',
      '--logo=/tmp/consent-logo-120.png',
      '--scope=openid',
      '--scope=email',
      '--publish',
      '--reset-secret',
    ]);
    expect(missing).toEqual([]);
    expect(params.projectId).toBe('il-alg');
    expect(params.appName).toBe('il-alg');
    expect(params.supportEmail).toBe('you@gmail.com');
    expect(params.appUrl).toBe('https://il-alg.com');
    expect(params.redirectUris).toEqual([
      'https://il-alg.com/api/auth/callback/google',
      'http://localhost:3000/api/auth/callback/google',
    ]);
    expect(params.jsOrigins).toEqual(['http://localhost:3000', 'https://il-alg.com']);
    expect(params.logoPath).toBe('/tmp/consent-logo-120.png');
    expect(params.scopes).toEqual(['openid', 'email']);
    expect(params.publish).toBe(true);
    expect(params.resetSecret).toBe(true);
  });

  it('reports each missing required flag', () => {
    const { missing } = parseGoogleOAuthArgs(['--project=il-alg']);
    expect(missing).toEqual(['app-name', 'support-email', 'app-url', 'redirect']);
  });

  it('leaves privacy/terms undefined when not passed (verb defaults them)', () => {
    const { params } = parseGoogleOAuthArgs([
      '--project=p',
      '--app-name=a',
      '--support-email=e@e.com',
      '--app-url=https://x.com',
      '--redirect=https://x.com/cb',
    ]);
    expect(params.privacyUrl).toBeUndefined();
    expect(params.termsUrl).toBeUndefined();
    expect(params.scopes).toBeUndefined();
    expect(params.publish).toBeUndefined();
    expect(params.resetSecret).toBeUndefined();
    expect(params.jsOrigins).toBeUndefined();
  });
});

describe('googleEnvBlock', () => {
  it('omits secret when URI-only patch returned no clientSecret', () => {
    expect(
      googleEnvBlock({
        clientId: '123456789012-abc.apps.googleusercontent.com',
        projectId: 'p',
        reusedExisting: true,
        redirectsApplied: ['http://localhost:3000/cb'],
        originsApplied: ['http://localhost:3000'],
      }),
    ).toEqual({
      GOOGLE_CLIENT_ID: '123456789012-abc.apps.googleusercontent.com',
    });
  });

  it('includes secret after create or --reset-secret', () => {
    // biome-ignore lint/security/noSecrets: fixture shaped like Google secrets (not a real credential)
    const fixtureSecret = 'GOCSPX-testFixtureSecretValue01';
    expect(
      googleEnvBlock({
        clientId: '123456789012-abc.apps.googleusercontent.com',
        clientSecret: fixtureSecret,
        projectId: 'p',
        reusedExisting: false,
      }),
    ).toEqual({
      GOOGLE_CLIENT_ID: '123456789012-abc.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: fixtureSecret,
    });
  });
});
