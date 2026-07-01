import { type Result, fail } from '@vybekiit/core';
import type { DataProviderCapabilities, DbRecord } from '../../types';

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

/** Build column map from a record object. */
export function recordToColumns(record: DbRecord): Record<string, unknown> {
  return { ...record };
}

export function unsupportedCapability<T>(capability: string): Result<T> {
  return fail('unsupported', `This data adapter does not support ${capability}.`);
}
