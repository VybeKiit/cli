import { describe, expect, it } from 'vitest';
import { parseLiveWorkDataFlags, publicLiveWorkDataResult } from '../src/commands/liveWorkDataCmd';

describe('parseLiveWorkDataFlags', () => {
  it('defaults to demo mode and pin enabled', () => {
    const flags = parseLiveWorkDataFlags([]);
    expect(flags.mode).toBe('demo');
    expect(flags.pin).toBe(true);
    expect(flags.preferExisting).toBe(true);
    expect(flags.error).toBeUndefined();
    expect(flags.vendor).toBeUndefined();
  });

  it('parses mode, vendor, no-pin, and fresh', () => {
    const flags = parseLiveWorkDataFlags(['--mode=buyer', '--vendor=neon', '--no-pin', '--fresh']);
    expect(flags.mode).toBe('buyer');
    expect(flags.vendor).toBe('neon');
    expect(flags.pin).toBe(false);
    expect(flags.preferExisting).toBe(false);
    expect(flags.error).toBeUndefined();
  });

  it('rejects unknown mode', () => {
    const flags = parseLiveWorkDataFlags(['--mode=staging']);
    expect(flags.error).toMatch(/Unknown mode/);
  });

  it('rejects unknown vendor', () => {
    const flags = parseLiveWorkDataFlags(['--vendor=mongodb']);
    expect(flags.error).toMatch(/Unknown vendor/);
  });
});

describe('publicLiveWorkDataResult', () => {
  it('never includes DATABASE_URL or other secret pin values', () => {
    const publicResult = publicLiveWorkDataResult(
      {
        provider: 'neon',
        databaseUrl: 'postgresql://secret/db',
        claimUrl: 'https://neon.new/claim/x',
        claimableId: 'db-1',
        ephemeral: true,
        hopped: true,
        fromProvider: 'supabase',
        skipped: ['supabase'],
        pin: {
          DATA_PROVIDER: 'neon',
          DATABASE_URL: 'postgresql://secret/db',
          PUBLIC_POSTGRES_CLAIM_URL: 'https://neon.new/claim/x',
          CLAIMABLE_POSTGRES_ID: 'db-1',
        },
        verified: true,
        buyerMessage: 'Your place that remembers things is ready on Neon.',
      },
      true,
    );

    const json = JSON.stringify(publicResult);
    expect(json).not.toContain('postgresql://');
    expect(json).not.toContain('secret');
    expect(publicResult.pinKeys).toEqual(
      expect.arrayContaining(['DATA_PROVIDER', 'DATABASE_URL', 'PUBLIC_POSTGRES_CLAIM_URL']),
    );
    expect(publicResult.pinned).toBe(true);
    expect(publicResult.provider).toBe('neon');
    expect(publicResult.claimableId).toBe('db-1');
    expect(publicResult.claimUrl).toBe('https://neon.new/claim/x');
    expect(publicResult.events.length).toBeGreaterThan(0);
    expect(JSON.stringify(publicResult.events)).not.toContain('postgresql://');
  });
});
