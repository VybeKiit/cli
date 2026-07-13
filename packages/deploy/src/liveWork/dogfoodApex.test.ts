import { describe, expect, it } from 'vitest';
import {
  buildDogfoodHostname,
  DOGFOOD_APEX_POOL,
  isAllowedDogfoodApex,
  isDogfoodSubdomainHostname,
  parseDogfoodApex,
  resolveDogfoodApex,
  sanitizeDogfoodLabel,
} from './dogfoodApex';

describe('DOGFOOD_APEX pool', () => {
  it('lists the three allowed apices (ADR-0039)', () => {
    expect([...DOGFOOD_APEX_POOL]).toEqual(['yosefhayimsabag.dev', 'askally.io', 'ohadbaher.net']);
  });

  it('accepts only pool members (case-insensitive)', () => {
    expect(isAllowedDogfoodApex('yosefhayimsabag.dev')).toBe(true);
    expect(isAllowedDogfoodApex('AskAlly.IO')).toBe(true);
    expect(isAllowedDogfoodApex('evil.com')).toBe(false);
    expect(isAllowedDogfoodApex('')).toBe(false);
  });

  it('parses bare apex and strips accidental scheme/path', () => {
    expect(parseDogfoodApex('yosefhayimsabag.dev')).toBe('yosefhayimsabag.dev');
    expect(parseDogfoodApex('https://askally.io/')).toBe('askally.io');
    expect(parseDogfoodApex('https://www.ohadbaher.net')).toBe('ohadbaher.net');
    expect(parseDogfoodApex('not-a-pool.example')).toBe(null);
  });
});

describe('resolveDogfoodApex', () => {
  it('reads DOGFOOD_APEX from env when in pool', () => {
    expect(resolveDogfoodApex({ DOGFOOD_APEX: 'askally.io' })).toBe('askally.io');
  });

  it('returns null when unset or not allowed', () => {
    expect(resolveDogfoodApex({})).toBe(null);
    expect(resolveDogfoodApex({ DOGFOOD_APEX: 'production.example' })).toBe(null);
  });
});

describe('dogfood subdomain-only hostnames', () => {
  it('builds live-<label>.apex and never the bare apex', () => {
    expect(buildDogfoodHostname('yosefhayimsabag.dev', 'run42')).toBe(
      'live-run42.yosefhayimsabag.dev',
    );
    expect(buildDogfoodHostname('askally.io', 'abc')).not.toBe('askally.io');
  });

  it('sanitizes labels to DNS-safe lower segments', () => {
    expect(sanitizeDogfoodLabel('My Run_01!!')).toBe('my-run-01');
    expect(sanitizeDogfoodLabel('')).toMatch(/^run-/);
  });

  it('accepts subdomains under the apex only', () => {
    expect(isDogfoodSubdomainHostname('live-x.askally.io', 'askally.io')).toBe(true);
    expect(isDogfoodSubdomainHostname('deep.live.askally.io', 'askally.io')).toBe(true);
  });

  it('rejects bare apex, www apex, and foreign hosts', () => {
    expect(isDogfoodSubdomainHostname('askally.io', 'askally.io')).toBe(false);
    expect(isDogfoodSubdomainHostname('www.askally.io', 'askally.io')).toBe(false);
    expect(isDogfoodSubdomainHostname('live-x.evil.com', 'askally.io')).toBe(false);
    expect(isDogfoodSubdomainHostname('askally.io.evil.com', 'askally.io')).toBe(false);
  });

  it('built hostname always passes subdomain guard', () => {
    for (const apex of DOGFOOD_APEX_POOL) {
      const host = buildDogfoodHostname(apex, 'ci-1');
      expect(isDogfoodSubdomainHostname(host, apex)).toBe(true);
      expect(host).not.toBe(apex);
      expect(host.startsWith('live-')).toBe(true);
    }
  });
});
