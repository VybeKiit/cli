import type { MongoConfig } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import { MINIMAL_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import type { DataProvider, DbRecord, QueryFilter } from '@vybekiit/db/types';
// `mongodb` is the official MongoDB driver. We target MongoDB Atlas — the managed
// cloud Mongo the agent's save-data skill provisions — reached via the SRV
// connection string in `MONGODB_URI`. Chosen over a thin REST wrapper because the
// driver pools connections internally and is the canonical, well-supported client.
import { type Collection, type Filter, MongoClient } from 'mongodb';

/**
 * Build the MongoDB (Atlas) {@link DataProvider} — the opt-in document backend a
 * buyer selects with `DATA_PROVIDER=mongodb` (ADR-0002).
 *
 * A single {@link MongoClient} is constructed here and reused across every call:
 * the driver pools connections internally, so one client per process is the
 * intended usage. Connecting is lazy (the driver dials on first operation), so the
 * factory stays synchronous and matches the other adapters' construction shape.
 *
 * Cross-provider contract note: VybeKiit records key off a plain string `id` field.
 * This adapter deliberately stores/reads `id` as a NORMAL document field and leaves
 * Mongo's own `_id` untouched, so the record shape is byte-for-byte identical to
 * what Supabase and DynamoDB return — a skill written against {@link DbRecord} never
 * sees a vendor-specific key. The auto-generated `_id` is projected/stripped out of
 * every returned document so the result matches {@link DbRecord} exactly.
 *
 * Each method maps a driver error into a tagged DB failure with the same stable
 * codes the Supabase adapter uses.
 *
 * @param config - Validated MongoDB config.
 * @returns Data provider backed by MongoDB.
 * @example
 * const provider = createMongoDataProvider(config);
 */
export const createMongoDataProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Adapter methods stay colocated with shared Mongo client state.
  (config: MongoConfig): DataProvider => {
    const client = new MongoClient(config.MONGODB_URI);
    const db = client.db(config.MONGODB_DB);

    /** Projection that drops Mongo's `_id` so returned docs match {@link DbRecord}. */
    const withoutMongoId = { projection: { _id: 0 } } as const;

    // Tables are buyer-defined at runtime (the save-data skill creates them), so no
    // compile-time schema exists. We type every collection against {@link DbRecord}
    // once here so method bodies stay record-typed and results narrow to `T` cleanly,
    // rather than wrestling the driver's generic `Document` per call.
    const records = (name: string): Collection<DbRecord> => db.collection<DbRecord>(name);

    return {
      name: 'mongodb',
      capabilities: MINIMAL_CAPABILITIES,

      insert: <T extends DbRecord>(collection: string, record: T) =>
        tryDb(
          'db_insert_failed',
          async () => {
            await records(collection).insertOne({ ...record });
            return record;
          },
          'unknown MongoDB error',
        ),

      get: <T extends DbRecord>(collection: string, id: string) =>
        tryDb(
          'db_get_failed',
          async () => {
            // The `_id` projection makes the returned row match `T`; the driver still
            // types it as `WithId<DbRecord>`, so we narrow to `T` at this boundary.
            const doc = await records(collection).findOne({ id }, withoutMongoId);
            if (doc === null) {
              return null;
            }
            return doc as T;
          },
          'unknown MongoDB error',
        ),

      query: <T extends DbRecord>(collection: string, filter: QueryFilter<T>) =>
        tryDb(
          'db_query_failed',
          async () => {
            const docs = await records(collection)
              .find(filter as Filter<DbRecord>, withoutMongoId)
              .toArray();
            return docs as T[];
          },
          'unknown MongoDB error',
        ),

      update: <T extends DbRecord>(collection: string, id: string, patch: Partial<Omit<T, 'id'>>) =>
        tryDb(
          'db_update_failed',
          async () => {
            const doc = await records(collection).findOneAndUpdate(
              { id },
              { $set: patch },
              { returnDocument: 'after', projection: { _id: 0 } },
            );
            if (!doc) {
              throw new Error(`No ${collection} record with id ${id}`);
            }
            return doc as T;
          },
          'unknown MongoDB error',
        ),

      remove: (collection: string, id: string) =>
        tryDb(
          'db_remove_failed',
          async () => {
            await records(collection).deleteOne({ id });
            return true as const;
          },
          'unknown MongoDB error',
        ),
    };
  };
