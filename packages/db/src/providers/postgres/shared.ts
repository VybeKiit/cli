import { failDb } from '@vybekiit/db/providerEffect';
import type { DataProviderCapabilities, DbError, DbRecord } from '@vybekiit/db/types';
import type { Effect } from 'effect';

export const POSTGRES_CAPABILITIES: DataProviderCapabilities = {
  upsert: true,
  idempotentInsert: true,
  fullTextSearch: true,
  bulkInsert: true,
  vectorSearch: true,
  transaction: false,
};

export const LOCAL_CAPABILITIES: DataProviderCapabilities = {
  upsert: true,
  idempotentInsert: true,
  fullTextSearch: true,
  bulkInsert: true,
  vectorSearch: false,
  transaction: false,
};

export const MINIMAL_CAPABILITIES: DataProviderCapabilities = {};

/**
 * Build a mutable column map from a record object.
 *
 * @param record - Vendor-neutral DB record.
 * @returns A shallow copy suitable for SQL insert/update helpers.
 * @example
 * const columns = recordToColumns({ id: '1', email: 'a@b.co' });
 */
export const recordToColumns = (record: DbRecord): Record<string, unknown> => ({ ...record });

/**
 * Build an Effect failure for an unsupported optional capability.
 *
 * @param capability - Optional capability name.
 * @returns A failed Effect with the shared unsupported code.
 * @example
 * const effect = unsupportedCapability('bulkInsert');
 */
export const unsupportedCapability = <T>(capability: string): Effect.Effect<T, DbError> =>
  failDb('unsupported', `This data adapter does not support ${capability}.`);
