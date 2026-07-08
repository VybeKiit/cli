import { failDb } from '@vybekiit/db/providerEffect';
import { LOCAL_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import type { DataProvider, DbError, DbRecord, QueryFilter } from '@vybekiit/db/types';
import { Effect } from 'effect';

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
 * @param row - Stored in-memory row to copy.
 * @returns Row narrowed to the caller's record type.
 * @example
 * const order = asRecord<OrderRecord>(storedRow);
 */
const asRecord = <T extends DbRecord>(row: StoredRecord): T => ({ ...row }) as unknown as T;

/**
 * Resolve the stored id for a local record.
 *
 * @param id - Caller-provided record id.
 * @returns The provided id, or a generated id when the caller supplied an empty string.
 * @example
 * const id = recordId(record.id);
 */
const recordId = (id: string): string => {
  if (id.length === 0) {
    return crypto.randomUUID();
  }
  return id;
};

/**
 * Build the zero-config {@link DataProvider} — VybeKiit's in-memory dev fallback
 * (ADR-0008). It takes no config and no dependencies: a freshly scaffolded app with
 * no `.env` resolves to this so the first `pnpm dev` runs, and it doubles as the
 * network-free contract-conformance fixture for the {@link DataProvider} interface.
 *
 * @returns Data provider backed by process memory.
 * @example
 * const provider = createLocalDataProvider();
 */
export const createLocalDataProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: In-memory adapter methods stay together around one process-local store.
  (): DataProvider => {
    const store: Store = new Map();

    /**
     * Resolve the collection's row map, creating it on first touch.
     *
     * @param collection - Collection name to open.
     * @returns Mutable row map for the collection.
     * @example
     * const rows = collectionOf('orders');
     */
    const collectionOf = (collection: string): Map<string, StoredRecord> => {
      let rows = store.get(collection);
      if (rows === undefined) {
        rows = new Map();
        store.set(collection, rows);
      }
      return rows;
    };

    return {
      name: 'local',
      capabilities: LOCAL_CAPABILITIES,

      insert: <T extends DbRecord>(collection: string, record: T) => {
        // Mirror a real backend assigning a primary key when the caller omits one.
        const id = recordId(record.id);
        // The store widens each `T` to one indexable shape; this is the only place a
        // row enters the store, so the widening cast lives here, once.
        const stored = { ...record, id } as StoredRecord;
        collectionOf(collection).set(id, stored);
        return Effect.succeed(asRecord<T>(stored));
      },

      get: <T extends DbRecord>(
        collection: string,
        id: string,
      ): Effect.Effect<T | null, DbError> => {
        const row = collectionOf(collection).get(id);
        if (row === undefined) {
          return Effect.succeed(null);
        }
        return Effect.succeed(asRecord<T>(row));
      },

      query: <T extends DbRecord>(collection: string, filter: QueryFilter<T>) => {
        const fields = Object.entries(filter);
        const matches = [...collectionOf(collection).values()]
          .filter((row) => fields.every(([key, value]) => row[key] === value))
          .map((row) => asRecord<T>(row));
        return Effect.succeed(matches);
      },

      update: <T extends DbRecord>(
        collection: string,
        id: string,
        patch: Partial<Omit<T, 'id'>>,
      ) => {
        const rows = collectionOf(collection);
        const existing = rows.get(id);
        if (existing === undefined) {
          return failDb('not_found', `No record ${id} in ${collection}.`);
        }
        // `id` is fixed: `patch` cannot carry it (Omit<T,'id'>), so it can't be overwritten.
        const updated = { ...existing, ...patch, id } as StoredRecord;
        rows.set(id, updated);
        return Effect.succeed(asRecord<T>(updated));
      },

      remove: (collection: string, id: string) => {
        const removed = collectionOf(collection).delete(id);
        if (removed === false) {
          return failDb('not_found', `No record ${id} in ${collection}.`);
        }
        return Effect.succeed(true);
      },

      upsert: <T extends DbRecord>(
        collection: string,
        record: T,
        conflictKey: keyof T & string,
      ) => {
        const rows = [...collectionOf(collection).values()];
        const existing = rows.find((row) => row[conflictKey] === record[conflictKey]);
        if (existing !== undefined) {
          const updated = { ...existing, ...record, id: existing.id } as StoredRecord;
          collectionOf(collection).set(existing.id, updated);
          return Effect.succeed(asRecord<T>(updated));
        }
        const id = recordId(record.id);
        const stored = { ...record, id } as StoredRecord;
        collectionOf(collection).set(id, stored);
        return Effect.succeed(asRecord<T>(stored));
      },

      idempotentInsert: <T extends DbRecord>(
        collection: string,
        record: T,
        dedupeKey: keyof T & string,
      ) => {
        const rows = [...collectionOf(collection).values()];
        const existing = rows.find((row) => row[dedupeKey] === record[dedupeKey]);
        if (existing !== undefined) {
          return Effect.succeed(asRecord<T>(existing));
        }
        const id = recordId(record.id);
        const stored = { ...record, id } as StoredRecord;
        collectionOf(collection).set(id, stored);
        return Effect.succeed(asRecord<T>(stored));
      },

      fullTextSearch: <T extends DbRecord>(collection: string, query: string, _limit: number) => {
        const needle = query.toLowerCase();
        const matches = [...collectionOf(collection).values()]
          .filter((row) => {
            const { content } = row;
            return typeof content === 'string' && content.toLowerCase().includes(needle);
          })
          .map((row) => asRecord<T>(row));
        return Effect.succeed(matches);
      },

      bulkInsert: <T extends DbRecord>(collection: string, records: readonly T[]) => {
        const inserted: T[] = [];
        for (const record of records) {
          const id = recordId(record.id);
          const stored = { ...record, id } as StoredRecord;
          collectionOf(collection).set(id, stored);
          inserted.push(asRecord<T>(stored));
        }
        return Effect.succeed(inserted);
      },
    };
  };
