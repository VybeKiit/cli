import { fail, ok, type Result } from '@vybekiit/core';
import { type DataProviderResult, toEffectDataProvider } from '@vybekiit/db/effectBridge';
import { LOCAL_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import type { DataProvider, DbRecord, QueryFilter } from '@vybekiit/db/types';

/**
 * A stored row: a {@link DbRecord} widened with a string index signature. Each
 * collection holds a different `T extends DbRecord` at runtime, so — exactly like
 * the Supabase/Mongo adapters wrap an untyped driver row — the store keeps a single
 * indexable shape and the methods cast to the caller's `T` at the boundary. The
 * index signature lets {@link DataProvider.query} compare arbitrary filter fields
 * without a misleading `keyof DbRecord` cast.
 */
type StoredRecord = DbRecord & Record<string, unknown>;

/**
 * In-memory store: collection name → (record id → row). One `Map` per process, so
 * data is shared across calls within a single `pnpm dev`/test run and discarded on
 * restart — the deliberate "this is temporary, wire a real backend" signal of the
 * local adapter (ADR-0008). Rows are stored as fresh copies, so reads never alias
 * what a caller holds.
 */
type Store = Map<string, Map<string, StoredRecord>>;

/**
 * Return a fresh copy of a stored row as the caller's record type `T`.
 *
 * The store can't statically know each collection's `T` (it holds one widened
 * {@link StoredRecord} shape), so reads cross the same boundary the real adapters do
 * when they cast an untyped driver row to `T` — here through `unknown` because the
 * index signature doesn't directly overlap `T`. Copying first means the returned
 * object never aliases the stored one, so a caller mutating it can't corrupt state.
 */
function asRecord<T extends DbRecord>(row: StoredRecord): T {
  return { ...row } as unknown as T;
}

/**
 * Build the zero-config {@link DataProvider} — VybeKiit's in-memory dev fallback
 * (ADR-0008). It takes no config and no dependencies: a freshly scaffolded app with
 * no `.env` resolves to this so the first `pnpm dev` runs, and it doubles as the
 * network-free contract-conformance fixture for the {@link DataProvider} interface.
 *
 * Semantics mirror the real adapters so call sites and skills behave identically:
 * `insert` generates an id (via `crypto.randomUUID()`) when the record's `id` is
 * empty/falsy; `query` matches on exact equality across every listed field (AND);
 * `get` resolves `ok(null)` when nothing matches; `update`/`remove` of an unknown
 * id `fail('not_found', ...)`. Data lives only for the life of the process.
 */
export function createLocalDataProvider(): DataProvider {
  const store: Store = new Map();

  /** The collection's row map, created on first touch. */
  const collectionOf = (collection: string): Map<string, StoredRecord> => {
    let rows = store.get(collection);
    if (!rows) {
      rows = new Map();
      store.set(collection, rows);
    }
    return rows;
  };

  const impl: DataProviderResult = {
    name: 'local',
    capabilities: LOCAL_CAPABILITIES,

    insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      // Mirror a real backend assigning a primary key when the caller omits one.
      const id = record.id || crypto.randomUUID();
      // The store widens each `T` to one indexable shape; this is the only place a
      // row enters the store, so the widening cast lives here, once.
      const stored = { ...record, id } as StoredRecord;
      collectionOf(collection).set(id, stored);
      return Promise.resolve(ok(asRecord<T>(stored)));
    },

    get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      const row = collectionOf(collection).get(id);
      return Promise.resolve(ok(row ? asRecord<T>(row) : null));
    },

    query<T extends DbRecord>(collection: string, filter: QueryFilter<T>): Promise<Result<T[]>> {
      const fields = Object.entries(filter);
      const matches = [...collectionOf(collection).values()]
        .filter((row) => fields.every(([key, value]) => row[key] === value))
        .map((row) => asRecord<T>(row));
      return Promise.resolve(ok(matches));
    },

    update<T extends DbRecord>(
      collection: string,
      id: string,
      patch: Partial<Omit<T, 'id'>>,
    ): Promise<Result<T>> {
      const rows = collectionOf(collection);
      const existing = rows.get(id);
      if (!existing) return Promise.resolve(fail('not_found', `No record ${id} in ${collection}.`));
      // `id` is fixed: `patch` cannot carry it (Omit<T,'id'>), so it can't be overwritten.
      const updated = { ...existing, ...patch, id } as StoredRecord;
      rows.set(id, updated);
      return Promise.resolve(ok(asRecord<T>(updated)));
    },

    remove(collection: string, id: string): Promise<Result<true>> {
      const removed = collectionOf(collection).delete(id);
      if (!removed) return Promise.resolve(fail('not_found', `No record ${id} in ${collection}.`));
      return Promise.resolve(ok(true));
    },

    async upsert<T extends DbRecord>(
      collection: string,
      record: T,
      conflictKey: keyof T & string,
    ): Promise<Result<T>> {
      const rows = [...collectionOf(collection).values()];
      const existing = rows.find((row) => row[conflictKey] === record[conflictKey]);
      if (existing) {
        const updated = { ...existing, ...record, id: existing.id } as StoredRecord;
        collectionOf(collection).set(existing.id, updated);
        return ok(asRecord<T>(updated));
      }
      const id = record.id || crypto.randomUUID();
      const stored = { ...record, id } as StoredRecord;
      collectionOf(collection).set(id, stored);
      return ok(asRecord<T>(stored));
    },

    async idempotentInsert<T extends DbRecord>(
      collection: string,
      record: T,
      dedupeKey: keyof T & string,
    ): Promise<Result<T>> {
      const rows = [...collectionOf(collection).values()];
      const existing = rows.find((row) => row[dedupeKey] === record[dedupeKey]);
      if (existing) return ok(asRecord<T>(existing));
      const id = record.id || crypto.randomUUID();
      const stored = { ...record, id } as StoredRecord;
      collectionOf(collection).set(id, stored);
      return ok(asRecord<T>(stored));
    },

    async fullTextSearch<T extends DbRecord>(
      collection: string,
      query: string,
      _limit: number,
    ): Promise<Result<T[]>> {
      const needle = query.toLowerCase();
      const matches = [...collectionOf(collection).values()]
        .filter((row) => {
          const content = row.content;
          return typeof content === 'string' && content.toLowerCase().includes(needle);
        })
        .map((row) => asRecord<T>(row));
      return Promise.resolve(ok(matches));
    },

    async bulkInsert<T extends DbRecord>(
      collection: string,
      records: readonly T[],
    ): Promise<Result<T[]>> {
      const inserted: T[] = [];
      for (const record of records) {
        const id = record.id || crypto.randomUUID();
        const stored = { ...record, id } as StoredRecord;
        collectionOf(collection).set(id, stored);
        inserted.push(asRecord<T>(stored));
      }
      return ok(inserted);
    },
  };
  return toEffectDataProvider(impl);
}
