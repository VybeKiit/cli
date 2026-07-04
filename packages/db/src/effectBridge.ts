import { makeResultLifter, type Result } from '@vybekiit/core';
import { Effect } from 'effect';
import {
  type DataProvider,
  type DataProviderCapabilities,
  type DataProviderName,
  DbError,
  type DbRecord,
  type QueryFilter,
  type StorageProvider,
  type StorageProviderName,
} from './types';

/** Lift db adapter bodies into `Effect`, binding the shared core lifter to {@link DbError}. */
const { fromResultPromise } = makeResultLifter((failure) => new DbError(failure));

/** A tagged failure for an optional operation the active backend doesn't implement. */
const unsupported = (op: string): DbError =>
  new DbError({ code: 'unsupported', message: `${op} is not supported by this backend.` });

/**
 * The internal, `Result`-returning shape a data adapter builds. {@link toEffectDataProvider}
 * lifts it to the Effect {@link DataProvider} the interface exposes (ADR-0023), so every
 * adapter body stays proven and byte-identical behind this one seam. Both this file and
 * `Result` retire in Slice 8.
 */
export interface DataProviderResult {
  readonly name: DataProviderName;
  readonly capabilities: DataProviderCapabilities;
  insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>>;
  get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>>;
  query<T extends DbRecord>(collection: string, filter: QueryFilter<T>): Promise<Result<T[]>>;
  update<T extends DbRecord>(
    collection: string,
    id: string,
    patch: Partial<Omit<T, 'id'>>,
  ): Promise<Result<T>>;
  remove(collection: string, id: string): Promise<Result<true>>;
  upsert?<T extends DbRecord>(
    collection: string,
    record: T,
    conflictKey: keyof T & string,
  ): Promise<Result<T>>;
  idempotentInsert?<T extends DbRecord>(
    collection: string,
    record: T,
    dedupeKey: keyof T & string,
  ): Promise<Result<T>>;
  fullTextSearch?<T extends DbRecord>(
    collection: string,
    query: string,
    limit: number,
  ): Promise<Result<T[]>>;
  bulkInsert?<T extends DbRecord>(collection: string, records: readonly T[]): Promise<Result<T[]>>;
}

/**
 * Wrap a {@link DataProviderResult} as the public {@link DataProvider}. Required methods
 * lift 1:1 through the shared core lifter; the four optional methods lift when the adapter
 * provides them, else return a tagged `unsupported` failure. Consumers gate on
 * {@link DataProvider.capabilities} before calling an optional method.
 */
export function toEffectDataProvider(impl: DataProviderResult): DataProvider {
  const provider: DataProvider = {
    name: impl.name,
    capabilities: impl.capabilities,
    insert(collection, record) {
      return fromResultPromise(impl.insert(collection, record));
    },
    get(collection, id) {
      return fromResultPromise(impl.get(collection, id));
    },
    query(collection, filter) {
      return fromResultPromise(impl.query(collection, filter));
    },
    update(collection, id, patch) {
      return fromResultPromise(impl.update(collection, id, patch));
    },
    remove(collection, id) {
      return fromResultPromise(impl.remove(collection, id));
    },
    upsert(collection, record, conflictKey) {
      const method = impl.upsert;
      return method
        ? fromResultPromise(method(collection, record, conflictKey))
        : Effect.fail(unsupported('upsert'));
    },
    idempotentInsert(collection, record, dedupeKey) {
      const method = impl.idempotentInsert;
      return method
        ? fromResultPromise(method(collection, record, dedupeKey))
        : Effect.fail(unsupported('idempotentInsert'));
    },
    fullTextSearch(collection, query, limit) {
      const method = impl.fullTextSearch;
      return method
        ? fromResultPromise(method(collection, query, limit))
        : Effect.fail(unsupported('fullTextSearch'));
    },
    bulkInsert(collection, records) {
      const method = impl.bulkInsert;
      return method
        ? fromResultPromise(method(collection, records))
        : Effect.fail(unsupported('bulkInsert'));
    },
  };
  return provider;
}

/** The internal, `Result`-returning shape a storage adapter builds. */
export interface StorageProviderResult {
  readonly name: StorageProviderName;
  upload(
    bucket: string,
    key: string,
    data: Uint8Array,
    contentType?: string,
  ): Promise<Result<{ key: string }>>;
  getUrl(bucket: string, key: string): Promise<Result<{ url: string }>>;
  remove(bucket: string, key: string): Promise<Result<true>>;
}

/** Wrap a {@link StorageProviderResult} as the public {@link StorageProvider}. */
export function toEffectStorageProvider(impl: StorageProviderResult): StorageProvider {
  return {
    name: impl.name,
    upload: (bucket, key, data, contentType) =>
      fromResultPromise(impl.upload(bucket, key, data, contentType)),
    getUrl: (bucket, key) => fromResultPromise(impl.getUrl(bucket, key)),
    remove: (bucket, key) => fromResultPromise(impl.remove(bucket, key)),
  };
}
