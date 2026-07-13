import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { cleanupOrphanData, cleanupOrphans, orphanFromProvisioned } from './orphanCleanup';

const run = <A>(effect: Effect.Effect<A, never>): Promise<A> => Effect.runPromise(effect);

describe('orphanFromProvisioned', () => {
  it('copies only safe fields (no secrets)', () => {
    expect(
      orphanFromProvisioned(
        { provider: 'neon', ephemeral: true, claimableId: 'db-1' },
        'left after hop',
      ),
    ).toEqual({
      provider: 'neon',
      ephemeral: true,
      claimableId: 'db-1',
      note: 'left after hop',
    });
  });
});

describe('cleanupOrphanData', () => {
  it('marks claimable neon as cleaned via TTL (no delete API)', async () => {
    const result = await run(
      cleanupOrphanData({
        provider: 'neon',
        ephemeral: true,
        claimableId: 'db-1',
      }),
    );
    expect(result).toMatchObject({
      provider: 'neon',
      cleaned: true,
      method: 'ttl',
    });
    expect(result.note).toContain('TTL');
  });

  it('skips non-ephemeral orphans without deleting', async () => {
    const result = await run(
      cleanupOrphanData({
        provider: 'railway',
        ephemeral: false,
      }),
    );
    expect(result.cleaned).toBe(false);
    expect(result.method).toBe('skipped');
  });
});

describe('cleanupOrphans', () => {
  it('runs each orphan in order', async () => {
    const results = await run(
      cleanupOrphans([
        { provider: 'neon', ephemeral: true, claimableId: 'a' },
        { provider: 'supabase', ephemeral: false },
      ]),
    );
    expect(results).toHaveLength(2);
    expect(results[0]?.method).toBe('ttl');
    expect(results[1]?.method).toBe('skipped');
  });
});
