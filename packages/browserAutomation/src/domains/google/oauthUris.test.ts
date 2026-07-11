import {
  mergeOAuthUris,
  normalizeOAuthUri,
  originFromRedirect,
  originsFromRedirects,
  resolveJsOrigins,
} from '@vybekiit/browser-automation/domains/google/oauthUris';
import { describe, expect, it } from 'vitest';

describe('normalizeOAuthUri', () => {
  it('strips trailing slashes and whitespace', () => {
    expect(normalizeOAuthUri('  http://localhost:3000/  ')).toBe('http://localhost:3000');
    expect(normalizeOAuthUri('https://replybase.dev/api/auth/callback/google/')).toBe(
      'https://replybase.dev/api/auth/callback/google',
    );
  });

  it('returns empty for blank input', () => {
    expect(normalizeOAuthUri('   ')).toBe('');
  });
});

describe('originFromRedirect', () => {
  it('extracts scheme host and port', () => {
    expect(originFromRedirect('http://localhost:3000/api/auth/callback/google')).toBe(
      'http://localhost:3000',
    );
    expect(originFromRedirect('https://www.replybase.dev/api/auth/callback/google')).toBe(
      'https://www.replybase.dev',
    );
  });

  it('returns null for garbage', () => {
    expect(originFromRedirect('not-a-url')).toBeNull();
  });
});

describe('originsFromRedirects', () => {
  it('dedupes origins while preserving order', () => {
    expect(
      originsFromRedirects([
        'https://replybase.dev/api/auth/callback/google',
        'https://www.replybase.dev/api/auth/callback/google',
        'http://localhost:3000/api/auth/callback/google',
        'http://localhost:3000/other',
      ]),
    ).toEqual(['https://replybase.dev', 'https://www.replybase.dev', 'http://localhost:3000']);
  });
});

describe('mergeOAuthUris', () => {
  it('unions without duplicates after normalize', () => {
    expect(
      mergeOAuthUris(
        ['https://replybase.dev/api/auth/callback/google/'],
        [
          'https://replybase.dev/api/auth/callback/google',
          'http://localhost:3000/api/auth/callback/google',
        ],
      ),
    ).toEqual([
      'https://replybase.dev/api/auth/callback/google',
      'http://localhost:3000/api/auth/callback/google',
    ]);
  });

  it('skips empty strings', () => {
    expect(mergeOAuthUris([''], ['http://localhost:3000/cb', '  '])).toEqual([
      'http://localhost:3000/cb',
    ]);
  });
});

describe('resolveJsOrigins', () => {
  it('prefers explicit origins when provided', () => {
    expect(
      resolveJsOrigins(
        ['https://app.example/cb'],
        ['http://localhost:3000', 'https://app.example'],
      ),
    ).toEqual(['http://localhost:3000', 'https://app.example']);
  });

  it('derives from redirects when explicit list is empty or omitted', () => {
    const redirects = [
      'https://replybase.dev/api/auth/callback/google',
      'http://localhost:3000/api/auth/callback/google',
    ];
    expect(resolveJsOrigins(redirects)).toEqual(['https://replybase.dev', 'http://localhost:3000']);
    expect(resolveJsOrigins(redirects, [])).toEqual([
      'https://replybase.dev',
      'http://localhost:3000',
    ]);
  });
});
