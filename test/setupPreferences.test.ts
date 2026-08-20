import { describe, expect, it } from 'vitest';
import {
  formatSetupIntroduction,
  parseSetupPreferences,
  setupEnvironment,
} from '../src/commands/setupPreferences';

describe('parseSetupPreferences', () => {
  it('uses the supported default stack for unattended setup', () => {
    expect(parseSetupPreferences([])).toEqual({
      data: 'supabase',
      googleSignIn: false,
      hosting: 'cloudflare',
    });
  });

  it('accepts explicit provider and Google sign-in choices', () => {
    expect(
      parseSetupPreferences(['--hosting=railway', '--data=mongodb', '--google-sign-in']),
    ).toEqual({ data: 'mongodb', googleSignIn: true, hosting: 'railway' });
  });

  it('rejects provider names that the kit cannot use', () => {
    expect(() => parseSetupPreferences(['--hosting=unknown'])).toThrow(
      'Unsupported app home: unknown',
    );
    expect(() => parseSetupPreferences(['--data=unknown'])).toThrow(
      'Unsupported app memory: unknown',
    );
  });
});

describe('setupEnvironment', () => {
  it('pins one provider per concern without storing secrets', () => {
    expect(setupEnvironment({ data: 'neon', googleSignIn: false, hosting: 'vercel' })).toEqual({
      DATA_PROVIDER: 'neon',
      HOSTING_PROVIDER: 'vercel',
    });
  });
});

describe('formatSetupIntroduction', () => {
  it('explains the full first-run flow before setup makes changes', () => {
    const text = formatSetupIntroduction().join('\n');

    expect(text).toContain('choose where your app lives online');
    expect(text).toContain('reuse tools and sign-ins');
    expect(text).toContain('open your browser');
    expect(text).toContain('No paid services');
  });
});
