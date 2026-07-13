import { Effect } from 'effect';
import type { OrphanHandle } from './types';

/**
 * Outcome of best-effort orphan cleanup (ADR-0039). Never throws into the ladder.
 */
export type OrphanCleanupResult = {
  readonly provider: OrphanHandle['provider'];
  readonly cleaned: boolean;
  /** How cleanup was handled. */
  readonly method: 'ttl' | 'deleted' | 'noop' | 'skipped';
  readonly note?: string;
};

/**
 * Best-effort cleanup for a partial data resource left after hop or failed verify.
 *
 * Claimable Neon has no public delete API — unclaimed DBs expire (~72h TTL), so
 * cleanup records `ttl` rather than failing the run. Account-backed deletes land
 * with provider adapters later.
 *
 * @param orphan - Handle describing the left-behind resource (no secrets required).
 * @returns Always-succeeding Effect with cleanup outcome for logs / tests.
 * @example
 * await Effect.runPromise(
 *   cleanupOrphanData({ provider: 'neon', ephemeral: true, claimableId: 'x' }),
 * );
 */
export const cleanupOrphanData = (
  orphan: OrphanHandle,
): Effect.Effect<OrphanCleanupResult, never> =>
  Effect.sync(() => {
    if (orphan.provider === 'neon' && orphan.ephemeral) {
      const note =
        orphan.note ??
        (orphan.claimableId === undefined
          ? 'ephemeral neon expires via neon.new TTL'
          : `claimable ${orphan.claimableId} expires via neon.new TTL`);
      return {
        provider: orphan.provider,
        cleaned: true,
        method: 'ttl' as const,
        note,
      };
    }

    if (orphan.ephemeral) {
      return {
        provider: orphan.provider,
        cleaned: false,
        method: 'noop' as const,
        note: orphan.note ?? 'no delete adapter for ephemeral orphan yet',
      };
    }

    return {
      provider: orphan.provider,
      cleaned: false,
      method: 'skipped' as const,
      note: orphan.note ?? 'non-ephemeral orphan left for builder/doctor',
    };
  });

/**
 * Run cleanup for zero or more orphans; failures never surface (best-effort).
 *
 * @param orphans - Handles collected during a ladder walk.
 * @returns Effect of all cleanup outcomes (same length as input).
 * @example
 * const results = await Effect.runPromise(cleanupOrphans([orphan]));
 */
export const cleanupOrphans = (
  orphans: readonly OrphanHandle[],
): Effect.Effect<readonly OrphanCleanupResult[], never> =>
  Effect.forEach(orphans, (orphan) => cleanupOrphanData(orphan), {
    concurrency: 1,
  });

/**
 * Build an {@link OrphanHandle} from provisioned data without copying secrets.
 *
 * @param provisioned - Resource that may be left behind.
 * @param note - Optional safe log note.
 * @returns Orphan handle suitable for {@link cleanupOrphanData}.
 * @example
 * orphanFromProvisioned({ provider: 'neon', ephemeral: true, claimableId: 'a' });
 */
export const orphanFromProvisioned = (
  provisioned: {
    readonly provider: OrphanHandle['provider'];
    readonly ephemeral: boolean;
    readonly claimableId?: string;
  },
  note?: string,
): OrphanHandle => {
  const handle: {
    provider: OrphanHandle['provider'];
    ephemeral: boolean;
    claimableId?: string;
    note?: string;
  } = {
    provider: provisioned.provider,
    ephemeral: provisioned.ephemeral,
  };
  if (typeof provisioned.claimableId === 'string' && provisioned.claimableId.length > 0) {
    handle.claimableId = provisioned.claimableId;
  }
  if (typeof note === 'string' && note.length > 0) {
    handle.note = note;
  }
  return handle;
};
